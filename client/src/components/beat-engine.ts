import type { Assignment } from "@shared/schema";

export type BeatId =
  | "check-in-intro"
  | "check-in-recall"
  | "react-check-in"
  | "check-in-done"
  | "graduation-offer"
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
  category: "objects" | "names";
  stepIndex: number;
  checkInAssignments: Assignment[];
  checkInAnswers: string[];
  checkInCorrectCount: number;
  checkInPlace: string;
  isReturningUser: boolean;
  graduatedLevel: number | null;
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
    category: "objects",
    stepIndex: 0,
    checkInAssignments: [],
    checkInAnswers: [],
    checkInCorrectCount: 0,
    checkInPlace: "",
    isReturningUser: false,
    graduatedLevel: null,
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
  const checkInBeats: BeatId[] = ["check-in-intro", "check-in-recall", "react-check-in", "check-in-done", "graduation-offer"];
  const palaceBeats: BeatId[] = ["ask-place", "react-place", "ask-stop", "react-stop", "assigning"];
  const rememberBeats: BeatId[] = ["placement-intro", "place-object", "mirror-object"];
  const recallBeats: BeatId[] = ["walkthrough-intro", "recall", "react-recall"];

  if (beatId === "welcome") return 0;
  if (checkInBeats.includes(beatId)) return 0;
  if (palaceBeats.includes(beatId)) return 1;
  if (rememberBeats.includes(beatId)) return 2;
  if (recallBeats.includes(beatId)) return 3;
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
  return `#${n}`;
}

function extractKeyword(objectName: string): string {
  return objectName
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "")
    .replace(/^the\s+/i, "")
    .split(" ")
    .pop()
    ?.toLowerCase() || "";
}

function itemLabel(category: "objects" | "names"): string {
  return category === "names" ? "names" : "objects";
}

export function getTimbukMessage(beatId: BeatId, state: ConversationState): string {
  const name = state.userName || "friend";
  const place = asPlace(state.placeName);
  const idx = state.stepIndex;
  const total = state.itemCount;
  const isNames = state.category === "names";

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
      const keyword = extractKeyword(a.object);
      const isCorrect = answer.toLowerCase().includes(keyword);
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
      const total = state.checkInAssignments.length;
      const correct = state.checkInCorrectCount;
      if (correct === total) {
        return `${correct} out of ${total} -- every single one, ${name}! Your palace is rock solid. Ready for today's walk?`;
      }
      if (correct >= total / 2) {
        return `${correct} out of ${total}! That's great, ${name}. Those pictures are sticking. Ready for today's walk?`;
      }
      return `${correct} out of ${total}. The palace is still there, ${name} -- it just needs a bit more practice. Let's build some new memories today.`;
    }

    case "graduation-offer": {
      const newLevel = state.graduatedLevel || state.itemCount + 2;
      return `${name}, you got a perfect score yesterday! I think you're ready for a bigger challenge. How about we try ${newLevel} ${itemLabel(state.category)} today instead of ${state.itemCount}? Shall we go for it?`;
    }

    case "welcome":
      if (state.isReturningUser) {
        return `Alright, ${name}, let's build today's palace! We're working with ${total} ${itemLabel(state.category)} today. Tell me -- where are we walking?`;
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
      return `Oh, ${place.toLowerCase()}! I love that you picked that, ${name}. I can already picture you there. A place you really know is worth its weight in gold for this.\n\nNow, imagine you're walking through ${place.toLowerCase()} right now. We're going to choose ${total} spots along your path -- little landmarks you'd naturally pass by. Think of them as rest stops on our stroll.`;

    case "ask-stop": {
      if (idx === 0) {
        return `Let's start right at the beginning. You've just arrived at ${place.toLowerCase()}. Look around -- what's the first thing that catches your eye? Whatever jumps out at you, ${name}, that's your first stop.`;
      }
      if (idx === total - 1) {
        const prevStops = state.stops.slice(0, idx).map((s, i) => asStop(s)).join(", ");
        return `You're past ${prevStops} now. As you continue through ${place.toLowerCase()}, where do you end up? What's your last stop?`;
      }
      return `You've passed ${stop(idx - 1)} and you're moving through the space. What do you notice next?`;
    }

    case "react-stop": {
      if (idx === total - 1) {
        const routeList = state.stops.map((s, i) => `${ordinal(i + 1)}, ${asStop(s)}`).join(".\n");
        return `${cap(stop(idx))} -- beautiful. So here's your route through ${place.toLowerCase()}:\n\n${routeList}.\n\nThat, ${name}, is the skeleton of your Memory Palace. Now let me find some things to put in it...`;
      }
      if (idx === 0) {
        return `Oh, ${stop(0)} -- I can see it. That's a lovely first stop, ${name}. Keep walking for me. What comes next?`;
      }
      return `Ah, ${stop(idx)} -- perfect. ${name}, you know this place inside and out.\n\nKeep walking...`;
    }

    case "assigning":
      return "";

    case "placement-intro": {
      const itemWord = isNames ? "names" : "objects";
      return `Right, ${name}, here's where the fun really starts. I've picked ${total} ${itemWord}, and we're going to plant one at each of your stops. The weirder you make the picture, the stickier the memory.`;
    }

    case "place-object": {
      const a = state.assignments[idx];
      if (!a) return "";
      const stopLabel = cap(asStop(a.stopName));
      if (isNames) {
        return `${stopLabel}. The name is ${a.object}. Picture someone called ${a.object} doing something wild right here. What do you see?`;
      }
      if (idx === 0) {
        return `${stopLabel}. Place ${a.object} right there. Make it big, loud, silly -- whatever sticks. What do you see?`;
      }
      if (idx === total - 1) {
        return `Last one. ${stopLabel}, and the ${isNames ? "name" : "object"} is ${a.object}. Go wild. What do you see?`;
      }
      return `${stopLabel}. The ${isNames ? "name" : "object"} is ${a.object}. Picture something absurd. What's happening?`;
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

    case "walkthrough-intro":
      return `Close your eyes if you like, ${name}. You're at the entrance of ${place.toLowerCase()}. Walk to your first stop...`;

    case "recall": {
      const a = state.assignments[idx];
      if (!a) return "";
      const stopLabel = cap(asStop(a.stopName));
      if (idx === 0) {
        return `${stopLabel}. Something strange is here. What do you see?`;
      }
      if (idx === total - 1) {
        return `${stopLabel}. Last one. What's waiting for you here?`;
      }
      return `${stopLabel}. Something's out of place. What is it?`;
    }

    case "react-recall": {
      const a = state.assignments[idx];
      const answer = state.userAnswers[idx] || "";
      if (!a) return "";
      const keyword = extractKeyword(a.object);
      const isCorrect = answer.toLowerCase().includes(keyword);
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

    case "final": {
      const count = state.correctCount;
      if (count === total) {
        return `${name}, ${count} out of ${count}. A perfect walk through your Memory Palace! You clearly have a wonderful imagination.\n\nYour palace at ${place.toLowerCase()} is yours now. Walk through it in your mind tonight before bed, and I bet those images will be even more vivid tomorrow. I'm so proud of you.`;
      }
      if (count >= total * 0.66) {
        return `${count} out of ${total}, ${name}! For this session? That is genuinely impressive. Your palace at ${place.toLowerCase()} is working.\n\nHere's a little secret -- if you walk through it one more time tonight, those images will get even stickier. I had such a lovely time walking with you today.`;
      }
      if (count >= 1) {
        return `${count} out of ${total} -- and ${name}, that is a real start. You built a Memory Palace from nothing in just a few minutes. That palace at ${place.toLowerCase()}? It's yours.\n\nTry this tonight: close your eyes and walk through it one more time. I think you'll surprise yourself. I believe in you, ${name}.`;
      }
      return `${name}, what you just did took courage. You built a palace at ${place.toLowerCase()}, you filled it with wild images, and you walked through it. That is the whole technique.\n\nThe pictures will get clearer. Tonight, try walking through ${place.toLowerCase()} in your mind. Each time, they'll stick a little more.\n\nI had a wonderful time with you today, ${name}. You've got this.`;
    }

    default:
      return "";
  }
}

export function getNextBeat(current: BeatId, state: ConversationState): BeatId | null {
  const idx = state.stepIndex;
  const total = state.itemCount;
  const checkInTotal = state.checkInAssignments.length;

  switch (current) {
    case "check-in-intro":
      return "check-in-recall";

    case "check-in-recall":
      return "react-check-in";

    case "react-check-in":
      if (idx < checkInTotal - 1) return "check-in-recall";
      return "check-in-done";

    case "check-in-done":
      if (state.graduatedLevel !== null) return "graduation-offer";
      return "welcome";

    case "graduation-offer":
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
    "graduation-offer",
  ].includes(beatId);
}

export function beatNeedsContinueButton(beatId: BeatId): boolean {
  return beatId === "welcome";
}

export function getInputPlaceholder(beatId: BeatId, state: ConversationState): string {
  switch (beatId) {
    case "ask-place":
      return "Tell me about a place you love...";
    case "ask-stop":
      return "What do you see?";
    case "place-object":
      return "Describe what you imagine...";
    case "recall":
      return "What do you see at this stop?";
    case "check-in-recall":
      return "What was at this stop?";
    case "graduation-offer":
      return "Yes, let's do it! / I'd rather stay at this level";
    default:
      return "Type your answer...";
  }
}
