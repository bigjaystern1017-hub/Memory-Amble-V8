import type { Assignment } from "@shared/schema";
import type { LessonConfig } from "@/lib/progress";

export type BeatId =
  | "check-in-intro"
  | "check-in-recall"
  | "react-check-in"
  | "check-in-done"
  | "cleaning-intro"
  | "cleaning-recall"
  | "react-cleaning"
  | "pre-clean"
  | "cleaning-walkthrough"
  | "cleaning-walkthrough-done"
  | "welcome"
  | "onboard-welcome"
  | "onboard-skill"
  | "onboard-palace"
  | "onboard-vivid"
  | "onboard-secret"
  | "onboard-ready"
  | "ask-place"
  | "confirm-same-place"
  | "react-place"
  | "ask-stop"
  | "react-stop"
  | "assigning"
  | "practice-intro"
  | "practice-item"
  | "react-practice"
  | "practice-buffer"
  | "practice-recall"
  | "practice-success"
  | "practice-done"
  | "item-preview"
  | "palace-return"
  | "placement-intro"
  | "place-object"
  | "mirror-object"
  | "palace-buffer"
  | "walkthrough-intro"
  | "reverse-intro"
  | "reverse-offer"
  | "recall"
  | "react-recall"
  | "wisdom-drop"
  | "palace-wipe"
  | "graduation-offer"
  | "final"
  | "expansion-offer"
  | "expansion-stop-1"
  | "expansion-stop-2"
  | "expansion-intro"
  | "expansion-preview";

export interface ConversationState {
  userName: string;
  placeName: string;
  stops: string[];
  assignments: Assignment[];
  userScenes: string[];
  userAnswers: string[];
  correctCount: number;
  itemCount: number;
  stepIndex: number;
  category: "objects" | "names" | "practical";
  checkInAssignments: Assignment[];
  checkInAnswers: string[];
  checkInCorrectCount: number;
  checkInPlace: string;
  isReturningUser: boolean;
  lessonConfig: LessonConfig | null;
  dayCount: number;
  graduated: boolean;
  lastPalaceName: string;
  lastStops: string[];
  cleaningAnswers: string[];
  yesterdayScore: number;
  yesterdayTotal: number;
  preCleanStops: string[];
  preCleanAssignments: Assignment[];
  practiceScene: string;
  practiceRecallAnswer: string;
  wisdomDropFired: boolean;
  sessionOpenerGreeting: string;
  expansionOffered: boolean;
  expansionAccepted: boolean;
  reverseOffered: boolean;
  reverseAccepted: boolean;
  baseCorrectCount: number;
  baseItemCount?: number;
}

export const SMART_CONFIRM = "__SMART_CONFIRM__";

export function isReverseRecall(state: ConversationState): boolean {
  return state.reverseAccepted === true;
}

export function recallAssignmentIndex(stepIndex: number, state: ConversationState): number {
  if (isReverseRecall(state)) {
    return state.itemCount - 1 - stepIndex;
  }
  return stepIndex;
}

export function createFreshState(): ConversationState {
  return {
    userName: "",
    placeName: "",
    stops: [],
    assignments: [],
    userScenes: [],
    userAnswers: [],
    correctCount: 0,
    itemCount: 3,
    stepIndex: 0,
    category: "objects",
    checkInAssignments: [],
    checkInAnswers: [],
    checkInCorrectCount: 0,
    checkInPlace: "",
    isReturningUser: false,
    lessonConfig: null,
    dayCount: 0,
    graduated: false,
    lastPalaceName: "",
    lastStops: [],
    cleaningAnswers: [],
    yesterdayScore: -1,
    yesterdayTotal: 0,
    preCleanStops: [],
    preCleanAssignments: [],
    practiceScene: "",
    practiceRecallAnswer: "",
    wisdomDropFired: false,
    sessionOpenerGreeting: "",
    expansionOffered: false,
    expansionAccepted: false,
    baseCorrectCount: 0,
  };
}

function firstCap(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const ITEM_EMOJIS: Record<string, string> = {
  "guitar": "🎸",
  "violin": "🎻",
  "trombone": "🎺",
  "accordion": "🪗",
  "ladder": "🪜",
  "ironing board": "👔",
  "wheelbarrow": "🛺",
  "birdbath": "🐦",
  "garden gnome": "🧙",
  "park bench": "🪑",
  "mailbox": "📬",
  "traffic cone": "🚧",
  "watermelon": "🍉",
  "wedding cake": "🎂",
  "pineapple": "🍍",
  "lobster": "🦞",
  "gingerbread house": "🏠",
  "rocking horse": "🐴",
  "grandfather clock": "🕰️",
  "typewriter": "⌨️",
  "jukebox": "🎵",
  "telephone booth": "📞",
  "globe": "🌍",
  "gramophone": "📻",
  "bowling ball": "🎳",
  "trophy": "🏆",
  "dartboard": "🎯",
  "sunflower": "🌻",
  "cactus": "🌵",
  "beehive": "🐝",
  "fire truck": "🚒",
  "fishing rod": "🎣",
  "anchor": "⚓",
  "canoe": "🛶",
  "surfboard": "🏄",
  "penguin": "🐧",
  "flamingo": "🦩",
  "tortoise": "🐢",
  "parrot": "🦜",
  "goldfish": "🐟",
  "swan": "🦢",
  "peacock": "🦚",
  "telescope": "🔭",
  "compass": "🧭",
  "lantern": "🏮",
  "weathervane": "🌬️",
  "top hat": "🎩",
  "monocle": "🧐",
  "crown": "👑",
  "scepter": "⚜️",
  "disco ball": "🪩",
  "pinball machine": "🎮",
  "parachute": "🪂",
  "hot air balloon": "🎈",
  "$100 bill": "💵",
  "milk": "🥛",
  "bread": "🍞",
  "eggs": "🥚",
  "call the doctor": "📞",
  "pick up prescription": "💊",
  "water the plants": "🌱",
  "pay the bills": "💸",
  "call sarah": "📱",
  "dentist appointment": "🦷",
  "buy birthday card": "🎂",
  "return library books": "📚",
  "take vitamins": "💊",
};

function getItemEmoji(item: string): string {
  const lower = item.toLowerCase().replace(/^a\s+|^an\s+|^the\s+/i, "").trim();
  return ITEM_EMOJIS[lower] || "📦";
}

export function getProgressStep(beatId: BeatId): number {
  const checkInBeats: BeatId[] = ["check-in-intro", "check-in-recall", "react-check-in", "check-in-done"];
  const cleaningBeats: BeatId[] = ["cleaning-intro", "cleaning-recall", "react-cleaning"];
  const palaceBeats: BeatId[] = ["ask-place", "confirm-same-place", "react-place", "ask-stop", "react-stop", "assigning", "palace-return"];
  const practiceBeats: BeatId[] = ["practice-intro", "practice-item", "react-practice", "practice-buffer", "practice-recall", "practice-success", "practice-done", "item-preview"];
  const rememberBeats: BeatId[] = ["placement-intro", "place-object", "mirror-object", "palace-buffer"];
  const recallBeats: BeatId[] = ["walkthrough-intro", "reverse-intro", "recall", "react-recall"];

  if (beatId === "welcome") return 0;
  if (checkInBeats.includes(beatId)) return 0;
  if (cleaningBeats.includes(beatId)) return 0;
  if (beatId === "pre-clean" || beatId === "cleaning-walkthrough" || beatId === "cleaning-walkthrough-done") return 0;
  if (beatId === "onboard-welcome" || beatId === "onboard-skill" || beatId === "onboard-palace" || beatId === "onboard-vivid" || beatId === "onboard-secret" || beatId === "onboard-ready") return 1;
  if (palaceBeats.includes(beatId)) return 1;
  if (practiceBeats.includes(beatId)) return 2;
  if (rememberBeats.includes(beatId)) return 2;
  if (recallBeats.includes(beatId)) return 3;
  if (beatId === "palace-wipe") return 2;
  if (beatId === "graduation-offer") return 4;
  if (beatId === "final") return 4;
  return 0;
}

function ordinal(n: number): string {
  if (n === 1) return "first";
  if (n === 2) return "second";
  if (n === 3) return "third";
  if (n === 4) return "fourth";
  if (n === 5) return "fifth";
  if (n === 6) return "sixth";
  if (n === 7) return "seventh";
  if (n === 8) return "eighth";
  if (n === 9) return "ninth";
  if (n === 10) return "tenth";
  return `#${n}`;
}

function extractKeyword(objectName: string): string {
  const cleaned = objectName
    .toLowerCase()
    .trim()
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^the\s+/i, "")
    .replace(/\s+/g, "");
  return cleaned;
}

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

function fuzzyMatch(userAnswer: string, correctObject: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w]/g, '').trim();
  const a = normalize(userAnswer);
  const c = normalize(correctObject);
  if (a === c) return true;
  if (a.includes(c) || c.includes(a)) return true;
  const stopWords = new Set(["a", "the", "an", "of", "and", "or", "is", "in", "at", "to", "for"]);
  const getWords = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  const answerWords = getWords(userAnswer);
  const correctWords = getWords(correctObject);
  for (const word of answerWords) {
    if (correctWords.some(cw => cw.includes(word) || word.includes(cw))) return true;
    if (correctWords.some(cw => cw.startsWith(word) && word.length > 2)) return true;
  }
  const maxDist = c.length > 5 ? 2 : 1;
  if (levenshtein(a, c) <= maxDist) return true;
  return false;
}

function itemLabel(category: "objects" | "names" | "practical"): string {
  return category === "names" ? "names" : "items";
}

function placeVerb(category: "objects" | "names" | "practical"): string {
  return category === "names" ? "imagine meeting" : "place";
}

function stopInContext(stop: string): string {
  const s = stop.trim().toLowerCase();
  if (s.startsWith('where ') || s.startsWith('the place') || s.startsWith('spot')) {
    return 'the ' + s;
  }
  return 'your ' + s;
}

export function stopPhrase(stop: string): string {
  const s = stop.trim();
  const lower = s.toLowerCase();
  if (lower.startsWith('where ') || lower.startsWith('when ') || lower.startsWith('the spot') || lower.startsWith('the place')) {
    return 'the ' + lower;
  }
  if (lower.startsWith('our ') || lower.startsWith('my ')) {
    return lower;
  }
  return 'your ' + lower;
}

export function yourify(s: string): string {
  return s
    .replace(/\bour\b/gi, 'your')
    .replace(/\bmy\b/gi, 'your');
}

function practicalItemPhrase(item: string): string {
  const lower = item.toLowerCase();
  if (lower.startsWith('call ') || lower.startsWith('pick up') ||
      lower.startsWith('water ') || lower.startsWith('pay ') ||
      lower.startsWith('buy ') || lower.startsWith('return ') ||
      lower.startsWith('take ') || lower.startsWith('dentist') ||
      lower.startsWith('doctor')) {
    return lower;
  }
  const massNouns = ['milk', 'bread', 'water', 'rice', 'flour', 'sugar', 'butter', 'coffee', 'tea'];
  if (massNouns.includes(lower)) return 'some ' + lower;
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return 'some ' + lower;
  }
  if ('aeiou'.includes(lower[0])) {
    return 'an ' + lower;
  }
  return 'a ' + lower;
}

export function getTimbukMessage(beatId: BeatId, state: ConversationState): string {
  const name = state.userName || "friend";
  const place = yourify(firstCap(state.placeName));
  const idx = state.stepIndex;
  const total = state.itemCount;
  const lesson = state.lessonConfig;
  const dayNum = state.dayCount + 1;
  const hasCleaning = lesson?.cleaning === true;
  const hasReverse = lesson?.reverse === true;
  const cat = state.category;
  const isNames = cat === "names";

  const stop = (i: number) => yourify(firstCap(state.stops[i] || ""));
  const aStop = (i: number) => yourify(firstCap(state.assignments[i]?.stopName || ""));

  switch (beatId) {
    case "check-in-intro": {
      let palaceRef = (state.checkInPlace || state.placeName || "palace").toLowerCase();
      palaceRef = palaceRef.replace(/^your\s+/i, '').replace(/^my\s+/i, '').replace(/^the\s+/i, '').trim();
      return `${name}! Welcome back. Before we start today, let us take a quick stroll through your ${palaceRef} and see what stuck from last time.`;
    }

    case "check-in-recall": {
      const a = state.checkInAssignments[idx];
      if (!a) return "";
      const stopLabel = yourify(firstCap(a.stopName));
      if (idx === 0) {
        return `You're at ${stopLabel}. What was waiting for you there?`;
      }
      return `Next stop -- ${stopLabel}. What do you see?`;
    }

    case "react-check-in": {
      const a = state.checkInAssignments[idx];
      const answer = state.checkInAnswers[idx] || "";
      if (!a) return "";
      const isCorrect = fuzzyMatch(answer, a.object);
      const isLast = idx === state.checkInAssignments.length - 1;

      if (isCorrect && isLast) {
        return `Yes! ${a.object}! You remembered that one, ${name}.`;
      }
      if (isCorrect) {
        return `${a.object} -- you got it! Keep walking...`;
      }
      if (isLast) {
        return `That was ${a.object}. No worries at all, ${name}.`;
      }
      return `It was ${a.object}. That's alright -- let's keep going.`;
    }

    case "check-in-done": {
      const ciTotal = state.checkInAssignments.length;
      const correct = state.checkInCorrectCount;
      if (correct === ciTotal) return `${correct} of ${ciTotal} — every one, ${name}. Ready for today?`;
      if (correct >= ciTotal / 2) return `${correct} of ${ciTotal}. Those pictures are sticking. Ready?`;
      return `${correct} of ${ciTotal}. The palace is there — just needs practice. Let us build today.`;
    }

    case "cleaning-intro":
      return "";

    case "cleaning-recall": {
      const idx = state.stepIndex;
      const stop = yourify(firstCap(state.lastStops[idx] || ""));
      if (idx === 0) {
        return `You're at ${stop}. Close your eyes. Imagine a gentle breeze blowing away everything you planted there. What do you see happening?`;
      }
      if (idx === state.lastStops.length - 1) {
        return `Last one. You're at ${stop}. Let the breeze clear it completely. What's left?`;
      }
      return `${stop}. The breeze passes through. Tell me what fades away.`;
    }

    case "react-cleaning": {
      const idx = state.stepIndex;
      const isLast = idx === state.lastStops.length - 1;
      if (idx === 0) {
        return `Good, ${name}. That one's cleared. Moving on...`;
      }
      if (isLast) {
        return `Perfect. The palace is clean now, ${name}. Ready for something new.`;
      }
      return `${name}, that's cleared. Next...`;
    }

    case "pre-clean": {
      return `Before we build today, let us clear yesterday's palace. Picture a gentle breeze lifting everything you placed. Watch it float away.`;
    }

    case "cleaning-walkthrough":
      return "";

    case "cleaning-walkthrough-done": {
      return `Your palace is clean. Fresh. Ready for today.`;
    }

    case "onboard-welcome": {
      const goal = typeof window !== 'undefined' ? localStorage.getItem('memoryamble-goal') : null;
      const goalLine = goal === 'names'
        ? `Names and faces — one of my favourites.`
        : goal === 'sharp'
        ? `Staying sharp for the people you love — exactly the right reason to be here.`
        : goal === 'active'
        ? `Keeping your mind active. That is why I am here too.`
        : `Curiosity is how every great palace begins.`;
      return goal
        ? `Welcome back, ${name}! I am Timbuk. ${goalLine}\n\nLet us build your first Memory Palace — it takes about 10 minutes.`
        : `Ah, ${name}! I am Timbuk — your guide. ${goalLine}\n\nToday we build your Memory Palace. I have a small surprise waiting for you at the end.`;
    }

    case "onboard-skill":
      return `Memory is a skill — and like any skill, it trains.\n\nIs there a place you know so well you could walk through it with your eyes closed? Your home, a garden, somewhere you have been a thousand times?`;

    case "onboard-palace":
      return `${place}. That is your Memory Palace — it already exists. We just furnish it.\n\nYour brain is not great at remembering lists. But it is excellent at remembering places you have walked a thousand times.`;

    case "onboard-vivid":
      return `We take an object — say, a penguin — and place it somewhere in ${place}. But we make it YOURS. Big. Strange. Wearing a bow tie. The penguin that waddled after you at the zoo when you were eight.`;

    case "onboard-secret":
      return `The stranger the image, the harder it sticks. No test. No pressure. Just practice.\n\nHit that magic button...`;

    case "onboard-ready":
      return `If you can picture your home, you have done half the work. Hint button is there if you get stuck.\n\nLet us find your palace.`;

    case "welcome": {
      if (state.sessionOpenerGreeting) {
        return state.sessionOpenerGreeting;
      }

      const ys = state.yesterdayScore;
      const yt = state.yesterdayTotal;
      const isPerfect = yt > 0 && ys === yt;
      const isGood = yt > 0 && ys >= yt / 2 && !isPerfect;

      if (dayNum === 1) {
        return "";
      }
      if (dayNum === 2) {
        if (isPerfect) return `Welcome back, ${name}. Every one yesterday — a perfect first palace. Today we expand.`;
        if (isGood) return `Welcome back, ${name}. ${ys} of ${yt} yesterday — strong start. Today we build.`;
        return `Welcome back, ${name}. Coming back is the hard part — you did it. Today goes easier.`;
      }
      if (dayNum === 3) {
        if (isPerfect) return `Three days in, ${name}, and a perfect round yesterday. Today we try something new.`;
        if (isGood) return `Three days in, ${name}. ${ys} of ${yt} yesterday. Today we stretch.`;
        return `Three days in a row, ${name}. That is the whole game. Something new today.`;
      }
      if (dayNum === 4) {
        if (isPerfect) return `Four days, flawless yesterday. Today we stretch to eight stops, ${name}.`;
        if (isGood) return `Four days strong, ${name}. ${ys} of ${yt} yesterday. Eight stops today.`;
        return `Four days, ${name}. Most never make it this far. Eight stops today.`;
      }
      if (dayNum === 5) {
        if (isPerfect) return `Five days — flawless yesterday, ${name}. Eight items today.`;
        if (isGood) return `Five days in, ${name}. Pushing to eight items today.`;
        return `Five days, ${name}. Showing up is the training. Eight items today.`;
      }
      if (dayNum === 6) {
        if (isPerfect) return `Six days, ${name}. Yesterday was remarkable. Forward and backward today.`;
        if (isGood) return `Six days, ${name}. Full walk today — forward and backward.`;
        return `Six days, ${name}. Today: full walk, forward and backward.`;
      }
      if (dayNum === 7) {
        if (isPerfect) return `${name}. Day seven. Flawless yesterday. Today you graduate. Something waiting at the end.`;
        if (isGood) return `${name}. Day seven. Graduation day. Biggest session yet — something waiting at the end.`;
        return `${name}. Day seven. You showed up every day. That is the whole game. Today you graduate.`;
      }
      const catLabel = isNames ? "names" : `${total} items`;
      return `Day ${dayNum}, ${name}. Today: ${catLabel}. Let us build.`;
    }

    case "ask-place":
      if (state.isReturningUser) return `Same place as last time, ${name}? Or somewhere new?`;
      return `Think of a place you know so well you could walk it with your eyes closed. Your home, a garden, a favourite shop. Tell me about it.`;

    case "confirm-same-place": {
      const prev = firstCap(state.lastPalaceName);
      return `Back to ${yourify(prev.toLowerCase())}? Just say yes to keep it, or tell me somewhere new.`;
    }

    case "react-place":
      return SMART_CONFIRM;

    case "ask-stop": {
      if (idx === 0) {
        return `Picture yourself walking into your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. What is the first thing you would walk past? A door, a table, a hallway — whatever you would notice first.`;
      }
      if (idx === total - 1) {
        return `Keep walking. Where do you end up? That is your last stop.`;
      }
      return `What do you notice next?`;
    }

    case "react-stop":
      return SMART_CONFIRM;

    case "assigning":
      return "";

    case "practice-intro":
      return `Before we place your items — a quick practice. One item, one stop. Tell me what you see.`;

    case "practice-item": {
      const firstStop = yourify(firstCap(state.stops[0] || "your first stop"));
      return `${firstStop} — 🍍 Pineapple. Now make it YOURS — what is happening with that Pineapple at __STOP__?`;
    }

    case "react-practice":
      return SMART_CONFIRM;

    case "practice-buffer":
      return `Now let us see if it stuck. Close your eyes for a moment. Picture __STOP__.`;

    case "practice-recall":
      return `${yourify(firstCap(state.stops[0] || "Front door"))}. What do you see there?`;

    case "practice-success":
      return `Yes! That is the palace at work, ${name}. A 2,000-year-old technique — and you did it in under a minute. Ready for real?`;

    case "practice-done":
      return `That is the whole technique. Let us go.`;

    case "item-preview": {
      const itemLines = state.assignments
        .map((a) => `${cat === 'names' ? '👤' : getItemEmoji(a.object)} ${a.object}`)
        .join("\n\n");
      return `Today's items:\n\n${itemLines}`;
    }

    case "palace-return": {
      const stopList = state.stops
        .slice(0, Math.min(state.stops.length, 3))
        .map((s) => yourify(firstCap(s)))
        .join(", ");
      const extra = state.stops.length > 3 ? ` and ${state.stops.length - 3} more` : "";
      const placeLower = place.toLowerCase();
      const placePhrase = placeLower.startsWith("your ") ? placeLower : `your ${placeLower}`;
      return `Back to ${placePhrase} — your ${stopList}${extra} are waiting.`;
    }

    case "placement-intro": {
      if (isNames) {
        return `Right, ${name} — ${total} people to meet, one at each stop. The more vivid the scene, the harder it sticks.`;
      }
      return `Right, ${name} — ${total} items, one at each stop. The weirder your picture, the stickier it sticks.`;
    }

    case "place-object": {
      const a = state.assignments[idx];
      if (!a) return "";
      const stopLabel = yourify(firstCap(a.stopName));
      const emoji = getItemEmoji(a.object);
      const isLast = idx === total - 1;
      const prefix = isLast ? `Last one. ${stopLabel}` : stopLabel;
      if (isNames) {
        return `${prefix} — 👤 ${a.object}. Now make it YOURS — picture meeting ${a.object} here. What do you notice about this person?`;
      }
      if (cat === 'practical') {
        return `${prefix} — ${emoji} ${a.object}. Now make it YOURS — how are you going to remember ${practicalItemPhrase(a.object)}?`;
      }
      return `${prefix} — ${emoji} ${a.object}. Make it YOURS — what is happening with that ${a.object} at __STOP__?`;
    }

    case "mirror-object":
      return SMART_CONFIRM;

    case "palace-buffer": {
      return `Good. All ${total} planted, ${name}. Take a breath. Picture your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}.`;
    }

    case "walkthrough-intro": {
      return `You are back at the entrance of your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. Just walk — whatever you placed will be waiting.`;
    }

    case "reverse-intro": {
      return `Same palace. This time we walk it backwards. A little harder — that is the point. Ready?`;
    }

    case "recall": {
      const ri = recallAssignmentIndex(idx, state);
      const a = state.assignments[ri];
      if (!a) return "";
      const stopLabel = yourify(firstCap(a.stopName));
      if (isNames) {
        if (idx === 0) {
          return `${stopLabel}. You met someone here. Who was it?`;
        }
        if (idx === total - 1) {
          return `${stopLabel}. Last one. Who did you meet here?`;
        }
        return `${stopLabel}. Someone you met. Who are they?`;
      }
      if (idx === 0) {
        return `${stopLabel}. Something strange. What do you see?`;
      }
      if (idx === total - 1) {
        return `${stopLabel}. Last one. What's waiting for you here?`;
      }
      return `${stopLabel}. Something's out of place. What is it?`;
    }

    case "react-recall": {
      const ri = recallAssignmentIndex(idx, state);
      const a = state.assignments[ri];
      const answer = state.userAnswers[idx] || "";
      if (!a) return "";
      const isCorrect = fuzzyMatch(answer, a.object);
      const isLast = idx === total - 1;

      if (isCorrect) return SMART_CONFIRM;
      if (isLast) return `That one was ${a.object}. The pictures will get clearer with practice, ${name}.`;
      return `It was ${a.object}. No worries -- keep walking...`;
    }

    case "wisdom-drop": {
      const wisdoms = [
        "The stranger the image, the harder your brain works to file it. That is why it sticks.",
        "A clean palace is ready for anything. That is why we clear it each time.",
        "Walking it backwards uses a different part of your memory. That is the stretch.",
        "You are not memorizing. You are placing. There is a difference — and you just felt it.",
        "This works for anything. Grocery lists, names, numbers, appointments. You are building a skill for life.",
        "Names stick when you attach them to something you already know. That is the bridge.",
        "You have walked this palace seven times now. It is yours. No one can take it.",
      ];
      return wisdoms[state.dayCount % wisdoms.length] || wisdoms[0];
    }

    case "palace-wipe": {
      return `${name}, let us clear the palace before we finish.\n\nPicture the entrance of your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. A gentle breeze passes through. The images float away like leaves.\n\nBreathe. Clean. Ready for next time.`;
    }

    case "graduation-offer": {
      if (state.dayCount === 6) {
        return `${name}. Look what you did this week.\n\nBuilt your first palace. Cleaned it. Walked it forward and backward.\n\nSeven days ago you had never heard of a Memory Palace. Today you have one.\n\nRest this weekend. Week 2 waits.`;
      }
      const nextLevel = Math.min(state.itemCount + 2, 9);
      return `Every single one, ${name}. Next time — ${nextLevel} ${itemLabel(cat)}. Your palace is growing.`;
    }

    case "final": {
      const count = Math.min(state.correctCount, state.itemCount);
      const total = state.itemCount;
      const graduated = state.graduated;
      const levelNote = graduated
        ? `\n\nYou've levelled up! Next session: ${Math.min(total + 2, 9)} ${itemLabel(cat)}.`
        : "";
      const dayNote = `\n\nSee you next time for Day ${dayNum + 1}!${levelNote}\n\nI made you something while you were walking. Continue to see it.`;

      const placeName = state.placeName.toLowerCase().replace(/^your\s+/i, '');
      if (count === total) {
        return `${name}, ${count} out of ${total}. A perfect walk! You clearly have a wonderful imagination.\n\nYour palace at ${placeName} is yours now. Walk through it in your mind tonight before bed.${dayNote}`;
      }
      if (count >= total * 0.66) {
        return `${count} out of ${total}, ${name}! That is genuinely impressive. Your palace at ${placeName} is working.\n\nWalk through it one more time tonight -- those images will get even stickier.${dayNote}`;
      }
      if (count >= 1) {
        return `${count} out of ${total} -- and ${name}, that is a real start. The palace at ${placeName} is yours. The images are planted.\n\nTry walking through it one more time tonight. I think you'll surprise yourself.${dayNote}`;
      }
      return `${name}, what you just did took courage. You built a palace at ${placeName} and walked through it. The pictures will get clearer.\n\nTonight, try walking through it in your mind. Each time, they'll stick a little more.${dayNote}`;
    }

    case "expansion-offer": {
      const count = state.correctCount;
      const total = state.itemCount;
      if (count >= total * 0.66) {
        return `${count} out of ${total} — your palace is alive, ${name}. Want to push it further today? Two more stops, two more items. Or call that a win.`;
      }
      return `You know what — let's try two more. Different stops, fresh start. Sometimes the second round clicks. Want to give it a go?`;
    }

    case "expansion-stop-1": {
      const lastStop = state.stops[state.stops.length - 1] || 'your last stop';
      return `Two more stops — one at a time. What comes after your ${yourify(lastStop.toLowerCase())}?`;
    }

    case "expansion-stop-2":
      return `Good. And the next one?`;

    case "expansion-intro": {
      const newStops = state.stops.slice(state.itemCount);
      const s1 = newStops[0] || '';
      const s2 = newStops[1] || '';
      const a1 = state.assignments[state.itemCount];
      const a2 = state.assignments[state.itemCount + 1];
      if (!a1 || !a2) return '';
      const e1 = getItemEmoji(a1.object);
      const e2 = getItemEmoji(a2.object);
      return `${yourify(firstCap(s1))} — ${e1} ${a1.object}. Make it yours.\n\n${yourify(firstCap(s2))} — ${e2} ${a2.object}. Make it yours.`;
    }

    case "expansion-preview": {
      const newAssignments = state.assignments.slice(state.itemCount);
      const lines = newAssignments.map(a => `${getItemEmoji(a.object)} ${a.object}`).join('\n\n');
      return `Two new items:\n\n${lines}`;
    }

    default:
      return "";
  }
}

export function getReactPlaceFallback(state: ConversationState): string {
  const name = state.userName || "friend";
  const place = yourify(firstCap(state.placeName));
  const total = state.itemCount;
  if (state.isReturningUser) {
    return `${place} -- good choice. Let's find ${total} stops along your path.`;
  }
  return `Oh, ${place}! I love that you picked that, ${name}. I can already picture you there. A place you really know is worth its weight in gold for this.`;
}

export function getReactPlaceStopIntro(state: ConversationState): string {
  const place = yourify(firstCap(state.placeName));
  const total = state.itemCount;
  return `\n\nNow, imagine you're walking through ${place.toLowerCase()} right now. We're going to choose ${total} spots along your path -- little landmarks you'd naturally pass by.`;
}

export function getReactStopFallback(state: ConversationState): string {
  const name = state.userName || "friend";
  const idx = state.stepIndex;
  const rawStop = yourify(firstCap(state.stops[idx] || ""));
  if (idx === 0) {
    return `${rawStop} -- I can see it. That's your first stop, ${name}. Keep walking for me.`;
  }
  return `${rawStop} -- good. ${name}, you know this place inside and out.`;
}

export function getReactStopRouteAppend(_state: ConversationState): string {
  return "__STOPS_PENDING__";
}

export function getMirrorObjectFallback(state: ConversationState): string {
  const name = state.userName || "friend";
  const place = yourify(firstCap(state.placeName));
  const idx = state.stepIndex;
  const total = state.itemCount;
  const scene = state.userScenes[idx] || "";
  const snippet = scene.length > 40 ? scene.substring(0, 40).trim() + "..." : scene;
  if (idx === total - 1) {
    return `"${snippet}" -- love it. All ${total} planted, ${name}. Your Memory Palace is alive!\n\nNow the real test. I'll walk you back through ${place.toLowerCase()} and you tell me what you see at each stop. Whatever you remember is a win.`;
  }
  if (idx === 0) {
    return `"${snippet}" -- brilliant, ${name}. That one's locked in. Next stop.`;
  }
  return `"${snippet}" -- perfect, ${name}. ${total - idx - 1} to go.`;
}

export function getReactRecallFallback(state: ConversationState): string {
  return "Yes! Keep walking.";
}

export function getNextBeat(current: BeatId, state: ConversationState): BeatId | null {
  const idx = state.stepIndex;
  const total = state.itemCount;
  const checkInTotal = state.checkInAssignments.length;
  const hasCleaning = state.lessonConfig?.cleaning === true;

  switch (current) {
    case "check-in-intro":
      return "check-in-recall";

    case "check-in-recall":
      return "react-check-in";

    case "react-check-in":
      if (idx < checkInTotal - 1) return "check-in-recall";
      return "check-in-done";

    case "check-in-done":
      return "welcome";

    case "cleaning-intro":
      return "cleaning-recall";

    case "cleaning-recall":
      return "react-cleaning";

    case "react-cleaning":
      if (idx < state.lastStops.length - 1) return "cleaning-recall";
      return "welcome";

    case "pre-clean":
      return "cleaning-walkthrough-done";

    case "cleaning-walkthrough":
      return "cleaning-walkthrough-done";

    case "cleaning-walkthrough-done":
      if (state.stops.length > 0) return "palace-return";
      return "ask-place";

    case "welcome":
      if (state.dayCount > 0) return "pre-clean";
      return "onboard-welcome";

    case "onboard-welcome":
      return typeof window !== 'undefined' && localStorage.getItem('memoryamble-goal') ? "onboard-ready" : "onboard-skill";

    case "onboard-skill":
      return "onboard-palace";

    case "onboard-palace":
      return "onboard-vivid";

    case "onboard-vivid":
      return "onboard-secret";

    case "onboard-secret":
      return "onboard-ready";

    case "onboard-ready":
      return "ask-stop";

    case "ask-place":
      return "react-place";

    case "confirm-same-place":
      return "react-place";

    case "react-place":
      return "ask-stop";

    case "ask-stop":
      return "react-stop";

    case "react-stop":
      if (idx < total - 1) return "ask-stop";
      return "assigning";

    case "assigning":
      if (state.dayCount === 0) return "practice-intro";
      return "item-preview";

    case "practice-intro":
      return "practice-item";

    case "practice-item":
      return "react-practice";

    case "react-practice":
      return "practice-buffer";

    case "practice-buffer":
      return "practice-recall";

    case "practice-recall":
      return "practice-success";

    case "practice-success":
      return "item-preview";

    case "practice-done":
      return "item-preview";

    case "item-preview":
      return "placement-intro";

    case "palace-return":
      return "assigning";

    case "placement-intro":
      return "place-object";

    case "place-object":
      return "mirror-object";

    case "mirror-object":
      if (idx < total - 1) return "place-object";
      return "palace-buffer";

    case "palace-buffer":
      return "walkthrough-intro";

    case "walkthrough-intro":
      if (state.lessonConfig?.reverse) return "reverse-intro";
      return "recall";

    case "reverse-intro":
      return "reverse-offer";

    case "reverse-offer":
      return "recall";

    case "recall":
      return "react-recall";

    case "react-recall":
      console.log(`react-recall: idx=${idx}, total=${total}, correctCount=${state.correctCount}`);
      if (idx < total - 1) return "recall";
      if (state.dayCount === 1 && !state.expansionOffered) return "expansion-offer";
      if (state.lessonConfig?.reverse && !state.reverseOffered) return "reverse-offer";
      if (!state.wisdomDropFired && state.correctCount > 0) return "wisdom-drop";
      if (hasCleaning) return "palace-wipe";
      if (state.correctCount === total) return "graduation-offer";
      return "final";

    case "wisdom-drop":
      if (state.dayCount === 1 && !state.expansionOffered && idx === total - 1) return "expansion-offer";
      if (idx < total - 1) return "recall";
      if (hasCleaning) return "palace-wipe";
      if (state.correctCount === total) return "graduation-offer";
      return "final";

    case "expansion-offer":
      return "expansion-stop-1";

    case "expansion-stop-1":
      return "expansion-stop-2";

    case "expansion-stop-2":
      return "expansion-preview";

    case "expansion-preview":
      return "place-object";

    case "expansion-intro":
      return "palace-buffer";

    case "palace-wipe":
      if (state.correctCount === total) return "graduation-offer";
      return "final";

    case "graduation-offer":
      if (state.dayCount === 6) return null;
      return "final";

    case "final":
      return null;

    default:
      return null;
  }
}

export function beatNeedsUserInput(beatId: BeatId): boolean {
  return [
    "ask-place",
    "confirm-same-place",
    "ask-stop",
    "place-object",
    "practice-item",
    "practice-recall",
    "recall",
    "check-in-recall",
    "cleaning-recall",
    "onboard-skill",
    "expansion-stop-1",
    "expansion-stop-2",
  ].includes(beatId);
}

export function beatNeedsContinueButton(beatId: BeatId): boolean {
  return beatId === "welcome"
    || beatId === "onboard-welcome"
    || beatId === "onboard-palace"
    || beatId === "onboard-vivid"
    || beatId === "onboard-secret"
    || beatId === "onboard-ready"
    || beatId === "palace-wipe"
    || beatId === "check-in-done"
    || beatId === "cleaning-intro"
    || beatId === "graduation-offer"
    || beatId === "reverse-intro"
    || beatId === "pre-clean"
    || beatId === "cleaning-walkthrough"
    || beatId === "cleaning-walkthrough-done"
    || beatId === "practice-buffer"
    || beatId === "practice-success"
    || beatId === "practice-done"
    || beatId === "item-preview"
    || beatId === "palace-buffer"
    || beatId === "wisdom-drop"
    || beatId === "expansion-offer"
    || beatId === "expansion-preview";
}

export function getContinueButtonLabel(beatId: BeatId): string {
  if (beatId === "onboard-welcome") return "Yes, let us go!";
  if (beatId === "onboard-secret") return "Let the Memory-Ambling Begin!";
  if (beatId === "item-preview") return "Ready to place them →";
  if (beatId === "practice-buffer") return "Ok, I Pictured It";
  if (beatId === "practice-success") return "Let us do it!";
  if (beatId === "practice-done") return "Let's do it!";
  if (beatId === "palace-buffer") return "I'm ready";
  if (beatId === "wisdom-drop") return "Continue →";
  return "I'm Ready, Let's Go!";
}

const STRUGGLE_PHRASES = [
  "stuck", "help", "i don't know", "i dont know", "no idea",
  "what was it", "forgot", "idk", "hint",
];

export function isStrugglePhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (lower === "?") return true;
  return STRUGGLE_PHRASES.some(
    (p) => lower === p || (lower.length < 35 && lower.includes(p))
  );
}

export function getInputPlaceholder(beatId: BeatId, state: ConversationState): string {
  const isNames = state.category === "names";
  switch (beatId) {
    case "onboard-skill":
      return "Name your place...";
    case "ask-place":
      return "Tell me about a place you love...";
    case "ask-stop":
      return "What do you see?";
    case "practice-item":
      return "What do you see there?";
    case "practice-recall":
      return "What do you see there?";
    case "place-object":
      return isNames ? "Describe the scene..." : "Describe what you imagine...";
    case "recall":
      return isNames ? "Who did you meet here?" : "What do you see at this stop?";
    case "check-in-recall":
      return "What was at this stop?";
    case "cleaning-recall":
      return "What fades away?";
    case "expansion-stop-1":
    case "expansion-stop-2":
      return "Name the stop...";
    default:
      return "Type your answer...";
  }
}
