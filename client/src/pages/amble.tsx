import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { EducationSlides } from "@/components/education-slides";
import { NameEntry } from "@/components/name-entry";
import { ProgressBar } from "@/components/progress-bar";
import { AmbleResults, type PendingSessionData } from "@/components/amble-results";
import {
  type BeatId,
  type ConversationState,
  createFreshState,
  getTimbukMessage,
  getNextBeat,
  beatNeedsUserInput,
  beatNeedsContinueButton,
  getContinueButtonLabel,
  getInputPlaceholder,
  getProgressStep,
  recallAssignmentIndex,
  isStrugglePhrase,
  SMART_CONFIRM,
  getMirrorObjectFallback,
  getReactRecallFallback,
  getReactStopFallback,
  getReactStopRouteAppend,
  getReactPlaceFallback,
  getReactPlaceStopIntro,
  stopPhrase,
  yourify,
} from "@/components/beat-engine";
import {
  getLessonConfig,
  getGuestProgressFromDay,
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
  variant?: "wisdom";
}

const BURST_PARTICLES: { tx: string; ty: string; color: string; delay: string; size: number }[] = [
  { tx: "120px",   ty: "0px",    color: "#f59e0b", delay: "0ms",  size: 10 },
  { tx: "104px",   ty: "-60px",  color: "#fcd34d", delay: "30ms", size: 8  },
  { tx: "60px",    ty: "-104px", color: "#f59e0b", delay: "0ms",  size: 12 },
  { tx: "0px",     ty: "-120px", color: "#fbbf24", delay: "50ms", size: 8  },
  { tx: "-60px",   ty: "-104px", color: "#f59e0b", delay: "20ms", size: 10 },
  { tx: "-104px",  ty: "-60px",  color: "#fcd34d", delay: "0ms",  size: 8  },
  { tx: "-120px",  ty: "0px",    color: "#f59e0b", delay: "40ms", size: 12 },
  { tx: "-104px",  ty: "60px",   color: "#fbbf24", delay: "10ms", size: 8  },
  { tx: "-60px",   ty: "104px",  color: "#f59e0b", delay: "0ms",  size: 10 },
  { tx: "0px",     ty: "120px",  color: "#fcd34d", delay: "30ms", size: 8  },
  { tx: "60px",    ty: "104px",  color: "#f59e0b", delay: "50ms", size: 12 },
  { tx: "104px",   ty: "60px",   color: "#fbbf24", delay: "20ms", size: 8  },
];

function ordinal(n: number): string {
  const words = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];
  return words[n - 1] || `#${n}`;
}

function getStopNameForBeat(beat: BeatId, state: ConversationState): string {
  if (beat === "place-object") {
    return state.assignments[state.stepIndex]?.stopName || "";
  }
  return state.stops[0] || "";
}

function cleanPlaceName(input: string): string {
  let s = input.trim();
  if (s.toLowerCase().startsWith('my ')) {
    s = 'your ' + s.slice(3);
  }
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace(/\b(in|at|near|on)\s+([a-z])/g, 
    (_, prep, letter) => `${prep} ${letter.toUpperCase()}`
  );
  return s;
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
  const { isAuthenticated, isLoading: authLoading, signOut, displayName, user } = useAuth();

  const isGuest = !isAuthenticated;

  function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({length: m + 1}, (_, i) => 
      Array.from({length: n + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1] 
          ? dp[i-1][j-1] 
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  const fuzzyMatch = (userAnswer: string, correctObject: string): boolean => {
    const normalize = (s: string) => s.toLowerCase()
      .replace(/[^\w]/g, '')
      .trim();

    const a = normalize(userAnswer);
    const c = normalize(correctObject);

    if (a === c) return true;
    if (a.includes(c) || c.includes(a)) return true;

    const stopWords = new Set(['a', 'the', 'an', 'of', 'and', 'or', 'is', 'in', 'at', 'to', 'for']);
    const getWords = (s: string) => s.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));

    const answerWords = getWords(userAnswer);
    const correctWords = getWords(correctObject);

    for (const word of answerWords) {
      if (correctWords.some(cw => cw.includes(word) || word.includes(cw))) {
        return true;
      }
    }

    // Spelling tolerance — allow up to 2 character differences
    // for words longer than 5 chars, 1 for shorter words
    const normalA = normalize(userAnswer);
    const normalC = normalize(correctObject);
    const maxDist = normalC.length > 5 ? 2 : 1;
    if (levenshtein(normalA, normalC) <= maxDist) return true;

    // Also check each significant word against the correct object
    for (const word of answerWords) {
      if (word.length > 4 && levenshtein(word, normalC) <= 2) return true;
    }

    return false;
  };

  const [phase, setPhase] = useState<"loading" | "education" | "name" | "chat" | "results" | "paywall">("loading");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentBeat, setCurrentBeat] = useState<BeatId>("welcome");
  const [isTyping, setIsTyping] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(true);
  const [showContinue, setShowContinue] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [genError, setGenError] = useState(false);
  const [showSparkButton, setShowSparkButton] = useState(false);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [recallHint, setRecallHint] = useState<string | null>(null);
  const [recallHintLoading, setRecallHintLoading] = useState(false);
  const [typewriterBusy, setTypewriterBusy] = useState(false);
  const [fastForward, setFastForward] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showPenguin, setShowPenguin] = useState(false);
  const [chatFading, setChatFading] = useState(false);
  const [state, setState] = useState<ConversationState>(createFreshState());
  const [resultsSummary, setResultsSummary] = useState({ correctCount: 0, totalItems: 0, streak: 0, justCompletedDay: 0 });
  const [pendingSession, setPendingSession] = useState<PendingSessionData | undefined>(undefined);

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
  const currentBeatRef = useRef(currentBeat);
  currentBeatRef.current = currentBeat;

  const progressStep = getProgressStep(currentBeat);
  const isCleaning = ["cleaning-intro", "cleaning-recall", "react-cleaning"].includes(currentBeat);

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

  const showWisdomMessage = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        setIsTyping(true);
        scrollToBottom();
        setTimeout(() => {
          setIsTyping(false);
          const id = ++msgIdRef.current;
          setMessages((prev) => [...prev, { id, sender: "timbuk", text, typewriter: true, variant: "wisdom" }]);
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
    setFastForward(false);
    if (currentBeatRef.current === "onboard-vivid") {
      setShowPenguin(true);
      setTimeout(() => setShowPenguin(false), 3000);
    }
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
        const response = await authFetch("/api/assign-objects", {
          method: "POST",
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

  const doScreenWipe = useCallback(async () => {
    setChatFading(true);
    await new Promise<void>((r) => setTimeout(r, 600));
    setMessages([]);
    setChatFading(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 });
    }
  }, []);

  const savePalaceToDB = useCallback(async (stops: string[]) => {
    localStorage.setItem("memory-amble-palace", JSON.stringify(stops));
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
      console.error("Failed to save palace to Supabase:", e);
    }
  }, [isGuest, authFetch]);

  const loadSavedPalace = useCallback(async (): Promise<string[] | null> => {
    const saved = localStorage.getItem("memory-amble-palace");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    if (isGuest) return null;
    try {
      const res = await authFetch("/api/palaces");
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) && data.length > 0
          ? data.map((p: any) => p.locationName)
          : null;
      }
    } catch (e) {
      console.error("Failed to load palaces:", e);
    }
    return null;
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
      console.error("Failed to save session to Supabase:", e);
    }
  }, [isGuest]);

  const saveProgressToDB = useCallback(async (pd: ProgressData) => {
    localStorage.setItem("memory-amble-day", String(pd.currentDay));
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
      console.error("Failed to save progress to Supabase:", e);
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
      if (!text) {
        const next = getNextBeat(beat, currentState);
        if (next) {
          setCurrentBeat(next);
          await advanceBeat(next, currentState);
        }
        return;
      }

      let resolvedText = text;
      if (text.includes('__STOP__')) {
        const rawStop = getStopNameForBeat(beat, currentState);
        if (rawStop) {
          try {
            const resp = await fetch('/api/smart-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userName: currentState.userName, userAssociation: rawStop, context: 'stop-display' }),
            });
            const data = await resp.json();
            const phrase = yourify(data.confirmation || stopPhrase(rawStop));
            resolvedText = text.replace('__STOP__', phrase);
          } catch {
            const fallbackPhrase = yourify(stopPhrase(rawStop));
            resolvedText = text.replace('__STOP__', fallbackPhrase);
          }
        }
      }

      let displayText = resolvedText;
      if (resolvedText === SMART_CONFIRM) {
        console.log("SMART_CONFIRM block entered for beat:", beat, "text value:", resolvedText, "SMART_CONFIRM sentinel:", SMART_CONFIRM);
        setIsTyping(true);
        scrollToBottom();

        if (beat === "react-place") {
          const fallback = getReactPlaceFallback(currentState);
          const userAssociation = currentState.placeName || "";
          try {
            const resp = await fetch("/api/smart-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: currentState.userName,
                userAssociation,
                context: "place-confirmation",
              }),
            });
            const data = await resp.json();
            const ack = data.response || fallback;
            if (data.cleanedInput) {
              currentState.placeName = data.cleanedInput;
            }
            displayText = !currentState.isReturningUser
              ? `${ack}${getReactPlaceStopIntro(currentState)}`
              : ack;
          } catch {
            displayText = !currentState.isReturningUser
              ? `${fallback}${getReactPlaceStopIntro(currentState)}`
              : fallback;
          }
        } else if (beat === "react-stop") {
          console.log("react-stop SMART_CONFIRM branch reached");
          const idx = currentState.stepIndex;
          const total = currentState.itemCount;
          const isLast = idx === total - 1;
          const fallback = getReactStopFallback(currentState);
          const userAssociation = currentState.stops[idx] || "";
          try {
            const resp = await fetch("/api/smart-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: currentState.userName,
                userAssociation,
                context: isLast ? "stop-confirmation" : "stop-transition",
              }),
            });
            const data = await resp.json();
            const ack = data.confirmation || fallback;
            displayText = isLast ? `${ack}\n\n${getReactStopRouteAppend(currentState)}` : ack;
          } catch {
            if (isLast) {
              const routeList = currentState.stops
                .map((s, i) => `${["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth"][i] || `${i + 1}th`}, ${s}`)
                .join(".\n");
              displayText = `${fallback}\n\nSo here's your route:\n\n${routeList}.\n\nThat is the skeleton of your Memory Palace. Now let me find some items to put in it...`;
            } else {
              displayText = fallback;
            }
          }
        } else if (beat === "react-practice") {
          const firstStop = currentState.stops[0] || "your first stop";
          const fallback = `That is exactly how it works. Vivid, personal, yours.`;
          try {
            const resp = await fetch("/api/smart-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: currentState.userName,
                objectName: "pineapple",
                userAssociation: currentState.practiceScene || "",
                stopName: firstStop,
                context: "object-placement",
              }),
            });
            const data = await resp.json();
            displayText = data.confirmation || fallback;
          } catch {
            displayText = fallback;
          }
        } else if (beat === "mirror-object") {
          const fallback = getMirrorObjectFallback(currentState);
          try {
            const a = currentState.assignments[currentState.stepIndex];
            const objectName = a?.object || "";
            const userAssociation = currentState.userScenes[currentState.stepIndex] || "";
            const stopName = a?.stopName || "";
            const resp = await fetch("/api/smart-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: currentState.userName,
                objectName,
                userAssociation,
                stopName,
                context: "object-placement",
              }),
            });
            const data = await resp.json();
            displayText = data.confirmation || fallback;
          } catch {
            displayText = fallback;
          }
        } else if (beat === "react-recall") {
          const fallback = getReactRecallFallback(currentState);
          try {
            const ri = recallAssignmentIndex(currentState.stepIndex, currentState);
            const a = currentState.assignments[ri];
            const resp = await fetch("/api/smart-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: currentState.userName,
                objectName: a?.object || "",
                userAssociation: currentState.userAnswers[currentState.stepIndex] || "",
                originalScene: currentState.userScenes[ri] || "",
                stopName: a?.stopName || "",
                context: "recall-confirmation",
              }),
            });
            const data = await resp.json();
            displayText = data.confirmation || fallback;
          } catch {
            displayText = fallback;
          }
        }
      }

      if (displayText.includes('__STOPS_PENDING__')) {
        const stopLines = currentState.stops
          .map((s, i) => `${ordinal(i + 1)}, "${s}"`)
          .join('.\n');
        const placeName = yourify(currentState.placeName).toLowerCase().replace(/^your\s+/i, '');
        displayText = `So here's your route through your ${placeName}:\n\n${stopLines}.\n\nThat, ${currentState.userName}, is the skeleton of your Memory Palace. Now let me find some items to put in it...`;
      }

      if (beat === "practice-success" && currentState.practiceRecallAnswer) {
        const recallFallback = `You got it!`;
        try {
          const resp = await fetch("/api/smart-confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userName: currentState.userName,
              userAssociation: currentState.practiceRecallAnswer,
              stopName: currentState.stops[0] || "front door",
              context: "recall-confirmation",
            }),
          });
          const data = await resp.json();
          await showTimbukWithTypewriter(data.confirmation || recallFallback);
        } catch {
          await showTimbukWithTypewriter(recallFallback);
        }
      }

      if (beat === "wisdom-drop") {
        await showWisdomMessage(displayText);
      } else {
        await showTimbukWithTypewriter(displayText);
      }

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
          streak: progressData.streak + 1,
          lastLogin: todayStr(),
        };
        await saveSessionToDB(currentState);
        await savePalaceToDB(currentState.stops);
        await saveProgressToDB(newProgress);
        
        setResultsSummary({
          correctCount: currentState.correctCount,
          totalItems: currentState.itemCount,
          streak: newProgress.streak,
          justCompletedDay: progressData.dayCount + 1,
        });

        if (isGuest) {
          setPendingSession({
            date: todayStr(),
            level: currentState.itemCount,
            category: currentState.category,
            score: currentState.correctCount,
            totalItems: currentState.itemCount,
            assignments: currentState.assignments,
            placeName: currentState.placeName,
            stops: currentState.stops,
            dayCount: progressData.dayCount,
          });
        }

        setTimeout(() => {
          setPhase("results");
        }, 500);
        
        if (isGuest) {
          localStorage.setItem("memory-amble-day", String(newProgress.currentDay));
        } else {
          await authFetch("/api/user/current-day", {
            method: "POST",
            body: JSON.stringify({ currentDay: newProgress.currentDay }),
          });
        }
        return;
      }

      if (beatNeedsContinueButton(beat)) {
        setShowContinue(true);
        if (beat === "palace-buffer") {
          setTimeout(async () => {
            if (processingRef.current) return;
            if (currentBeatRef.current !== "palace-buffer") return;
            processingRef.current = true;
            setShowContinue(false);
            await doScreenWipe();
            const next = getNextBeat("palace-buffer", stateRef.current);
            if (next) {
              setCurrentBeat(next);
              await advanceBeatRef.current(next, stateRef.current);
            }
            processingRef.current = false;
          }, 3000);
        }
        return;
      }

      if (beatNeedsUserInput(beat)) {
        setInputEnabled(true);
        setShowSparkButton(beat === "place-object");
        setRecallHint(null);
        return;
      }

      const next = getNextBeat(beat, currentState);
      if (next) {
        let nextState = currentState;
        if (beat === "react-stop" && next === "assigning") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "cleaning-walkthrough-done" && (next === "ask-place" || next === "palace-return")) {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "react-check-in" && (next === "check-in-done" || next === "welcome")) {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (beat === "mirror-object" && next === "palace-buffer") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
          await doScreenWipe();
        }
        if (beat === "check-in-done") {
          nextState = { ...currentState, stepIndex: 0 };
          updateState(nextState);
        }
        if (
          (beat === "react-stop" && next === "ask-stop") ||
          (beat === "mirror-object" && next === "place-object") ||
          (beat === "react-recall" && next === "recall") ||
          (beat === "react-check-in" && next === "check-in-recall") ||
          (beat === "cleaning-walkthrough" && next === "cleaning-walkthrough")
        ) {
          nextState = { ...nextState, stepIndex: nextState.stepIndex + 1 };
          updateState(nextState);
        }
        setCurrentBeat(next);
        await advanceBeat(next, nextState);
      }
    },
    [showTimbukWithTypewriter, showWisdomMessage, addTimbukInstant, scrollToBottom, fetchAssignments, updateState, saveProgressToDB, saveSessionToDB, savePalaceToDB, progressData, doScreenWipe]
  );

  const advanceBeatRef = useRef(advanceBeat);
  advanceBeatRef.current = advanceBeat;

  useEffect(() => {
    if (authLoading || initRef.current) return;
    initRef.current = true;

    if (isGuest) {
      const educationSeen = localStorage.getItem("memoryamble_education_seen");
      const savedDayRaw = localStorage.getItem("memory-amble-day");
      const savedDay = savedDayRaw ? parseInt(savedDayRaw, 10) : 1;
      const guestProgress = getGuestProgressFromDay(savedDay);
      setProgressData(guestProgress);

      if (!educationSeen) {
        setPhase("education");
        return;
      }

      if (savedDay > 1) {
        const savedName = localStorage.getItem("memory-amble-name");
        const savedPalaceRaw = localStorage.getItem("memory-amble-palace");
        if (savedName && savedPalaceRaw) {
          try {
            const savedPalace = JSON.parse(savedPalaceRaw);
            const lesson = getLessonConfig(guestProgress.currentLevel, guestProgress.dayCount, guestProgress.currentCategory);
            const s = createFreshState();
            s.userName = savedName;
            s.placeName = "Your Palace";
            s.stops = savedPalace;
            s.isReturningUser = true;
            s.lessonConfig = lesson;
            s.itemCount = lesson.itemCount;
            s.category = lesson.category;
            s.dayCount = guestProgress.dayCount;
            s.lastPalaceName = "Your Palace";
            s.lastStops = savedPalace;
            updateState(s);
            setPhase("chat");
            setTimeout(() => {
              advanceBeatRef.current("welcome", s);
            }, 300);
            return;
          } catch {
            // fall through to name entry if palace data is corrupt
          }
        }
      }

      setPhase("name");
      return;
    }

    const init = async () => {
      try {
        const [progressRes, latestSessionRes] = await Promise.all([
          authFetch("/api/progress"),
          authFetch("/api/sessions/latest"),
        ]);

        let pd: ProgressData = await progressRes.json();

        // Migrate guest session data if the user just signed up / signed in
        const pendingSessionStr = localStorage.getItem("memory-amble-pending-session");
        if (pendingSessionStr && pd.dayCount === 0) {
          try {
            const ps: PendingSessionData = JSON.parse(pendingSessionStr);
            const nextDayCount = ps.dayCount + 1;
            const nextLevel = getNextLevel(
              pd.currentLevel,
              ps.score,
              ps.totalItems,
            );
            const nextCategory = shouldSwitchCategory(nextDayCount, pd.currentCategory as "objects" | "names");
            const migratedProgress: ProgressData = {
              currentDay: ps.dayCount + 2,
              currentLevel: nextLevel,
              currentCategory: nextCategory,
              dayCount: nextDayCount,
              streak: 1,
              lastLogin: todayStr(),
            };
            const locations = ps.stops.map((name, i) => ({ locationName: name, position: i + 1 }));
            await Promise.all([
              authFetch("/api/sessions", {
                method: "POST",
                body: JSON.stringify({
                  date: ps.date,
                  level: ps.level,
                  category: ps.category,
                  score: ps.score,
                  totalItems: ps.totalItems,
                  assignments: ps.assignments,
                  placeName: ps.placeName,
                  stops: ps.stops,
                }),
              }),
              authFetch("/api/palaces", {
                method: "POST",
                body: JSON.stringify({ locations }),
              }),
              authFetch("/api/progress", {
                method: "POST",
                body: JSON.stringify({
                  currentDay: migratedProgress.currentDay,
                  currentLevel: migratedProgress.currentLevel,
                  currentCategory: migratedProgress.currentCategory,
                  dayCount: migratedProgress.dayCount,
                }),
              }),
            ]);
            localStorage.removeItem("memory-amble-pending-session");
            pd = migratedProgress;
          } catch (e) {
            console.error("Guest migration failed:", e);
          }
        }

        // After guest migration, check if we should redirect to Stripe checkout
        const checkoutPending = localStorage.getItem("memory-amble-checkout-pending");
        if (checkoutPending) {
          localStorage.removeItem("memory-amble-checkout-pending");
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const checkoutRes = await authFetch("/api/create-checkout-session", {
              method: "POST",
              body: JSON.stringify({ email: authUser?.email || "" }),
            });
            const { url } = await checkoutRes.json();
            if (url) {
              window.location.href = url;
              return;
            }
          } catch (e) {
            console.error("Post-migration checkout failed:", e);
          }
        }

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

        if (pd.dayCount === 0) {
          setPhase("name");
          return;
        }

        // Paywall: Day 2+ requires an active subscription
        // Skip paywall if returning from a successful Stripe checkout
        const urlParams = new URLSearchParams(window.location.search);
        const sessionSuccess = urlParams.get("session") === "success";
        if (sessionSuccess) {
          window.history.replaceState({}, "", "/amble");
        }
        // TODO: Re-enable subscription paywall after launch
        // if (pd.dayCount >= 1 && pd.subscriptionStatus !== "active" && !sessionSuccess) {
        //   setPhase("paywall");
        //   return;
        // }

        const lesson = getLessonConfig(pd.currentLevel, pd.dayCount, pd.currentCategory as "objects" | "names");
        const s = createFreshState();
        s.userName = displayName;
        s.isReturningUser = pd.dayCount > 0;
        s.lessonConfig = lesson;
        s.itemCount = lesson.itemCount;
        s.category = lesson.category;
        s.dayCount = pd.dayCount;
        if (latestSession && latestSession.date !== todayStr()) {
          s.yesterdayScore = latestSession.score;
          s.yesterdayTotal = latestSession.totalItems;
        }
        // Pre-session palace cleaning: populate previous session data for Days 2+
        if (pd.dayCount > 0 && latestSession && Array.isArray(latestSession.assignments) && latestSession.assignments.length > 0) {
          s.preCleanAssignments = latestSession.assignments;
          s.preCleanStops = Array.isArray(latestSession.stops) ? latestSession.stops : [];
        }

        const savedPalace = await loadSavedPalace();
        if (savedPalace && savedPalace.length > 0) {
          s.placeName = latestSession?.placeName || "Your Palace";
          s.stops = savedPalace;
        }

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
          if (lesson.cleaning && latestSession && pd.dayCount > 0) {
            s.lastPalaceName = latestSession.placeName;
            s.lastStops = latestSession.stops;
          }

          if (pd.dayCount > 0 && latestSession && Array.isArray(latestSession.assignments) && latestSession.assignments.length > 0) {
            try {
              const openerRes = await authFetch("/api/session-opener", {
                method: "POST",
                body: JSON.stringify({
                  userName: s.userName,
                  currentDay: pd.dayCount + 1,
                  yesterdayScore: latestSession.score,
                  yesterdayTotal: latestSession.totalItems,
                  yesterdayAssignments: latestSession.assignments.map((a: { stopName: string; object: string }) => ({
                    stopName: a.stopName || "",
                    object: a.object || "",
                    userAssociation: "",
                  })),
                  placeName: latestSession.placeName || "",
                }),
              });
              const openerData = await openerRes.json();
              if (openerData.greeting) {
                s.sessionOpenerGreeting = openerData.greeting;
              }
            } catch {
              // fall through to normal score-aware welcome
            }
          }

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
    setPhase("name");
  }, []);

  const handleNameSubmit = useCallback((enteredName: string) => {
    localStorage.setItem("memory-amble-name", enteredName);
    const lesson = getLessonConfig(
      progressData.currentLevel,
      progressData.dayCount,
      progressData.currentCategory as "objects" | "names"
    );
    const s = createFreshState();
    s.userName = enteredName;
    s.lessonConfig = lesson;
    s.itemCount = lesson.itemCount;
    s.category = lesson.category;
    s.dayCount = progressData.dayCount;
    updateState(s);
    setPhase("chat");
    setTimeout(() => {
      advanceBeatRef.current("welcome", s);
    }, 200);
  }, [progressData, updateState]);

  const handleContinue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setShowContinue(false);

    const s = stateRef.current;
    const beat = currentBeat;
    const next = getNextBeat(beat, s);

    if (beat === "onboard-secret" && next) {
      setShowBurst(true);
      setChatFading(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setMessages([]);
      setShowBurst(false);
      setChatFading(false);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0 });
      }
      setCurrentBeat(next);
      await advanceBeatRef.current(next, s);
    } else if ((beat === "practice-success" || beat === "practice-done" || beat === "item-preview" || beat === "palace-buffer") && next) {
      await doScreenWipe();
      setCurrentBeat(next);
      await advanceBeatRef.current(next, s);
    } else if (beat === "wisdom-drop" && next) {
      let nextState = { ...s, wisdomDropFired: true };
      if (next === "recall") {
        nextState = { ...nextState, stepIndex: nextState.stepIndex + 1 };
      }
      updateState(nextState);
      setCurrentBeat(next);
      await advanceBeatRef.current(next, nextState);
    } else if (beat === "expansion-preview" && next) {
      const stepIdx = s.itemCount - 2;
      const nextState = { ...s, stepIndex: stepIdx };
      updateState(nextState);
      setCurrentBeat(next);
      await advanceBeatRef.current(next, nextState);
    } else if (next) {
      setCurrentBeat(next);
      await advanceBeatRef.current(next, s);
    }

    processingRef.current = false;
  }, [currentBeat, doScreenWipe, updateState]);

  const handleExpansionAccept = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setShowContinue(false);
    const s = stateRef.current;
    const nextState = { ...s, expansionOffered: true, expansionAccepted: true, baseCorrectCount: s.correctCount, itemCount: s.itemCount + 2 };
    updateState(nextState);
    setCurrentBeat("expansion-stop-1");
    await advanceBeatRef.current("expansion-stop-1", nextState);
    processingRef.current = false;
  }, [updateState]);

  const handleExpansionDecline = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setShowContinue(false);
    const s = stateRef.current;
    const nextState = { ...s, expansionOffered: true, expansionAccepted: false };
    updateState(nextState);
    const hasCleaning = s.lessonConfig?.cleaning === true;
    const next: BeatId = hasCleaning ? "palace-wipe" : s.correctCount === s.itemCount ? "graduation-offer" : "final";
    setCurrentBeat(next);
    await advanceBeatRef.current(next, nextState);
    processingRef.current = false;
  }, [updateState]);

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

  const handleRecallHint = useCallback(async () => {
    if (recallHintLoading) return;
    const s = stateRef.current;
    const ri = recallAssignmentIndex(s.stepIndex, s);
    const assignment = s.assignments[ri];
    if (!assignment) return;

    setRecallHintLoading(true);
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
      setRecallHint(data.spark || "Close your eyes and picture that stop — something is waiting there for you.");
    } catch {
      setRecallHint("Close your eyes and picture that stop — something strange is waiting there for you.");
    }
    setRecallHintLoading(false);
  }, [recallHintLoading]);

  function cleanStopName(input: string): string {
    let t = input.trim();
    if (t.toLowerCase().startsWith('my ')) t = t.slice(3).trim();
    else if (t.toLowerCase().startsWith('your ')) t = t.slice(5).trim();
    else if (t.toLowerCase().startsWith('the ')) t = t.slice(4).trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  const processUserInput = useCallback(
    async (text: string) => {
      let s = { ...stateRef.current };
      const beat = currentBeat;
      const idx = s.stepIndex;
      let nextBeatOverride: BeatId | null = null;

      const isSamePlaceIntent = (input: string): boolean => {
        return /^(same|same\s+(place|one|spot)|same\s+as\s+(before|last\s+time)|that\s+(same\s+)?one|the\s+same)$/i.test(input.trim());
      };

      const isConfirmation = (input: string): boolean => {
        return /^(yes|yeah|yep|yup|sure|ok|okay|correct|that'?s?\s+right|absolutely|definitely|please|go ahead)$/i.test(input.trim());
      };

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
            if (fuzzyMatch(text, keyword)) addCorrect = 1;
          }
          s = { ...s, checkInAnswers: newAnswers, checkInCorrectCount: s.checkInCorrectCount + addCorrect };
          break;
        }

        case "onboard-skill":
          s = { ...s, placeName: cleanPlaceName(text), stops: [] };
          break;

        case "ask-place":
          if (isSamePlaceIntent(text) && s.lastPalaceName) {
            s = { ...s, placeName: s.lastPalaceName, stops: [] };
            nextBeatOverride = "confirm-same-place";
          } else {
            s = { ...s, placeName: cleanPlaceName(text), stops: [] };
          }
          break;

        case "confirm-same-place":
          if (isConfirmation(text)) {
            s = { ...s, stops: [] };
          } else {
            s = { ...s, placeName: cleanPlaceName(text), stops: [] };
          }
          break;

        case "ask-stop":
          s = { ...s, stops: [...s.stops, cleanStopName(text)] };
          break;

        case "expansion-stop-1":
          s = { ...s, stops: [...s.stops, cleanStopName(text)] };
          break;

        case "expansion-stop-2": {
          const newStop2 = cleanStopName(text);
          const newStop1 = s.stops[s.stops.length - 1];
          const allStops = [...s.stops, newStop2];
          s = { ...s, stops: allStops };
          try {
            const response = await authFetch("/api/assign-objects", {
              method: "POST",
              body: JSON.stringify({ stops: [newStop1, newStop2], category: s.category }),
            });
            const data = await response.json();
            if (data.assignments?.length) {
              s = { ...s, assignments: [...s.assignments, ...data.assignments] };
            }
          } catch {
            // expansion fetch failed; proceed without new assignments
          }
          break;
        }

        case "practice-item": {
          s = { ...s, practiceScene: text };
          break;
        }

        case "practice-recall": {
          s = { ...s, practiceRecallAnswer: text };
          break;
        }

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
          if (idx < s.itemCount && assoc) {
            const keyword = assoc.object
              .replace(/^a\s+/i, "")
              .replace(/^an\s+/i, "")
              .replace(/^the\s+/i, "")
              .split(" ").pop()?.toLowerCase() || "";
            if (fuzzyMatch(text, keyword)) addCorrect = 1;
          }
          s = { ...s, userAnswers: newAnswers, correctCount: s.correctCount + addCorrect };
          break;
        }
      }

      updateState(s);

      const next = nextBeatOverride ?? getNextBeat(beat, s);
      if (next) {
        setCurrentBeat(next);
        await advanceBeatRef.current(next, s);
      }
    },
    [currentBeat, updateState]
  );
  
  const processUserInputRef = useRef<(text: string) => Promise<void>>();
  processUserInputRef.current = processUserInput;

  const handleUserInput = useCallback(
    async (text: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      addUserMessage(text);
      setShowSparkButton(false);
      if (currentBeat === "recall") setRecallHint(null);

      // Detect struggle phrases during recall — re-prompt without counting wrong
      if (currentBeat === "recall" && isStrugglePhrase(text)) {
        const s = stateRef.current;
        const ri = recallAssignmentIndex(s.stepIndex, s);
        const assignment = s.assignments[ri];
        if (assignment) {
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
            const sparkText = data.spark || "Close your eyes and picture that stop...";
            setRecallHint(sparkText);
            addTimbukInstant(`No worries. Here is a little nudge: "${sparkText}" — have another look. What do you see?`);
          } catch {
            addTimbukInstant("That is perfectly fine. Close your eyes, picture yourself at that stop, and tell me the first thing you see.");
          }
        }
        processingRef.current = false;
        return;
      }

      await processUserInputRef.current?.(text);
      processingRef.current = false;
    },
    [addUserMessage, addTimbukInstant, currentBeat]
  );

  const handleFinish = useCallback(() => {
    window.location.reload();
  }, []);

  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await authFetch("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ email: user?.email || "" }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error("Checkout failed:", e);
      setCheckoutLoading(false);
    }
  }, [authFetch, user]);

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
              <ProgressBar currentStep={0} isCleaning={false} />
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
        </header>
        <div className="flex-1 overflow-y-auto">
          <NameEntry onSubmit={handleNameSubmit} />
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <AmbleResults
        correctCount={resultsSummary.correctCount}
        totalItems={resultsSummary.totalItems}
        streak={resultsSummary.streak}
        onContinue={handleFinish}
        isGuest={isGuest}
        userName={state.userName}
        dayCount={progressData.dayCount}
        currentDay={resultsSummary.justCompletedDay}
        placeName={state.placeName}
        stops={state.stops}
        pendingSession={pendingSession}
      />
    );
  }

  if (phase === "paywall") {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-primary/10 to-background flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full mx-auto space-y-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-primary-foreground" />
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl font-semibold leading-snug">
              Day {progressData.dayCount + 1} is ready for you, {displayName}.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              You've built a real foundation. A subscription keeps the practice going — and the memories sticking.
            </p>
          </div>

          <div className="bg-background border border-border/60 rounded-xl p-5 space-y-3 text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">What you get</p>
            {["30-day guided bootcamp", "New palace every session", "Check-in recalls & cleaning rituals", "Streak tracking"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                <span className="text-primary font-bold">✓</span>
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              data-testid="button-paywall-subscribe"
            >
              {checkoutLoading ? "Opening checkout..." : "Start 7-Day Free Trial"}
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">$8.99/month</span> after your free trial — cancel anytime.{" "}
              <span className="line-through">$16.99/month</span>
            </p>
          </div>

          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={signOut}
            data-testid="button-paywall-signout"
          >
            Sign out
          </button>
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
            <ProgressBar currentStep={progressStep} isCleaning={isCleaning} />
          </div>
        </div>
      </header>

      {showBurst && (
        <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center">
          {BURST_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="palace-burst-particle"
              style={{
                "--tx": p.tx,
                "--ty": p.ty,
                backgroundColor: p.color,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto${chatFading ? " palace-chat-fading" : ""}`}
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
              fastForward={msg.id === lastMessageId && fastForward}
              onSkipTyping={msg.id === lastMessageId && typewriterBusy ? () => setFastForward(true) : undefined}
              variant={msg.variant}
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
          ) : showContinue && currentBeat === "expansion-offer" ? (
            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={handleExpansionAccept}
                data-testid="button-expansion-accept"
              >
                Let's push it!
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleExpansionDecline}
                data-testid="button-expansion-decline"
              >
                That's a win!
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
                {getContinueButtonLabel(currentBeat)}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recallHint && currentBeat === "recall" && (
                <div className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2" data-testid="recall-hint-display">
                  <Lightbulb className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground italic leading-snug">{recallHint}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ChatInput
                    onSend={handleUserInput}
                    placeholder={getInputPlaceholder(currentBeat, state)}
                    disabled={!inputEnabled || isTyping || typewriterBusy}
                  />
                </div>
                {currentBeat === "recall" && inputEnabled && !typewriterBusy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRecallHint}
                    disabled={recallHintLoading}
                    className="shrink-0 h-14 px-3 text-xs text-muted-foreground hover:text-primary gap-1.5 border border-border/50 rounded-xl"
                    data-testid="button-recall-hint"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {recallHintLoading ? "..." : "Hint?"}
                  </Button>
                )}
              </div>
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
      {import.meta.env.DEV && (
        <div className="fixed bottom-2 right-2 z-[9999] flex flex-col gap-1">
          <button
            onClick={() => { 
              localStorage.removeItem("memory-amble-day");
              localStorage.removeItem("memory-amble-palace");
              localStorage.removeItem("memory-amble-name");
              localStorage.removeItem("memoryamble_education_seen");
              window.location.reload();
            }}
            className="px-2 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground bg-transparent cursor-pointer"
            data-testid="button-dev-reset"
          >
            Dev Reset
          </button>
          <button
            onClick={async () => {
              const dummyPalace = ["Front Door", "Kitchen", "Living Room"];
              localStorage.setItem("memory-amble-palace", JSON.stringify(dummyPalace));
              localStorage.setItem("memory-amble-day", "2");
              localStorage.setItem("memory-amble-name", "Joe");
              localStorage.setItem("memoryamble_education_seen", "true");
              if (!isGuest) {
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  const token = session?.access_token;
                  if (token) {
                    await fetch("/api/user/current-day", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ currentDay: 2 }),
                    });
                    await fetch("/api/palaces", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        locations: dummyPalace.map((name, i) => ({ locationName: name, position: i + 1 })),
                      }),
                    });
                  }
                } catch (e) {
                  console.error("Failed to skip to day 2:", e);
                }
              }
              window.location.assign('/');
            }}
            className="px-2 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground bg-transparent cursor-pointer"
            data-testid="button-dev-skip-day2"
          >
            Dev: Skip to Day 2
          </button>
          <button
            onClick={async () => {
              const testStops = ["Front door", "Hat rack", "Key bowl"];
              const testAssignments = [
                { stopName: "Front door", object: "accordion" },
                { stopName: "Hat rack", object: "penguin" },
                { stopName: "Key bowl", object: "cactus" },
              ];
              const s = createFreshState();
              s.userName = "Gladys";
              s.placeName = "Your house";
              s.stops = testStops;
              s.assignments = testAssignments;
              s.userScenes = ["its on fire", "wearing a top hat", "spinning"];
              s.itemCount = 3;
              s.stepIndex = 0;
              s.lessonConfig = getLessonConfig(3, 0, "objects");
              s.dayCount = 0;
              localStorage.setItem("memoryamble_education_seen", "true");
              updateState(s);
              setMessages([]);
              setCurrentBeat("walkthrough-intro");
              setPhase("chat");
              setTimeout(() => {
                advanceBeatRef.current("walkthrough-intro", s);
              }, 200);
            }}
            className="px-2 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground bg-transparent cursor-pointer"
            data-testid="button-dev-skip-to-recall"
          >
            Dev: Skip to Recall
          </button>
          <button
            onClick={async () => {
              const palace = ["Front door", "Kitchen", "Living room"];
              const yesterdayAssignments = [
                { stopName: "Front door", object: "penguin" },
                { stopName: "Kitchen", object: "typewriter" },
                { stopName: "Living room", object: "crown" },
              ];
              const s = createFreshState();
              s.userName = 'Gladys';
              s.placeName = 'Your house';
              s.stops = palace;
              s.isReturningUser = true;
              s.dayCount = 1;
              s.itemCount = 3;
              s.lessonConfig = getLessonConfig(3, 1, 'objects');
              s.checkInAssignments = yesterdayAssignments;
              s.checkInPlace = 'Your house';
              s.yesterdayScore = 3;
              s.yesterdayTotal = 3;
              s.lastPalaceName = 'Your house';
              s.lastStops = palace;
              s.preCleanAssignments = yesterdayAssignments;
              s.preCleanStops = palace;
              localStorage.setItem('memoryamble_education_seen', 'true');
              updateState(s);
              setMessages([]);
              setPhase('chat');
              setTimeout(() => {
                setCurrentBeat('check-in-intro');
                advanceBeatRef.current('check-in-intro', s);
              }, 200);
            }}
            className="px-2 py-1 text-xs text-muted-foreground/50 hover:text-muted-foreground bg-transparent cursor-pointer"
            data-testid="button-dev-real-day2"
          >
            Dev: Real Day 2
          </button>
        </div>
      )}
      {showPenguin && (
        <div className="fixed bottom-16 left-0 z-[9999] pointer-events-none penguin-waddle">
          🐧
        </div>
      )}
    </div>
  );
}
