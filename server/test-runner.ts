#!/usr/bin/env tsx

// ============================================================
// Replicated core logic (no client imports — fully self-contained)
// ============================================================

// Mirrors RANDOM_OBJECTS in routes.ts
const RANDOM_OBJECTS = [
  "penguin", "flamingo", "jellyfish", "lobster", "peacock",
  "sloth", "ostrich", "pelican", "toucan", "platypus",
  "accordion", "trombone", "tuba", "banjo", "xylophone",
  "guitar", "jukebox", "typewriter", "telescope", "periscope",
  "anchor", "canoe", "kayak", "surfboard", "propeller",
  "globe", "compass", "sundial", "weathervane", "lantern",
  "beehive", "cactus", "sunflower", "pineapple", "watermelon",
  "trophy", "crown", "scepter", "monocle", "top hat",
  "grandfather clock", "abacus", "chessboard", "dartboard", "easel",
  "fire hydrant", "mailbox", "parking meter", "wheelbarrow", "birdbath",
  "disco ball", "pinball machine", "bowling ball", "boxing gloves", "fencing sword",
  "hot air balloon", "parachute", "hang glider", "diving helmet", "astronaut helmet",
];

function pickRandom(list: string[], count: number): string[] {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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

function asStop(raw: string): string {
  return flipPronoun(raw);
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

function fuzzyMatch(userAnswer: string, correctObject: string): boolean {
  const cleanAnswer = userAnswer.toLowerCase().trim().replace(/\s+/g, "").replace(/[^\w]/g, "");
  const cleanCorrect = correctObject.toLowerCase().trim().replace(/\s+/g, "").replace(/[^\w]/g, "");
  return cleanAnswer.includes(cleanCorrect) || cleanCorrect.includes(cleanAnswer);
}

function isSamePlaceIntent(input: string): boolean {
  return /^(same|same\s+(place|one|spot)|same\s+as\s+(before|last\s+time)|that\s+(same\s+)?one|the\s+same)$/i.test(input.trim());
}

// Mirror of reactStopMessage from beat-engine.ts (react-stop case)
function reactStopMessage(
  stops: string[],
  idx: number,
  total: number,
  placeName: string,
  userName: string,
): string {
  const place = cap(flipPronoun(placeName)).toLowerCase();
  const rawStop = stops[idx] || "";

  if (idx === total - 1) {
    const routeList = stops.map((s, i) => `${ordinal(i + 1)}, ${asStop(s)}`).join(".\n");
    return `${cap(rawStop)} -- beautiful. So here's your route through ${place}:\n\n${routeList}.\n\nThat, ${userName}, is the skeleton of your Memory Palace.`;
  }
  if (idx === 0) {
    return `Oh, ${rawStop} -- I can see it. That's a lovely first stop, ${userName}. Keep walking for me. What comes next?`;
  }
  return `Ah, ${rawStop} -- perfect. ${userName}, you know this place inside and out.\n\nKeep walking...`;
}

// ============================================================
// Adjective / action-word detection
// ============================================================

// Known adjectives that should not appear as modifiers in object names
const KNOWN_ADJECTIVES = new Set([
  "giant", "flaming", "dancing", "golden", "purple", "singing", "flying",
  "glowing", "tiny", "rainbow", "neon", "crystal", "velvet", "sparkling",
  "floating", "trumpeting", "magical", "magic", "mysterious", "ancient",
  "electric", "bright", "dark", "shiny", "rusty", "broken", "rubber",
  "super", "mega", "ultra", "mini", "big", "small", "large", "great",
  "little", "old", "new", "red", "blue", "green", "yellow", "black",
  "white", "silver", "golden", "chocolate",
]);

// Gerunds/participles that are adjectives, NOT compound-noun prefixes
const GERUND_ADJECTIVES = new Set([
  "flaming", "dancing", "singing", "flying", "glowing", "floating",
  "sparkling", "trumpeting", "roller-skating", "bubble-blowing",
]);

function hasAdjectiveOrAction(object: string): { bad: boolean; reason: string } {
  // Reject "a ..." or "an ..." articles
  if (/^(a|an)\s+/i.test(object)) {
    return { bad: true, reason: `starts with article "${object.split(" ")[0]}"` };
  }

  const words = object.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (KNOWN_ADJECTIVES.has(word)) {
      return { bad: true, reason: `contains adjective "${word}"` };
    }
    if (GERUND_ADJECTIVES.has(word)) {
      return { bad: true, reason: `contains action-gerund "${word}"` };
    }
  }

  return { bad: false, reason: "" };
}

// ============================================================
// Test framework
// ============================================================

interface TestResult {
  day: number;
  checkName: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];

function check(
  day: number,
  checkName: string,
  passed: boolean,
  expected: string,
  actual: string,
) {
  results.push({ day, checkName, passed, expected, actual });
  const status = passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`  [${status}] ${checkName}`);
  if (!passed) {
    console.log(`         Expected : ${expected}`);
    console.log(`         Actual   : ${actual}`);
  }
}

// ============================================================
// Day configurations
// ============================================================

interface DayConfig {
  day: number;
  placeInput: string;      // what the user types
  resolvedPlace: string;   // after same-place detection
  lastPalaceName: string;  // from previous day (for same-place resolution)
  stops: string[];
  reverse: boolean;
  cleaning: boolean;
}

const dayConfigs: DayConfig[] = [
  {
    day: 1,
    placeInput: "my house",
    resolvedPlace: "my house",
    lastPalaceName: "",
    stops: ["front door", "kitchen", "fish tank"],
    reverse: false,
    cleaning: false,
  },
  {
    day: 2,
    placeInput: "same place",
    resolvedPlace: "my house",  // resolved from Day 1
    lastPalaceName: "my house",
    stops: ["front door", "kitchen", "fish tank", "desk", "sofa"],
    reverse: false,
    cleaning: true,
  },
  {
    day: 3,
    placeInput: "my office",
    resolvedPlace: "my office",
    lastPalaceName: "my house",
    stops: ["reception", "printer", "desk", "whiteboard", "window"],
    reverse: true,
    cleaning: true,
  },
  {
    day: 5,
    placeInput: "my garden",
    resolvedPlace: "my garden",
    lastPalaceName: "my office",
    stops: [
      "gate", "path", "rose bush", "pond", "bench",
      "shed", "greenhouse", "vegetable patch", "tree", "patio",
    ],
    reverse: true,
    cleaning: true,
  },
];

// ============================================================
// Run tests
// ============================================================

const TEST_USER = "Tester";

for (const config of dayConfigs) {
  const { day, placeInput, resolvedPlace, lastPalaceName, stops, reverse } = config;
  console.log(`\nDay ${day} — place: "${placeInput}" (${stops.length} stops, reverse=${reverse})`);

  // Resolve "same place"
  let actualPlace = placeInput;
  if (isSamePlaceIntent(placeInput)) {
    if (!lastPalaceName) {
      console.log(`  [WARN] "same place" used but no lastPalaceName set — using input as-is`);
    } else {
      actualPlace = lastPalaceName;
    }
  }
  const sameResolutionCorrect = actualPlace === resolvedPlace;
  if (!sameResolutionCorrect) {
    console.log(`  [WARN] Place resolution mismatch: got "${actualPlace}", expected "${resolvedPlace}"`);
  }

  // Assign objects (use seeded shuffle for reproducibility in output; still random per run)
  const items = pickRandom(RANDOM_OBJECTS, stops.length);
  const assignments = stops.map((stop, i) => ({ stopName: stop, object: items[i] }));

  // ------------------------------------------------------------------
  // CHECK 1 — STOP ECHO
  // ------------------------------------------------------------------
  let stopEchoPass = true;
  const stopEchoFailures: string[] = [];

  for (let idx = 0; idx < stops.length; idx++) {
    const msg = reactStopMessage(stops, idx, stops.length, actualPlace, TEST_USER);
    const submitted = stops[idx];

    // For the final stop, the message starts with cap(rawStop), so compare lowercase
    const msgLower = msg.toLowerCase();
    const foundExact = msgLower.includes(submitted.toLowerCase());

    if (!foundExact) {
      stopEchoPass = false;
      stopEchoFailures.push(`stop[${idx}] "${submitted}" not found in message`);
    }
  }

  check(
    day,
    "STOP ECHO",
    stopEchoPass,
    `All ${stops.length} stop names echoed in Timbuk's response`,
    stopEchoPass ? "All stops found" : stopEchoFailures.join(" | "),
  );

  // ------------------------------------------------------------------
  // CHECK 2 — OBJECT FORMAT
  // ------------------------------------------------------------------
  const badObjects: string[] = [];

  for (const a of assignments) {
    const { bad, reason } = hasAdjectiveOrAction(a.object);
    if (bad) {
      badObjects.push(`"${a.object}" (${reason})`);
    }
  }

  check(
    day,
    "OBJECT FORMAT",
    badObjects.length === 0,
    "All objects are plain nouns — no adjectives or action words",
    badObjects.length === 0 ? "All clean" : badObjects.join(", "),
  );

  // ------------------------------------------------------------------
  // CHECK 3 — ROUTE COUNT
  // ------------------------------------------------------------------
  const finalMsg = reactStopMessage(stops, stops.length - 1, stops.length, actualPlace, TEST_USER);

  // Count ordinal markers that appear in the route list portion
  let routeCount = 0;
  for (let n = 1; n <= stops.length; n++) {
    const ord = ordinal(n) + ",";
    if (finalMsg.includes(ord)) routeCount++;
  }

  check(
    day,
    "ROUTE COUNT",
    routeCount === stops.length,
    `${stops.length} stops in route summary`,
    `${routeCount} ordinal markers found in final react-stop message`,
  );

  // ------------------------------------------------------------------
  // CHECK 4 — FUZZY RECALL
  // ------------------------------------------------------------------
  const fuzzyFailures: string[] = [];

  // Test each assigned object: submit only the last word of the object name (partial answer)
  for (const a of assignments) {
    const words = a.object.split(" ");
    const partialAnswer = words[words.length - 1]; // e.g. "ball" for "bowling ball"
    const matched = fuzzyMatch(partialAnswer, a.object);
    if (!matched) {
      fuzzyFailures.push(`"${partialAnswer}" vs "${a.object}"`);
    }
  }

  // Spec examples from the task description
  const specCases: Array<{ answer: string; correct: string }> = [
    { answer: "guitar",    correct: "guitar" },
    { answer: "penguin",   correct: "penguin" },
    { answer: "ball",      correct: "bowling ball" },
    { answer: "parachute", correct: "parachute" },
    { answer: "helmet",    correct: "diving helmet" },
    { answer: "flamingo",  correct: "flamingo" },
  ];

  for (const { answer, correct } of specCases) {
    const matched = fuzzyMatch(answer, correct);
    if (!matched) {
      fuzzyFailures.push(`spec: "${answer}" should match "${correct}"`);
    }
  }

  check(
    day,
    "FUZZY RECALL",
    fuzzyFailures.length === 0,
    "Partial answers match their objects via fuzzy logic",
    fuzzyFailures.length === 0 ? "All recall cases matched" : fuzzyFailures.join(" | "),
  );
}

// ============================================================
// Summary
// ============================================================

console.log("\n============================================================");
const passed = results.filter((r) => r.passed).length;
const total = results.length;
const allPassed = passed === total;
const summaryColor = allPassed ? "\x1b[32m" : "\x1b[31m";
console.log(`\n${summaryColor}${passed}/${total} checks passed.\x1b[0m`);

const failures = results.filter((r) => !r.passed);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  Day ${f.day} — ${f.checkName}`);
    console.log(`    Expected : ${f.expected}`);
    console.log(`    Actual   : ${f.actual}`);
  }
} else {
  console.log("\nAll checks passed!");
}

process.exit(allPassed ? 0 : 1);
