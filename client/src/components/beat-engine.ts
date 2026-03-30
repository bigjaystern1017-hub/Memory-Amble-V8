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
  baseCorrectCount: number;
  baseItemCount?: number;
}

export const SMART_CONFIRM = "__SMART_CONFIRM__";

export function isReverseRecall(state: ConversationState): boolean {
  return state.lessonConfig?.reverse === true;
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
      const lastPlace = firstCap(state.checkInPlace);
      const placePhrase = yourify('your ' + lastPlace.toLowerCase());
      return `${name}! Welcome back. Before we start today, let's take a quick stroll through ${placePhrase} and see what stuck from last time.`;
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
      if (correct === ciTotal) {
        return `${correct} out of ${ciTotal} -- every single one, ${name}! Your palace is rock solid. Ready for today's lesson?`;
      }
      if (correct >= ciTotal / 2) {
        return `${correct} out of ${ciTotal}! That's great, ${name}. Those pictures are sticking. Ready for today's lesson?`;
      }
      return `${correct} out of ${ciTotal}. The palace is still there, ${name} -- it just needs a bit more practice. Let's build some new memories today.`;
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
      return `Before we build today, let us take a moment to clear your palace from yesterday. A clean palace is ready for new memories. Picture a gentle breeze moving through your space, lifting everything you placed there like leaves on the wind. Take a breath. Watch it all float away.`;
    }

    case "cleaning-walkthrough":
      return "";

    case "cleaning-walkthrough-done": {
      return `Your palace is clean. Fresh. Ready for today.`;
    }

    case "onboard-welcome":
      return `Ah, ${name}! What a pleasure — I am so happy to meet you. I am Timbuk and I would be honored to be your guide on this journey. Today we are going to build something really special — your very own Memory Palace — a technique that has been around for thousands of years, and honestly? It is a lot of fun. Shall we get started? Oh — and I have a small surprise waiting for you at the end.`;

    case "onboard-skill":
      return `Fantastic — I was hoping you would say that. Before we begin, one important thing. Memory is not fixed. It is a skill — like playing piano or riding a bike. And like any skill it can be trained and improved. Which is exactly why I am so excited to work with you today. ${name}, I have a question. Is there a place you know so well you could walk through it with your eyes closed? Your home, a garden, somewhere you have been a thousand times? Tell me — where shall we walk today?`;

    case "onboard-palace":
      return `Good. ${place} — that is your Memory Palace. It already exists. We are just going to furnish it. Scholars, orators and memory champions have been using this technique for over 2,000 years. Here is the secret, ${name}. Your brain is actually quite poor at remembering dry facts — names, lists, numbers. But it is extraordinary at remembering places. Spaces you have walked through a thousand times.`;

    case "onboard-vivid":
      return `The Memory Palace uses exactly that. We take an object — say, a penguin — and place it somewhere in your home. But here is where it gets fun, ${name}. We do not just plop a penguin by your front door. We make it YOURS. Is it enormous — blocking the whole doorway? Is it wearing a bow tie and tap dancing? Is it that same penguin that waddled after you at the zoo when you were eight years old and your mother had to pull you away?`;

    case "onboard-secret":
      return `The more vivid, the more ridiculous, the more personal — the harder your brain works to file it. And the harder it works, the longer it sticks. That is the whole secret right there. And ${name} — there is no failing here. No test. No pressure. This is a skill and the most important thing is practice. The more we walk together the sharper it gets. You can take this skill into your real life — grocery lists, names, appointments, whatever you like. Now hit that magic button...`;

    case "onboard-ready":
      return `Right then. If you can picture your home, you have already done half the work. I have a hint button if you ever get a little stuck. Ready? Let us find your palace.`;

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
        if (isPerfect) return `Welcome back, ${name}! Yesterday you remembered every single one — a perfect score on your very first palace. That tells me everything I need to know about you. Every day we work together your memory gets stronger and your palace more vivid. Today we expand. Ready? I have a small surprise waiting for you at the end.`;
        if (isGood) return `Welcome back, ${name}! Yesterday you remembered ${ys} out of ${yt} — and that is a genuinely strong start. Memory palace is a skill and skills take practice. Every day we work together it gets sharper. Today we build on what you started. Ready to expand? I have a small surprise waiting for you at the end.`;
        return `Welcome back, ${name} — and well done for coming back. That is the most important thing. Yesterday was your very first memory palace ever built. The fact that you are here today means the technique is already working on you. Today we go again, and I promise it gets easier. Let us build something together.`;
      }
      if (dayNum === 3) {
        const palaceNote = state.stops.length > 3
          ? `Your palace grew yesterday — all ${state.stops.length} stops are waiting. `
          : '';
        if (isPerfect) return `${palaceNote}${name}! Welcome back — and a warm huzzah for everything you have accomplished! Three days in and I am genuinely impressed. You remembered every single one yesterday. You built your palace, expanded it, and cleaned it like a pro. I hope you are noticing little improvements out there in your daily life — because I am certainly seeing them in here. Today we try something new that is going to stretch your memory in a brilliant new direction. Trust me on this one.`;
        if (isGood) return `${palaceNote}${name}! Welcome back — and a warm huzzah for everything you have accomplished! Three days in and you are doing beautifully. Yesterday you got ${ys} out of ${yt} — and every single attempt is strengthening your palace. I hope you are noticing little improvements out there in your daily life. Today we try something new that is going to stretch your memory in a brilliant direction. Trust me on this one.`;
        return `${palaceNote}${name}! Welcome back — and a warm huzzah just for showing up three days in a row. That takes real commitment. Memory palace is a skill — it grows with repetition, not perfection. I promise you, something is clicking in there even when it does not feel like it. Today we try something new. Stay with me. I have a small surprise waiting for you at the end.`;
      }
      if (dayNum === 4) {
        if (isPerfect) return `Welcome back, ${name}! Look at you — four days and a perfect score yesterday. Do you know how rare that is? Your memory palace is becoming second nature. Today we stretch to eight stops. A bigger palace. Your mind has been training for exactly this — I promise you are ready.`;
        if (isGood) return `Welcome back, ${name}! Four days and still going strong — that alone puts you ahead of most. Yesterday you got ${ys} out of ${yt} and every day it gets a little easier. Today we stretch to eight stops. A bigger palace. Your mind is ready for this.`;
        return `Welcome back, ${name}! Four days. Do you know how rare that is? Most people never make it this far. The palace is building in your mind whether you feel it or not. Today we stretch — eight stops. Stay with me. You are closer than you think.`;
      }
      if (dayNum === 5) {
        if (isPerfect) return `${name}, five days in — and yesterday you were flawless. Today is the absolute favourite because today we stop practicing and start using this for real life. We are going to fill your palace with things you actually need to remember. A grocery list. Appointments. Things from your week. This is what the memory palace was built for.`;
        if (isGood) return `${name}, five days in and you are doing beautifully. Today is the absolute favourite — because today we make this useful. Real items. Real life. Groceries, appointments, things from your week. This is what the memory palace was always meant for. Ready to see how practical this gets?`;
        return `${name}, five days. I want you to hear this — showing up every day IS the training. Today we do something different that I think is going to surprise you. We use the palace for real life. Groceries. Appointments. Things you actually need. Sometimes the technique clicks when it gets personal. Let us find out.`;
      }
      if (dayNum === 6) {
        if (isPerfect) return `Welcome back, ${name}! Six days — and yesterday you were remarkable. Today we try something most people find even more useful than objects — names. You are going to a dinner party tonight and you are going to remember every single person you meet. Here is the secret: turn every name into a vivid picture and attach it to the person's most memorable feature. Margaret? A giant magnet on her nose. The sillier the better. Ready? I have a small surprise waiting for you at the end.`;
        if (isGood) return `Welcome back, ${name}! Six days in and your palace is growing stronger every session. Today we try names — and I think this might be your favourite day yet. Turn every name into a vivid picture attached to something memorable about the person. Frederick? Picture him with a Fred Flintstone hat. Silly works. Ready? I have a small surprise waiting for you at the end.`;
        return `Welcome back, ${name}! Six days — that is something to be genuinely proud of. Today we switch things up completely and try names instead of objects. A fresh start, a new challenge. Sometimes a change is exactly what the palace needs. I think today is going to surprise you.`;
      }
      if (dayNum === 7) {
        if (isPerfect) return `${name}. Day seven. Take a breath and feel proud — because what you have done this week is genuinely extraordinary. Yesterday you were flawless. Today you graduate. Your biggest session yet. Full walk, reverse recall. And when we are done — I have something special waiting for you. Let us make this one count.`;
        if (isGood) return `${name}. Day seven. I want you to take a breath and feel proud for a moment. You came in knowing nothing about memory palaces. Look at you now. Today is your graduation — your biggest session yet. Full walk, reverse recall. And when we are done, I have something special waiting. Let us finish strong.`;
        return `${name}. Day seven. Do you realize what you have done? You showed up every single day for a week. That is the whole game. The palace is in you now whether it feels like it or not. Today we do your graduation session — and when we are done, I have something waiting that I think will mean a lot. Let us go. I have a small surprise waiting for you at the end.`;
      }
      // Days 8+: generic returning user message
      const catLabel = isNames ? "people's names" : `${total} ${itemLabel(cat)}`;
      return `Alright, ${name}, welcome to Day ${dayNum}! Today's focus is ${lesson?.focus || "memory"}. We're working with ${catLabel}. Let's build!`;
    }

    case "ask-place":
      if (state.isReturningUser) {
        return `Think of a place you know well, ${name}. It can be the same one as last time or somewhere new. Where shall we walk today?`;
      }
      return `So here's how this works, ${name}. I want you to think of a place that feels like home to you. Somewhere you could walk through with your eyes closed -- maybe your house, your garden, a favourite shop you've visited a hundred times. Tell me about a place you love.`;

    case "confirm-same-place": {
      const prev = firstCap(state.lastPalaceName);
      return `Back to ${yourify(prev.toLowerCase())}? Just say yes to keep it, or tell me somewhere new.`;
    }

    case "react-place":
      return SMART_CONFIRM;

    case "ask-stop": {
      if (idx === 0) {
        return `You are at the entrance of your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. What is the first thing that catches your eye? That is your first stop.`;
      }
      if (idx === total - 1) {
        return `Almost there. As you continue through your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}, where do you end up? What is your last stop?`;
      }
      return `What do you notice next?`;
    }

    case "react-stop":
      return SMART_CONFIRM;

    case "assigning":
      return "";

    case "practice-intro":
      return `Before we place your real items — let me show you exactly how this works. I will give you one practice item. Just tell me the first thing that comes to mind when you picture it at your first stop.`;

    case "practice-item": {
      const firstStop = yourify(firstCap(state.stops[0] || "your first stop"));
      return `${firstStop} — 🍍 Pineapple. Now make it YOURS — what is happening with that Pineapple at __STOP__?`;
    }

    case "react-practice":
      return SMART_CONFIRM;

    case "practice-buffer":
      return `Good. Now let us see if it stuck. Close your eyes for a moment. Picture __STOP__.`;

    case "practice-recall":
      return `${yourify(firstCap(state.stops[0] || "Front door"))}. What do you see there?`;

    case "practice-success":
      return `Yes! That is the palace at work, ${name}. You just remembered something using a technique that is 2,000 years old. And you did it in under a minute. That is all this is. Ready to do it for real?`;

    case "practice-done":
      return `Perfect. That is the whole technique. Now we do it for real — and I promise it gets more fun. Ready?`;

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
      return `${prefix} — ${emoji} ${a.object}. Now make it YOURS — what is happening with that ${a.object} at __STOP__?`;
    }

    case "mirror-object":
      return SMART_CONFIRM;

    case "palace-buffer": {
      return `Good. All ${total} planted, ${name}. Take a breath. Picture your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}.`;
    }

    case "walkthrough-intro": {
      return `Close your eyes. You are back at the entrance of your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. Just walk — whatever you placed will be waiting.`;
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
        return `${stopLabel}. Something strange is here. What do you see?`;
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
      return `${name}, before we finish, we need to clear the palace. Over time, if we don't, the images pile up and clutter the space, making it harder to remember new things. So we'll give it a good cleaning today to keep it fresh and ready for whatever comes next.

Now, close your eyes and picture yourself at the entrance of your ${yourify(place).toLowerCase().replace(/^your\s+/i, '')}. Imagine a gentle breeze blowing through the whole place. As it passes each stop, the images float away like leaves. Take a slow breath. The palace is clean -- ready for new memories whenever you need it.`;
    }

    case "graduation-offer": {
      if (state.dayCount === 6) {
        return `${name}. Stop for a moment. Look what you did this week.\n\nYou built your first Memory Palace. Cleaned it. Walked it forward and backward. Used it for real life. Learned names.\n\nSeven days ago you had never heard of a Memory Palace. Today you have one. That is not nothing, ${name}. That is actually extraordinary.\n\nWear it proudly. Rest that noggin this weekend. When you come back, we start Week 2. Good memorizing, ${name}. Over and out.`;
      }
      const nextLevel = Math.min(state.itemCount + 2, 9);
      return `${name}, you got every single one right! That tells me you're ready for more. Next time, we'll step up to ${nextLevel} ${itemLabel(cat)}. Your memory palace is growing!`;
    }

    case "final": {
      const count = Math.min(state.correctCount, state.itemCount);
      const total = state.itemCount;
      const graduated = state.graduated;
      const levelNote = graduated
        ? `\n\nYou've levelled up! Next session: ${Math.min(total + 2, 9)} ${itemLabel(cat)}.`
        : "";
      const dayNote = `\n\nSee you next time for Day ${dayNum + 1}!${levelNote}`;

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
      return "onboard-skill";

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
      return "recall";

    case "recall":
      return "react-recall";

    case "react-recall":
      console.log(`react-recall: idx=${idx}, total=${total}, correctCount=${state.correctCount}`);
      if (idx < total - 1) return "recall";
      if (state.dayCount === 1 && !state.expansionOffered) return "expansion-offer";
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
