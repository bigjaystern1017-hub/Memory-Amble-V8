import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { EducationSlides } from "@/components/education-slides";
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
  recallAssignmentIndex,
} from "@/components/beat-engine";
import {
  getLessonConfig,
  getNextLevel,
  shouldSwitchCategory,
  todayStr,
  yesterdayStr,
  levelLabel,
  type ProgressData,
  type SessionData,
} from "@/lib/progress";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Brain, ArrowRight, Lightbulb, LogOut, Flame, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  sender: "timbuk" | "gladys";
  text: string;
  typewriter?: boolean;
}

async function authFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(path, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function Amble() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, signOut, displayName } = useAuth();

  const isGuest = !isAuthenticated;

  const [phase, setPhase] = useState<"loading" | "education" | "chat">("loading");
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

  const [progressData, setProgressData] = useState<ProgressData>({
    currentDay: 1,
    currentLevel: 3,
    currentCategory: "objects",
    dayCount: 0,
    streak: 0,
    lastLogin: null,
  });

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
        const response = await fetch("/api/assign-objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stops: currentState.stops,
            category: currentState.category,
          }),
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

  const savePalaceToDB = useCallback(async (stops: string[]) => {
    if (isGuest) return;
    try {
      const locations = stops.map((name, i) => ({
        locationName: name,
        position: i + 1,
      }));
      await authFetch("/api/palaces", {
        method: "POST",
        body: JSON.stringify({ locations }),
      });
    } catch (e) {
      console.error("Failed to save palace:", e);
    }
  }, [isGuest]);

  const saveSessionToDB = useCallback(async (s: ConversationState) => {
    if (isGuest) return;
    try {
      await authFetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          date: todayStr(),
          level: s.itemCount,
          category: s.category,
          score: s.correctCount,
          totalItems: s.itemCount,
          assignments: s.assignments,
          placeName: s.placeName,
          stops: s.stops,
        }),
      });
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  }, [isGuest]);

  const saveProgressToDB = useCallback(async (pd: ProgressData) => {
    if (isGuest) return;
    try {
      const res = await authFetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          currentDay: pd.currentDay,
          currentLevel: pd.currentLevel,
          currentCategory: pd.currentCategory,
          dayCount: pd.dayCount,
        }),
      });
      const saved = await res.json();
      setProgressData({
        currentDay: saved.currentDay,
        currentLevel: saved.currentLevel,
        currentCategory: saved.currentCategory,
        dayCount: saved.dayCount,
        streak: saved.streak,
        lastLogin: saved.lastLogin,
      });
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
  }, [isGuest]);

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
            "Oh dear, I had a little hiccup picking the items. Could you tap the button below to let me try again?"
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

      if (beat === "graduation-offer") {
        const graduated = { ...currentState, graduated: true };
        updateState(graduated);
        setShowContinue(true);
        return;
      }

      if (beat === "final") {
        setIsFinished(true);
        const nextLevel = getNextLevel(
          progressData.currentLevel,
          currentState.correctCount,
          currentState.itemCount
        );
        const nextDayCount = progressData.dayCount + 1;
        const nextCategory = shouldSwitchCategory(nextDayCount, progressData.currentCategory as "objects" | "names");
        const newProgress: ProgressData = {
          currentDay: progressData.currentDay + 1,
          currentLevel: nextLevel,
          currentCategory: nextCategory,
          dayCount: nextDayCount,
          streak: progressData.streak,
          lastLogin: todayStr(),
        };
        await saveSessionToDB(currentState);
        await savePalaceToDB(currentState.stops);
        await saveProgressToDB(newProgress);
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
        if (beat === "react-check-in" && (next === "check-in-done" || next === "welcome")) {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "mirror-object" && next === "walkthrough-intro") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "check-in-done") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        setCurrentBeat(next);
        await advanceBeat(next, nextState);
      }
    },
    [showTimbukWithTypewriter, addTimbukInstant, scrollToBottom, fetchAssignments, updateState, saveProgressToDB, saveSessionToDB, savePalaceToDB, progressData]
  );

  const advanceBeatRef = useRef(advanceBeat);
  advanceBeatRef.current = advanceBeat;

  useEffect(() => {
    if (authLoading || initRef.current) return;
    initRef.current = true;

    if (isGuest) {
      const educationSeen = localStorage.getItem("memoryamble_education_seen");
      if (!educationSeen) {
        setPhase("education");
        return;
      }

      const lesson = getLessonConfig(3, 0, "objects");
      const s = createFreshState();
      s.userName = "friend";
      s.lessonConfig = lesson;
      s.itemCount = lesson.itemCount;
      s.category = lesson.category;
      s.dayCount = 0;
      updateState(s);
      setPhase("chat");
      setTimeout(() => {
        advanceBeatRef.current("welcome", s);
      }, 300);
      return;
    }

    const init = async () => {
      try {
        const [progressRes, latestSessionRes] = await Promise.all([
          authFetch("/api/progress"),
          authFetch("/api/sessions/latest"),
        ]);

        const pd: ProgressData = await progressRes.json();
        setProgressData(pd);

        let latestSession: SessionData | null = null;
        const sessionBody = await latestSessionRes.json();
        if (sessionBody && sessionBody.date) {
          latestSession = sessionBody;
        }

        const educationSeen = localStorage.getItem("memoryamble_education_seen");
        if (!educationSeen) {
          setPhase("education");
          return;
        }

        const lesson = getLessonConfig(pd.currentLevel, pd.dayCount, pd.currentCategory as "objects" | "names");
        const s = createFreshState();
        s.userName = displayName;
        s.isReturningUser = pd.dayCount > 0;
        s.lessonConfig = lesson;
        s.itemCount = lesson.itemCount;
        s.category = lesson.category;
        s.dayCount = pd.dayCount;

        const completedToday = latestSession && latestSession.date === todayStr();
        if (completedToday) {
          updateState(s);
          setPhase("chat");
          setIsFinished(true);
          setTimeout(() => {
            const id = ++msgIdRef.current;
            setMessages([{
              id,
              sender: "timbuk",
              text: `Welcome back, ${displayName}! You've already completed today's walk. Come back tomorrow for a new challenge!`,
            }]);
          }, 200);
          return;
        }

        const hasYesterdaySession = latestSession && latestSession.date === yesterdayStr();

        if (hasYesterdaySession && latestSession && pd.dayCount > 0) {
          s.checkInAssignments = latestSession.assignments;
          s.checkInPlace = latestSession.placeName;

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
      } catch (e) {
        console.error("Failed to load progress:", e);
        setPhase("education");
      }
    };

    init();
  }, [authLoading, isGuest, displayName, updateState]);

  const handleEducationComplete = useCallback(() => {
    localStorage.setItem("memoryamble_education_seen", "true");

    const lesson = getLessonConfig(
      progressData.currentLevel,
      progressData.dayCount,
      progressData.currentCategory as "objects" | "names"
    );
    const s = createFreshState();
    s.userName = isGuest ? "friend" : displayName;
    s.lessonConfig = lesson;
    s.itemCount = lesson.itemCount;
    s.category = lesson.category;
    s.dayCount = progressData.dayCount;
    updateState(s);
    setPhase("chat");
    setTimeout(() => {
      advanceBeatRef.current("welcome", s);
    }, 200);
  }, [displayName, isGuest, progressData, updateState]);

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
      const response = await fetch("/api/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object: assignment.object,
          stopName: assignment.stopName,
          placeName: s.placeName,
        }),
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
          const ri = recallAssignmentIndex(idx, s);
          const assoc = s.assignments[ri];
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

  const handleNewPalace = () => {
    if (isGuest) {
      navigate("/login");
      return;
    }

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

    const lesson = getLessonConfig(
      progressData.currentLevel,
      progressData.dayCount,
      progressData.currentCategory as "objects" | "names"
    );
    const s = createFreshState();
    s.userName = displayName;
    s.lessonConfig = lesson;
    s.itemCount = lesson.itemCount;
    s.category = lesson.category;
    s.dayCount = progressData.dayCount;
    s.isReturningUser = true;
    updateState(s);
    msgIdRef.current = 0;
    processingRef.current = false;

    setTimeout(() => {
      advanceBeatRef.current("welcome", s);
    }, 200);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-background" data-testid="loading">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : -1;
  const lesson = state.lessonConfig;
  const dayLabel = lesson ? `Day ${state.dayCount + 1}: ${lesson.title}` : "";
  const lvl = levelLabel(progressData.currentLevel);

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center h-dvh bg-background" data-testid="loading">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Setting up your palace...</p>
        </div>
      </div>
    );
  }

  if (phase === "education") {
    return (
      <div className="flex flex-col h-dvh bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" data-testid="app-container">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight" data-testid="text-app-title">
                MemoryAmble
              </h1>
            </div>
            {isGuest ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")} data-testid="button-header-signin">
                Sign In
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground" data-testid="button-signout">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            )}
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
              {dayLabel ? (
                <p className="text-sm font-serif italic text-muted-foreground" data-testid="text-day-label">
                  {dayLabel}
                </p>
              ) : isGuest ? null : (
                <p className="text-sm text-muted-foreground" data-testid="text-username">{displayName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isGuest && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-level-info">
                <span>Level {lvl}</span>
                <span className="text-border">|</span>
                <span>{progressData.currentLevel} items</span>
                {progressData.streak > 1 && (
                  <>
                    <span className="text-border">|</span>
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>{progressData.streak}</span>
                  </>
                )}
              </div>
            )}
            {isGuest ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/login")} data-testid="button-header-signin">
                Sign In
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1 text-muted-foreground" data-testid="button-signout">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
        {dayLabel && !isGuest && (
          <div className="bg-primary/5 border-t border-b border-border/30">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-2 flex items-center justify-center gap-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground" data-testid="text-daily-focus">
                Today's Focus: {lesson?.focus}
              </p>
              <div className="sm:hidden flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="text-border">|</span>
                <span>Lvl {lvl}</span>
                {progressData.streak > 1 && (
                  <>
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{progressData.streak}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
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
            <div className="text-center space-y-3">
              {isGuest ? (
                <>
                  <p className="text-muted-foreground">
                    Great first walk! Create an account to save your progress and continue tomorrow.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => navigate("/login")}
                      className="gap-2"
                      data-testid="button-signup-prompt"
                    >
                      <LogIn className="w-5 h-5" />
                      Create Account
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/")}
                      data-testid="button-back-home"
                    >
                      Back Home
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNewPalace}
                  className="gap-2"
                  data-testid="button-new-palace"
                >
                  <ArrowRight className="w-5 h-5" />
                  Build Another Palace
                </Button>
              )}
            </div>
          ) : genError ? (
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleRetry}
                className="gap-2"
                data-testid="button-retry"
              >
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
      <button
        onClick={() => { localStorage.clear(); window.location.reload(); }}
        className="fixed bottom-2 right-2 z-[9999] px-2 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground bg-transparent cursor-pointer"
        data-testid="button-dev-reset"
      >
        Dev Reset
      </button>
    </div>
  );
}
