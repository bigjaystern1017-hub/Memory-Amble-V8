import type { Association } from "@shared/schema";

export type BeatId =
  | "welcome"
  | "ask-place"
  | "react-place"
  | "ask-stop-1"
  | "react-stop-1"
  | "ask-stop-2"
  | "react-stop-2"
  | "ask-stop-3"
  | "react-stop-3"
  | "generating"
  | "placement-intro"
  | "place-object-1"
  | "coach-object-1"
  | "place-object-2"
  | "coach-object-2"
  | "place-object-3"
  | "coach-object-3"
  | "walkthrough-intro"
  | "recall-1"
  | "react-recall-1"
  | "recall-2"
  | "react-recall-2"
  | "recall-3"
  | "react-recall-3"
  | "final";

export interface ConversationState {
  placeName: string;
  stops: string[];
  associations: Association[];
  userAnswers: string[];
  correctCount: number;
}

export function getTimbukMessage(beatId: BeatId, state: ConversationState): string {
  switch (beatId) {
    case "welcome":
      return "Hello, Gladys! I'm Timbuk, your memory coach. I'm so glad you're here today. We're going to do something wonderful together \u2014 we're going to build you a Memory Palace. It's an ancient technique, over 2,500 years old, and I promise, it's going to be a lot of fun. Ready to start?";

    case "ask-place":
      return "Wonderful! First, I need you to think of a place you know very well. It could be your childhood home, your current house, a favorite park \u2014 any place you can picture clearly in your mind. What place comes to mind, Gladys?";

    case "react-place":
      return `"${state.placeName}" \u2014 I can see it now! What a perfect choice, Gladys. A place with real memories is exactly what makes this work so beautifully.\n\nNow, I want you to imagine walking through ${state.placeName}. As you walk, we're going to pick 3 specific spots \u2014 I call them "stops" \u2014 that you naturally pass by.`;

    case "ask-stop-1":
      return `Let's start with your first stop. As you walk into ${state.placeName}, what's the very first thing you see or pass by? Maybe a doorway, a table, a window? Tell me about it, Gladys.`;

    case "react-stop-1":
      return `"${state.stops[0]}" \u2014 wonderful! I can picture that perfectly. You've got this, Gladys.\n\nNow keep walking through ${state.placeName}...`;

    case "ask-stop-2":
      return "What's the next spot you come to? The second thing that catches your eye as you continue through?";

    case "react-stop-2":
      return `"${state.stops[1]}" \u2014 oh, that's a great one! I love how clearly you see this place.\n\nOne more stop to go...`;

    case "ask-stop-3":
      return "And as you keep walking, what's your third and final stop? What do you see next?";

    case "react-stop-3":
      return `"${state.stops[2]}" \u2014 perfect! Now we have your three stops:\n\n1. ${state.stops[0]}\n2. ${state.stops[1]}\n3. ${state.stops[2]}\n\nYou've just built the skeleton of your Memory Palace, Gladys! Now comes the really fun part \u2014 I'm going to place some wonderfully bizarre objects at each of your stops. Give me just a moment to think up something truly unforgettable...`;

    case "generating":
      return "Let me think of something really vivid and funny for you...";

    case "placement-intro":
      return "I've got them! Now, Gladys, here's the secret: the stranger and funnier the image, the better your brain remembers it. So don't fight the silliness \u2014 embrace it! Let's place our first object.";

    case "place-object-1": {
      const a = state.associations[0];
      if (!a) return "";
      return `At your first stop \u2014 ${a.stopName} \u2014 I want you to picture ${a.object}.\n\n${a.scene}\n\nCan you see it, Gladys? Is the picture vivid? Can you almost smell it, hear it? Tell me when you've placed it firmly at ${a.stopName}.`;
    }

    case "coach-object-1":
      return `You've got this, Gladys! That image is locked in now. Every time you think of ${state.associations[0]?.stopName}, you'll see it. Beautiful.\n\nLet's move to your second stop.`;

    case "place-object-2": {
      const a = state.associations[1];
      if (!a) return "";
      return `Now at ${a.stopName}, picture this \u2014 ${a.object}.\n\n${a.scene}\n\nTake your time, Gladys. Really see the details. Can you feel the texture? Hear any sounds? Tell me when it's vivid in your mind.`;
    }

    case "coach-object-2":
      return `Wonderful! Two down, one to go. You're doing brilliantly, Gladys. Your palace is really coming alive!\n\nOn to your final stop.`;

    case "place-object-3": {
      const a = state.associations[2];
      if (!a) return "";
      return `And at your last stop \u2014 ${a.stopName} \u2014 imagine ${a.object}.\n\n${a.scene}\n\nLet it really sink in, Gladys. The more absurd you make it in your mind, the stronger the memory. Tell me when you can see it clearly.`;
    }

    case "coach-object-3":
      return "All three objects are placed! Your Memory Palace is complete, Gladys. You've done something remarkable today.\n\nNow, let's put it to the test. I'm going to ask you to walk through your palace one more time \u2014 but this time, you tell ME what you see at each stop. Don't worry if you can't remember everything perfectly. This is practice, not a test.";

    case "walkthrough-intro":
      return `Alright, Gladys. Close your eyes for a moment. Picture yourself standing at the entrance of ${state.placeName}. Take a breath.\n\nNow, walk to your first stop...`;

    case "recall-1":
      return `You're at ${state.associations[0]?.stopName}. Look around... what unusual thing do you see there?`;

    case "react-recall-1": {
      const a = state.associations[0];
      const answer = state.userAnswers[0] || "";
      const keyword = a?.object
        .replace(/^a\s+/i, "")
        .replace(/^an\s+/i, "")
        .replace(/^the\s+/i, "")
        .split(" ")
        .pop()
        ?.toLowerCase() || "";
      const isCorrect = answer.toLowerCase().includes(keyword);
      if (isCorrect) {
        return `Yes! ${a?.object}! I can see you really pictured that scene, Gladys. Wonderful!\n\nNow keep walking to your next stop...`;
      }
      return `The object was ${a?.object}. That's perfectly alright, Gladys \u2014 it gets easier with practice, I promise. Next time that image will be even stronger.\n\nLet's keep walking to your next stop...`;
    }

    case "recall-2":
      return `You're now at ${state.associations[1]?.stopName}. What do you see here?`;

    case "react-recall-2": {
      const a = state.associations[1];
      const answer = state.userAnswers[1] || "";
      const keyword = a?.object
        .replace(/^a\s+/i, "")
        .replace(/^an\s+/i, "")
        .replace(/^the\s+/i, "")
        .split(" ")
        .pop()
        ?.toLowerCase() || "";
      const isCorrect = answer.toLowerCase().includes(keyword);
      if (isCorrect) {
        return `That's it! ${a?.object}! You're a natural, Gladys. I can see it now \u2014 your palace is working!\n\nOne more stop to go...`;
      }
      return `It was ${a?.object}. Don't worry one bit, Gladys. Memory is a muscle, and you're already making it stronger.\n\nLet's visit your last stop...`;
    }

    case "recall-3":
      return `And finally, you're at ${state.associations[2]?.stopName}. What wild thing do you see here?`;

    case "react-recall-3": {
      const a = state.associations[2];
      const answer = state.userAnswers[2] || "";
      const keyword = a?.object
        .replace(/^a\s+/i, "")
        .replace(/^an\s+/i, "")
        .replace(/^the\s+/i, "")
        .split(" ")
        .pop()
        ?.toLowerCase() || "";
      const isCorrect = answer.toLowerCase().includes(keyword);
      if (isCorrect) {
        return `${a?.object} \u2014 exactly right! Oh, Gladys, that was beautiful!`;
      }
      return `That one was ${a?.object}. You know what, Gladys? The fact that you tried is what matters most. Each time you practice, these images become clearer and stickier.`;
    }

    case "final": {
      const count = state.correctCount;
      if (count === 3) {
        return "Gladys, you got all three! A perfect score on your very first Memory Palace. That is truly wonderful. You have a gift for this.\n\nYour palace is yours to keep. Whenever you want to practice, just walk through it in your mind. And remember \u2014 you can build as many palaces as you like. I'm so proud of you today. You've got this!";
      }
      if (count >= 2) {
        return `${count} out of 3, Gladys! That is a fantastic result for your first try. Your Memory Palace is working beautifully.\n\nWith a little practice, you'll be getting them all. The images get stickier each time you walk through. I'm so proud of you. You've got this!`;
      }
      if (count >= 1) {
        return `${count} out of 3 \u2014 and that is a wonderful start, Gladys. Remember, even world memory champions started right where you are. The beauty of a Memory Palace is that it gets stronger every time you walk through it.\n\nTry walking through your palace tonight before bed. I bet you'll surprise yourself. You've got this!`;
      }
      return "You know what, Gladys? Today wasn't about getting the answers right \u2014 it was about building your first palace. And you did that beautifully. The images are planted, and they'll get clearer with practice.\n\nTry walking through your palace tonight before bed. Picture each stop, and let those funny images come back. You've got this, Gladys. I believe in you!";
    }

    default:
      return "";
  }
}

export function getNextBeat(current: BeatId): BeatId | null {
  const flow: BeatId[] = [
    "welcome",
    "ask-place",
    "react-place",
    "ask-stop-1",
    "react-stop-1",
    "ask-stop-2",
    "react-stop-2",
    "ask-stop-3",
    "react-stop-3",
    "generating",
    "placement-intro",
    "place-object-1",
    "coach-object-1",
    "place-object-2",
    "coach-object-2",
    "place-object-3",
    "coach-object-3",
    "walkthrough-intro",
    "recall-1",
    "react-recall-1",
    "recall-2",
    "react-recall-2",
    "recall-3",
    "react-recall-3",
    "final",
  ];

  const idx = flow.indexOf(current);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

export function beatNeedsUserInput(beatId: BeatId): boolean {
  const inputBeats: BeatId[] = [
    "ask-place",
    "ask-stop-1",
    "ask-stop-2",
    "ask-stop-3",
    "place-object-1",
    "place-object-2",
    "place-object-3",
    "recall-1",
    "recall-2",
    "recall-3",
  ];
  return inputBeats.includes(beatId);
}

export function beatNeedsContinueButton(beatId: BeatId): boolean {
  return beatId === "welcome";
}

export function getInputPlaceholder(beatId: BeatId): string {
  switch (beatId) {
    case "ask-place":
      return "Name a place you know well...";
    case "ask-stop-1":
    case "ask-stop-2":
    case "ask-stop-3":
      return "Describe what you see...";
    case "place-object-1":
    case "place-object-2":
    case "place-object-3":
      return "I can see it! / Yes! / Tell Timbuk...";
    case "recall-1":
    case "recall-2":
    case "recall-3":
      return "What do you see at this stop?";
    default:
      return "Type your answer...";
  }
}
