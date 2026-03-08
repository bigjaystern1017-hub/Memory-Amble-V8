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
  | "welcome"
  | "ask-place"
  | "react-place"
  | "ask-stop"
  | "react-stop"
  | "assigning"
  | "placement-intro"
  | "place-object"
  | "mirror-object"
  | "walkthrough-intro"
  | "recall"
  | "react-recall"
  | "palace-wipe"
  | "graduation-offer"
  | "final";

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
  category: "objects" | "names";
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
}

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
  };
}

function flipPronoun(input: string): string {
  let text = input.trim();
  text = text.replace(/^my\s+/i, "your ");
  text = text.replace(/^i\s+call\s+it\s+/i, "");
  text = text.replace(/^it's\s+/i, "");
  text = text.replace(/^the\s+/i, (m) => m.toLowerCase());
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function asPlace(raw: string): string {
  return cap(flipPronoun(raw));
}

function asStop(raw: string): string {
  return flipPronoun(raw);
}

export function getProgressStep(beatId: BeatId): number {
  const checkInBeats: BeatId[] = ["check-in-intro", "check-in-recall", "react-check-in", "check-in-done"];
  const cleaningBeats: BeatId[] = ["cleaning-intro", "cleaning-recall", "react-cleaning"];
  const palaceBeats: BeatId[] = ["ask-place", "react-place", "ask-stop", "react-stop", "assigning"];
  const rememberBeats: BeatId[] = ["placement-intro", "place-object", "mirror-object"];
  const recallBeats: BeatId[] = ["walkthrough-intro", "recall", "react-recall"];

  if (beatId === "welcome") return 0;
  if (checkInBeats.includes(beatId)) return 0;
  if (cleaningBeats.includes(beatId)) return 0;
  if (palaceBeats.includes(beatId)) return 1;
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

function fuzzyMatch(userAnswer: string, correctObject: string): boolean {
  const cleanAnswer = userAnswer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, "");
  const cleanCorrect = correctObject
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\w]/g, "");
  return cleanAnswer.includes(cleanCorrect) || cleanCorrect.includes(cleanAnswer);
}

function itemLabel(category: "objects" | "names"): string {
  return category === "names" ? "names" : "items";
}

function placeVerb(category: "objects" | "names"): string {
  return category === "names" ? "imagine meeting" : "place";
}

export function getTimbukMessage(beatId: BeatId, state: ConversationState): string {
  const name = state.userName || "friend";
  const place = asPlace(state.placeName);
  const idx = state.stepIndex;
  const total = state.itemCount;
  const lesson = state.lessonConfig;
  const dayNum = state.dayCount + 1;
  const hasCleaning = lesson?.cleaning === true;
  const hasReverse = lesson?.reverse === true;
  const cat = state.category;
  const isNames = cat === "names";

  const stop = (i: number) => asStop(state.stops[i] || "");
  const aStop = (i: number) => asStop(state.assignments[i]?.stopName || "");

  switch (beatId) {
    case "check-in-intro": {
      const lastPlace = asPlace(state.checkInPlace);
      return `${name}! Welcome back. Before we start today, let's take a quick stroll through ${lastPlace.toLowerCase()} and see what stuck from last time.`;
    }

    case "check-in-recall": {
      const a = state.checkInAssignments[idx];
      if (!a) return "";
      const stopLabel = asStop(a.stopName);
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

    case "cleaning-intro": {
      const lastPlace = asPlace(state.lastPalaceName);
      const lastRoute = state.lastStops.map((s, i) => `${ordinal(i + 1)}, ${asStop(s)}`).join(".\n");
      return `${name}, before we build anything new, let's clear out the palace from last time. You remember ${lastPlace.toLowerCase()}? Here's the route you walked:\n\n${lastRoute}.\n\nI'll guide you through each one, and you picture the breeze clearing it clean.`;
    }

    case "cleaning-recall": {
      const idx = state.stepIndex;
      const stop = asStop(state.lastStops[idx] || "");
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

    case "welcome":
      if (state.isReturningUser && state.stops.length > 0) {
        const stopsStr = state.stops.slice(0, 3).join(", ");
        const catLabel = isNames ? "people's names" : `${total} ${itemLabel(cat)}`;
        return `Welcome back, ${name}! I see we have your ${stopsStr}${state.stops.length > 3 ? ", and more" : ""} ready. Today we're working with ${catLabel} -- let's plant some new memories!`;
      }
      if (state.isReturningUser) {
        const catLabel = isNames ? "people's names" : `${total} ${itemLabel(cat)}`;
        return `Alright, ${name}, welcome to Day ${dayNum}! Today's focus is ${lesson?.focus || "memory"}. We're working with ${catLabel}. Let's build!`;
      }
      return `${name}! What a pleasure. I've been looking forward to our walk together. Today we're going to build something really special -- your very own Memory Palace. It's been around for thousands of years, and honestly? It's a lot of fun. Shall we get started?`;

    case "ask-place":
      if (state.isReturningUser) {
        return `Think of a place you know well, ${name}. It can be the same one as last time or somewhere new. Where shall we walk today?`;
      }
      return `So here's how this works, ${name}. I want you to think of a place that feels like home to you. Somewhere you could walk through with your eyes closed -- maybe your house, your garden, a favourite shop you've visited a hundred times. Tell me about a place you love.`;

    case "react-place":
      if (state.isReturningUser) {
        return `${cap(place.toLowerCase())} -- lovely choice. Let's find ${total} stops along your path.`;
      }
      return `Oh, ${place.toLowerCase()}! I love that you picked that, ${name}. I can already picture you there. A place you really know is worth its weight in gold for this.\n\nNow, imagine you're walking through ${place.toLowerCase()} right now. We're going to choose ${total} spots along your path -- little landmarks you'd naturally pass by.`;

    case "ask-stop": {
      if (idx === 0) {
        return `Let's start right at the beginning. You've just arrived at ${place.toLowerCase()}. Look around -- what's the first thing that catches your eye? Whatever jumps out at you, ${name}, that's your first stop.`;
      }
      if (idx === total - 1) {
        const prevStops = state.stops.slice(0, idx).map((s) => asStop(s)).join(", ");
        return `You're past ${prevStops} now. As you continue through ${place.toLowerCase()}, where do you end up? What's your last stop?`;
      }
      return `You've passed ${stop(idx - 1)} and you're moving through the space. What do you notice next?`;
    }

    case "react-stop": {
      if (idx === total - 1) {
        const routeList = state.stops.map((s, i) => `${ordinal(i + 1)}, ${asStop(s)}`).join(".\n");
        return `${cap(stop(idx))} -- beautiful. So here's your route through ${place.toLowerCase()}:\n\n${routeList}.\n\nThat, ${name}, is the skeleton of your Memory Palace. Now let me find some ${itemLabel(cat)} to ${isNames ? "introduce" : "put in it"}...`;
      }
      if (idx === 0) {
        return `Oh, ${stop(0)} -- I can see it. That's a lovely first stop, ${name}. Keep walking for me. What comes next?`;
      }
      return `Ah, ${stop(idx)} -- perfect. ${name}, you know this place inside and out.\n\nKeep walking...`;
    }

    case "assigning":
      return "";

    case "placement-intro": {
      if (isNames) {
        return `Right, ${name}, here's where the fun really starts. I've picked ${total} people, and we're going to imagine meeting each one at your stops. The more vivid and personal the scene, the better you'll remember. Ready?`;
      }
      return `Right, ${name}, here's where the fun really starts. I've picked ${total} items, and we're going to plant one at each of your stops. The weirder you make the picture, the stickier the memory. Make each one bold, vivid, and unique to you.`;
    }

    case "place-object": {
      const a = state.assignments[idx];
      if (!a) return "";
      const stopLabel = cap(asStop(a.stopName));
      if (isNames) {
        if (idx === 0) {
          return `${stopLabel}. Imagine you bump into ${a.object} right here. What are they doing? What do they look like?`;
        }
        if (idx === total - 1) {
          return `Last one. ${stopLabel}, and it's ${a.object}. Picture something memorable about meeting them here. What do you see?`;
        }
        return `${stopLabel}. You meet ${a.object}. What's happening?`;
      }
      if (idx === 0) {
        return `${stopLabel}. Place ${a.object} right there. Remember to make it bold, vivid, and unique to you. What do you see happening?`;
      }
      if (idx === total - 1) {
        return `Last one. ${stopLabel}, and it's ${a.object}. Go wild, ${name} -- make it yours. What do you see?`;
      }
      return `${stopLabel}. The item is ${a.object}. What do you see happening there?`;
    }

    case "mirror-object": {
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

    case "walkthrough-intro": {
      if (hasReverse) {
        return `Close your eyes if you like, ${name}. You're at the entrance of ${place.toLowerCase()}. And here's the twist -- we're walking backwards this time. Start at your last stop and work your way back. What do you see?`;
      }
      return `Close your eyes if you like, ${name}. You're at the entrance of ${place.toLowerCase()}. Walk to your first stop...`;
    }

    case "recall": {
      const ri = recallAssignmentIndex(idx, state);
      const a = state.assignments[ri];
      if (!a) return "";
      const stopLabel = cap(asStop(a.stopName));
      if (isNames) {
        if (idx === 0) {
          return `${stopLabel}. Someone's here. Who did you meet?`;
        }
        if (idx === total - 1) {
          return `${stopLabel}. Last one. Who's waiting for you?`;
        }
        return `${stopLabel}. There's someone here. Who is it?`;
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

      if (isCorrect && isLast) {
        return `${a.object} -- brilliant finish, ${name}!`;
      }
      if (isCorrect) {
        return `Yes! ${a.object}! That's the palace at work, ${name}. Keep walking...`;
      }
      if (isLast) {
        return `That one was ${a.object}. The pictures will get clearer with practice, ${name}.`;
      }
      return `It was ${a.object}. No worries -- keep walking...`;
    }

    case "palace-wipe": {
      return `${name}, before we finish, let's clear the palace. Close your eyes and picture yourself at the entrance of ${place.toLowerCase()}. Now imagine a gentle breeze blowing through the whole place. As it passes each stop, the images float away like leaves. Take a slow breath. The palace is clean -- ready for new memories whenever you need it.`;
    }

    case "graduation-offer": {
      const nextLevel = Math.min(state.itemCount + 2, 9);
      return `${name}, you got every single one right! That tells me you're ready for more. Next time, we'll step up to ${nextLevel} ${itemLabel(cat)}. Your memory palace is growing!`;
    }

    case "final": {
      const count = state.correctCount;
      const graduated = state.graduated;
      const levelNote = graduated
        ? `\n\nYou've levelled up! Next session: ${Math.min(total + 2, 9)} ${itemLabel(cat)}.`
        : "";
      const dayNote = `\n\nSee you next time for Day ${dayNum + 1}!${levelNote}`;

      if (count === total) {
        return `${name}, ${count} out of ${total}. A perfect walk! You clearly have a wonderful imagination.\n\nYour palace at ${place.toLowerCase()} is yours now. Walk through it in your mind tonight before bed.${dayNote}`;
      }
      if (count >= total * 0.66) {
        return `${count} out of ${total}, ${name}! That is genuinely impressive. Your palace at ${place.toLowerCase()} is working.\n\nWalk through it one more time tonight -- those images will get even stickier.${dayNote}`;
      }
      if (count >= 1) {
        return `${count} out of ${total} -- and ${name}, that is a real start. The palace at ${place.toLowerCase()} is yours. The images are planted.\n\nTry walking through it one more time tonight. I think you'll surprise yourself.${dayNote}`;
      }
      return `${name}, what you just did took courage. You built a palace at ${place.toLowerCase()} and walked through it. The pictures will get clearer.\n\nTonight, try walking through it in your mind. Each time, they'll stick a little more.${dayNote}`;
    }

    default:
      return "";
  }
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

    case "welcome":
      return "ask-place";

    case "ask-place":
      return "react-place";

    case "react-place":
      return "ask-stop";

    case "ask-stop":
      return "react-stop";

    case "react-stop":
      if (idx < total - 1) return "ask-stop";
      return "assigning";

    case "assigning":
      return "placement-intro";

    case "placement-intro":
      return "place-object";

    case "place-object":
      return "mirror-object";

    case "mirror-object":
      if (idx < total - 1) return "place-object";
      return "walkthrough-intro";

    case "walkthrough-intro":
      return "recall";

    case "recall":
      return "react-recall";

    case "react-recall":
      if (idx < total - 1) return "recall";
      if (hasCleaning) return "palace-wipe";
      if (state.correctCount === total) return "graduation-offer";
      return "final";

    case "palace-wipe":
      if (state.correctCount === total) return "graduation-offer";
      return "final";

    case "graduation-offer":
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
    "ask-stop",
    "place-object",
    "recall",
    "check-in-recall",
    "cleaning-recall",
  ].includes(beatId);
}

export function beatNeedsContinueButton(beatId: BeatId): boolean {
  return beatId === "welcome" || beatId === "palace-wipe" || beatId === "check-in-done" || beatId === "cleaning-intro" || beatId === "graduation-offer";
}

export function getInputPlaceholder(beatId: BeatId, state: ConversationState): string {
  const isNames = state.category === "names";
  switch (beatId) {
    case "ask-place":
      return "Tell me about a place you love...";
    case "ask-stop":
      return "What do you see?";
    case "place-object":
      return isNames ? "Describe the scene..." : "Describe what you imagine...";
    case "recall":
      return isNames ? "Who did you meet here?" : "What do you see at this stop?";
    case "check-in-recall":
      return "What was at this stop?";
    case "cleaning-recall":
      return "What fades away?";
    default:
      return "Type your answer...";
  }
}
