import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { EducationSlides } from "@/components/education-slides";
import { NameEntry } from "@/components/name-entry";
import { ProgressBar } from "@/components/progress-bar";
import {
  type BeatId,
  type ConversationState,
  createFreshState,
  getTimbukMessage,
  getNextBeat,
  beatNeedsUserInput,
  beatNeedsContinueButton,
  getInputPlaceholder,
  getProgressStep,
} from "@/components/beat-engine";
import {
  loadProgress,
  saveProgress,
  clearProgress,
  initProgress,
  getYesterdaySession,
  computeNextLevel,
  shouldSwitchCategory,
  recordSession,
  hasCompletedToday,
} from "@/lib/progress";
import { apiRequest } from "@/lib/queryClient";
import { Brain, RotateCcw, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  sender: "timbuk" | "gladys";
  text: string;
  typewriter?: boolean;
}

export default function Home() {
  const [phase, setPhase] = useState<"education" | "name" | "chat">("education");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBeat, setCurrentBeat] = useState<BeatId>("welcome");
  const [isTyping, setIsTyping] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [genError, setGenError] = useState(false);
  const [showSparkButton, setShowSparkButton] = useState(false);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [typewriterBusy, setTypewriterBusy] = useState(false);
  const [state, setState] = useState<ConversationState>(createFreshState());

  const msgIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const typewriterResolveRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const progressStep = getProgressStep(currentBeat);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, []);

  const addUserMessage = useCallback(
    (text: string) => {
      const id = ++msgIdRef.current;
      setMessages((prev) => [...prev, { id, sender: "gladys", text }]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const showTimbukWithTypewriter = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        setIsTyping(true);
        scrollToBottom();
        setTimeout(() => {
          setIsTyping(false);
          const id = ++msgIdRef.current;
          setMessages((prev) => [...prev, { id, sender: "timbuk", text, typewriter: true }]);
          setTypewriterBusy(true);
          typewriterResolveRef.current = resolve;
          scrollToBottom();
        }, 500);
      });
    },
    [scrollToBottom]
  );

  const handleTypewriterDone = useCallback(() => {
    setTypewriterBusy(false);
    if (typewriterResolveRef.current) {
      const resolve = typewriterResolveRef.current;
      typewriterResolveRef.current = null;
      resolve();
    }
  }, []);

  const addTimbukInstant = useCallback(
    (text: string) => {
      const id = ++msgIdRef.current;
      setMessages((prev) => [...prev, { id, sender: "timbuk", text }]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  const fetchAssignments = useCallback(
    async (currentState: ConversationState): Promise<ConversationState | null> => {
      try {
        const response = await apiRequest("POST", "/api/assign-objects", {
          stops: currentState.stops,
          category: currentState.category,
        });
        const data = await response.json();
        return { ...currentState, assignments: data.assignments, stepIndex: 0 };
      } catch {
        return null;
      }
    },
    []
  );

  const updateState = useCallback((s: ConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const advanceBeat = useCallback(
    async (beat: BeatId, currentState: ConversationState) => {
      if (beat === "assigning") {
        setIsTyping(true);
        scrollToBottom();
        const newState = await fetchAssignments(currentState);
        setIsTyping(false);

        if (!newState || !newState.assignments?.length) {
          setGenError(true);
          addTimbukInstant(
            "Oh dear, I had a little hiccup picking the objects. Could you tap the button below to let me try again?"
          );
          return;
        }

        updateState(newState);
        const nextBeat = getNextBeat("assigning", newState);
        if (nextBeat) {
          setCurrentBeat(nextBeat);
          await advanceBeat(nextBeat, newState);
        }
        return;
      }

      const text = getTimbukMessage(beat, currentState);
      if (!text) return;

      await showTimbukWithTypewriter(text);

      if (beat === "final") {
        setIsFinished(true);
        const progress = loadProgress();
        if (progress) {
          const updated = recordSession(progress, {
            level: currentState.itemCount,
            category: currentState.category,
            score: currentState.correctCount,
            totalItems: currentState.itemCount,
            assignments: currentState.assignments,
            placeName: currentState.placeName,
            stops: currentState.stops,
          });
          saveProgress(updated);
        }
        return;
      }

      if (beatNeedsContinueButton(beat)) {
        setShowContinue(true);
        return;
      }

      if (beatNeedsUserInput(beat)) {
        setInputEnabled(true);
        setShowSparkButton(beat === "place-object");
        return;
      }

      const next = getNextBeat(beat, currentState);
      if (next) {
        let nextState = currentState;
        if (
          (beat === "react-stop" && next === "ask-stop") ||
          (beat === "mirror-object" && next === "place-object") ||
          (beat === "react-recall" && next === "recall") ||
          (beat === "react-check-in" && next === "check-in-recall")
        ) {
          nextState = { ...currentState, stepIndex: currentState.stepIndex + 1 };
          updateState(nextState);
        }
        if (beat === "react-stop" && next === "assigning") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "react-check-in" && (next === "check-in-done" || next === "graduation-offer" || next === "welcome")) {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "mirror-object" && next === "walkthrough-intro") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "react-recall" && next === "final") {
          nextState = currentState;
        }
        if (beat === "check-in-done") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        setCurrentBeat(next);
        await advanceBeat(next, nextState);
      }
    },
    [showTimbukWithTypewriter, addTimbukInstant, scrollToBottom, fetchAssignments, updateState]
  );

  const advanceBeatRef = useRef(advanceBeat);
  advanceBeatRef.current = advanceBeat;

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const progress = loadProgress();
    if (progress && progress.userName && progress.hasSeenEducation) {
      if (hasCompletedToday(progress)) {
        setPhase("chat");
        const s = createFreshState();
        s.userName = progress.userName;
        s.itemCount = progress.currentLevel;
        s.category = progress.currentCategory;
        s.isReturningUser = true;
        updateState(s);
        setIsFinished(true);
        setTimeout(() => {
          const id = ++msgIdRef.current;
          setMessages([{
            id,
            sender: "timbuk",
            text: `Welcome back, ${progress.userName}! You've already completed today's walk. Come back tomorrow for a new challenge!`,
          }]);
        }, 200);
        return;
      }

      const yesterday = getYesterdaySession(progress);
      const nextLevel = computeNextLevel(progress);
      const switchCat = shouldSwitchCategory(progress);
      const newCategory = switchCat ? "names" as const : progress.currentCategory;

      const s = createFreshState();
      s.userName = progress.userName;
      s.isReturningUser = true;
      s.category = newCategory;
      s.itemCount = progress.currentLevel;

      if (yesterday) {
        s.checkInAssignments = yesterday.assignments;
        s.checkInPlace = yesterday.placeName;

        if (yesterday.score === yesterday.totalItems && nextLevel > progress.currentLevel) {
          s.graduatedLevel = nextLevel;
        }

        updateState(s);
        setPhase("chat");
        setTimeout(() => {
          setCurrentBeat("check-in-intro");
          advanceBeatRef.current("check-in-intro", s);
        }, 300);
      } else {
        updateState(s);
        setPhase("chat");
        setTimeout(() => {
          advanceBeatRef.current("welcome", s);
        }, 300);
      }
      return;
    }
  }, [updateState]);

  const handleEducationComplete = useCallback(() => {
    setPhase("name");
  }, []);

  const handleNameSubmit = useCallback((name: string) => {
    const progress = loadProgress();
    if (progress) {
      progress.userName = name;
      progress.hasSeenEducation = true;
      saveProgress(progress);
    } else {
      saveProgress(initProgress(name));
    }

    const s = { ...stateRef.current, userName: name };
    updateState(s);
    setPhase("chat");
    setTimeout(() => {
      advanceBeatRef.current("welcome", s);
    }, 200);
  }, [updateState]);

  const handleContinue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setShowContinue(false);

    const s = stateRef.current;
    const next = getNextBeat(currentBeat, s);
    if (next) {
      setCurrentBeat(next);
      await advanceBeatRef.current(next, s);
    }
    processingRef.current = false;
  }, [currentBeat]);

  const handleRetry = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setGenError(false);
    setCurrentBeat("assigning");
    await advanceBeatRef.current("assigning", stateRef.current);
    processingRef.current = false;
  }, []);

  const handleSpark = useCallback(async () => {
    if (sparkLoading) return;
    setSparkLoading(true);

    const s = stateRef.current;
    const assignment = s.assignments[s.stepIndex];

    if (!assignment) {
      setSparkLoading(false);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/spark", {
        object: assignment.object,
        stopName: assignment.stopName,
        placeName: s.placeName,
      });
      const data = await response.json();
      if (data.spark) {
        addTimbukInstant(`Here's a little nudge: "${data.spark}"\n\nBut make it yours, ${s.userName}. What do you actually see?`);
      }
    } catch {
      addTimbukInstant("Hmm, my imagination took a coffee break. No worries -- just tell me the first silly thing that pops into your head!");
    }
    setSparkLoading(false);
  }, [sparkLoading, addTimbukInstant]);

  const handleUserInput = useCallback(
    async (text: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setInputEnabled(false);
      setShowSparkButton(false);
      addUserMessage(text);

      let s = { ...stateRef.current };
      const beat = currentBeat;
      const idx = s.stepIndex;

      switch (beat) {
        case "check-in-recall": {
          const newAnswers = [...s.checkInAnswers];
          newAnswers[idx] = text;
          const a = s.checkInAssignments[idx];
          let addCorrect = 0;
          if (a) {
            const keyword = a.object
              .replace(/^a\s+/i, "")
              .replace(/^an\s+/i, "")
              .replace(/^the\s+/i, "")
              .split(" ").pop()?.toLowerCase() || "";
            if (text.toLowerCase().includes(keyword)) addCorrect = 1;
          }
          s = { ...s, checkInAnswers: newAnswers, checkInCorrectCount: s.checkInCorrectCount + addCorrect };
          break;
        }

        case "graduation-offer": {
          const accepted = /yes|sure|ok|let'?s|go for it|ready|absolutely|definitely/i.test(text);
          if (accepted && s.graduatedLevel) {
            s = { ...s, itemCount: s.graduatedLevel };
            const progress = loadProgress();
            if (progress) {
              progress.currentLevel = s.graduatedLevel;
              saveProgress(progress);
            }
          }
          s = { ...s, graduatedLevel: null };
          break;
        }

        case "ask-place":
          s = { ...s, placeName: text };
          break;

        case "ask-stop":
          s = { ...s, stops: [...s.stops, text] };
          break;

        case "place-object": {
          const newScenes = [...s.userScenes];
          newScenes[idx] = text;
          s = { ...s, userScenes: newScenes };
          break;
        }

        case "recall": {
          const newAnswers = [...s.userAnswers];
          newAnswers[idx] = text;
          const assoc = s.assignments[idx];
          let addCorrect = 0;
          if (assoc) {
            const keyword = assoc.object
              .replace(/^a\s+/i, "")
              .replace(/^an\s+/i, "")
              .replace(/^the\s+/i, "")
              .split(" ").pop()?.toLowerCase() || "";
            if (text.toLowerCase().includes(keyword)) addCorrect = 1;
          }
          s = { ...s, userAnswers: newAnswers, correctCount: s.correctCount + addCorrect };
          break;
        }
      }

      updateState(s);

      const next = getNextBeat(beat, s);
      if (next) {
        setCurrentBeat(next);
        await advanceBeatRef.current(next, s);
      }
      processingRef.current = false;
    },
    [currentBeat, addUserMessage, updateState]
  );

  const handleRestart = () => {
    clearProgress();
    setPhase("education");
    setMessages([]);
    setCurrentBeat("welcome");
    setIsTyping(false);
    setInputEnabled(false);
    setShowContinue(false);
    setIsFinished(false);
    setGenError(false);
    setShowSparkButton(false);
    setSparkLoading(false);
    setTypewriterBusy(false);
    typewriterResolveRef.current = null;
    updateState(createFreshState());
    msgIdRef.current = 0;
    processingRef.current = false;
    initRef.current = false;
  };

  const handleNewPalace = () => {
    setMessages([]);
    setCurrentBeat("welcome");
    setIsTyping(false);
    setInputEnabled(false);
    setShowContinue(false);
    setIsFinished(false);
    setGenError(false);
    setShowSparkButton(false);
    setSparkLoading(false);
    setTypewriterBusy(false);
    typewriterResolveRef.current = null;

    const progress = loadProgress();
    const s = createFreshState();
    if (progress) {
      s.userName = progress.userName;
      s.itemCount = progress.currentLevel;
      s.category = progress.currentCategory;
      s.isReturningUser = true;
    }
    updateState(s);
    msgIdRef.current = 0;
    processingRef.current = false;

    setTimeout(() => {
      advanceBeatRef.current("welcome", s);
    }, 200);
  };

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : -1;
  const levelLabel = state.itemCount > 0 ? `Level ${Math.ceil((state.itemCount - 1) / 2)} -- ${state.itemCount} items` : "";

  if (phase === "education") {
    return (
      <div className="flex flex-col h-dvh bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" data-testid="app-container">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
                MemoryAmble
              </h1>
              <p className="text-sm text-muted-foreground">Coach Timbuk</p>
            </div>
          </div>
          <div className="border-t border-border/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6">
              <ProgressBar currentStep={0} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <EducationSlides onComplete={handleEducationComplete} />
        </div>
      </div>
    );
  }

  if (phase === "name") {
    return (
      <div className="flex flex-col h-dvh bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" data-testid="app-container">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
                MemoryAmble
              </h1>
              <p className="text-sm text-muted-foreground">Coach Timbuk</p>
            </div>
          </div>
          <div className="border-t border-border/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6">
              <ProgressBar currentStep={0} />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <NameEntry onSubmit={handleNameSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" data-testid="app-container">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
                MemoryAmble
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="text-level-info">
                {levelLabel || "Coach Timbuk"}
              </p>
            </div>
          </div>
          {isFinished && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRestart}
              className="gap-2"
              data-testid="button-restart"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </Button>
          )}
        </div>
        <div className="border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <ProgressBar currentStep={progressStep} />
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        data-testid="chat-scroll"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
              typewriter={msg.typewriter && msg.id === lastMessageId}
              onTypewriterDone={msg.id === lastMessageId ? handleTypewriterDone : undefined}
            />
          ))}
          {isTyping && <ChatMessage sender="timbuk" text="" isTyping />}
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
          {isFinished ? (
            <div className="text-center space-y-2">
              <Button
                size="lg"
                onClick={handleNewPalace}
                className="gap-2"
                data-testid="button-new-palace"
              >
                <ArrowRight className="w-5 h-5" />
                Build Another Palace
              </Button>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-2 text-muted-foreground"
                  data-testid="button-restart-bottom"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Everything
                </Button>
              </div>
            </div>
          ) : genError ? (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleRetry}
                className="gap-2"
                data-testid="button-retry"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </Button>
            </div>
          ) : showContinue ? (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleContinue}
                className="gap-2"
                data-testid="button-continue"
              >
                I'm Ready, Let's Go!
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <ChatInput
                onSend={handleUserInput}
                placeholder={getInputPlaceholder(currentBeat, state)}
                disabled={!inputEnabled || isTyping || typewriterBusy}
              />
              {showSparkButton && inputEnabled && !typewriterBusy && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSpark}
                    disabled={sparkLoading}
                    className="gap-2 text-muted-foreground"
                    data-testid="button-spark"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {sparkLoading ? "Thinking..." : "Stuck? Get a spark from Timbuk"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
