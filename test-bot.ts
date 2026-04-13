/**
 * MemoryAmble Test Bot
 * 
 * Simulates a user (Gladys) playing through Days 1-7 by calling the real 
 * API endpoints and walking through the beat engine flow.
 * 
 * Usage:
 *   npx tsx test-bot.ts                  # Run Day 1 only
 *   npx tsx test-bot.ts --day 3          # Run Days 1-3
 *   npx tsx test-bot.ts --all            # Run Days 1-7
 *   npx tsx test-bot.ts --start 3        # Run Day 3 only (uses saved state from prior days)
 *   npx tsx test-bot.ts --all --verbose  # Full output including API responses
 * 
 * The bot hits your RUNNING local server, so make sure the app is running first.
 * It outputs a transcript of every Timbuk message and simulated user input.
 * 
 * Paste the output to Art5 for review.
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:5000";

// ============================================================
// CONFIGURATION — What "Gladys" does at each step
// ============================================================

const BOT_CONFIG = {
  userName: "Gladys",
  palaceName: "my house",
  stops: [
    "Front door",
    "Kitchen counter",
    "Hat rack",
    "Hallway mirror",
    "Back porch",
    "Living room couch",
    "Dining table",
    "Bedroom door",
    "Bathroom sink",
    "Garage",
    "Closet",
    "Staircase",
  ],
  // Scene descriptions the bot will use when placing objects
  sceneTemplates: [
    "it is wearing a tiny top hat and dancing",
    "my husband is sitting on it reading the newspaper",
    "it is enormous and blocking everything",
    "my dog is trying to eat it",
    "it is on fire but nobody seems to care",
    "it is singing opera very badly",
    "my granddaughter painted it bright pink",
    "it fell from the ceiling and landed perfectly",
    "there are three of them having a tea party",
    "it is wearing sunglasses and refusing to move",
    "my cat is sleeping on top of it",
    "it is spinning like a top",
  ],
  // For recall: probability of getting the answer right
  recallAccuracy: 0.7,
  // For cleaning: what the bot says when asked what fades away
  cleaningResponse: "it all blows away in the breeze",
};

// ============================================================
// STATE — Persists across days
// ============================================================

interface BotState {
  currentDay: number;
  dayCount: number;
  currentLevel: number;
  currentCategory: string;
  lastPalaceName: string;
  lastStops: string[];
  lastAssignments: Array<{ stopName: string; object: string }>;
  lastScore: number;
  lastTotal: number;
  lastUserScenes: string[];
  streak: number;
}

function createInitialState(): BotState {
  return {
    currentDay: 1,
    dayCount: 0,
    currentLevel: 3,
    currentCategory: "objects",
    lastPalaceName: "",
    lastStops: [],
    lastAssignments: [],
    lastScore: 0,
    lastTotal: 0,
    lastUserScenes: [],
    streak: 0,
  };
}

// ============================================================
// CURRICULUM — Mirrors shared/curriculum.ts
// ============================================================

interface LessonConfig {
  title: string;
  focus: string;
  itemCount: number;
  category: "objects" | "names" | "practical";
  cleaning: boolean;
  reverse: boolean;
}

function getLessonConfig(dayCount: number): LessonConfig {
  const configs: Record<number, LessonConfig> = {
    0: { title: "The Foundation", focus: "Building your first palace", itemCount: 3, category: "objects", cleaning: false, reverse: false },
    1: { title: "Settling In", focus: "Cleaning and rebuilding", itemCount: 3, category: "objects", cleaning: true, reverse: false },
    2: { title: "Stretching", focus: "More items, walking backwards", itemCount: 5, category: "objects", cleaning: true, reverse: true },
    3: { title: "Finding Your Stride", focus: "Strengthening the palace", itemCount: 5, category: "objects", cleaning: true, reverse: false },
    4: { title: "Growing Stronger", focus: "A bigger palace", itemCount: 8, category: "objects", cleaning: true, reverse: false },
    5: { title: "The Full Walk", focus: "Forward and backward", itemCount: 8, category: "objects", cleaning: true, reverse: true },
    6: { title: "Graduation", focus: "The big finish", itemCount: 8, category: "objects", cleaning: true, reverse: true },
  };
  return configs[dayCount] || configs[0];
}

// ============================================================
// API HELPERS
// ============================================================

async function apiPost(path: string, body: any): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `HTTP ${res.status}: ${text}` };
    }
    return await res.json();
  } catch (e: any) {
    return { error: e.message };
  }
}

async function getAssignments(stops: string[], category: string, dayCount: number): Promise<Array<{ stopName: string; object: string }>> {
  const data = await apiPost("/api/assign-objects", { stops, category, dayCount });
  if (data.error) {
    console.log(`  ⚠️  Assignment API error: ${data.error}`);
    // Fallback: generate dummy assignments
    return stops.map((s, i) => ({ stopName: s, object: `test-object-${i + 1}` }));
  }
  return data.assignments || [];
}

async function getSmartConfirm(params: any): Promise<string> {
  const data = await apiPost("/api/smart-confirm", params);
  if (data.error) return "[smart-confirm failed]";
  return data.confirmation || data.response || "[empty response]";
}

async function getScroll(params: any): Promise<string> {
  const data = await apiPost("/api/generate-scroll", params);
  if (data.error) return "[scroll generation failed]";
  return data.scroll || "[empty scroll]";
}

async function getSpark(params: any): Promise<string> {
  const data = await apiPost("/api/spark", params);
  if (data.error) return "[spark failed]";
  return data.spark || "[empty spark]";
}

// ============================================================
// TRANSCRIPT LOGGING
// ============================================================

const DIVIDER = "─".repeat(60);
let transcript: string[] = [];
let verbose = false;

function log(text: string) {
  transcript.push(text);
  console.log(text);
}

function logTimbuk(beat: string, text: string) {
  const truncated = text.length > 200 && !verbose ? text.substring(0, 200) + "..." : text;
  log(`  🧙 [${beat}] ${truncated}`);
}

function logUser(action: string, text: string) {
  log(`  👤 [${action}] ${text}`);
}

function logSystem(text: string) {
  log(`  ⚙️  ${text}`);
}

function logResult(label: string, value: string) {
  log(`  📊 ${label}: ${value}`);
}

// ============================================================
// DAY SIMULATION
// ============================================================

async function simulateDay(botState: BotState): Promise<BotState> {
  const dayNum = botState.dayCount + 1;
  const lesson = getLessonConfig(botState.dayCount);
  const itemCount = lesson.itemCount;
  const isDay1 = botState.dayCount === 0;
  const isReturning = botState.dayCount > 0;
  const hasCleaning = lesson.cleaning;
  const hasReverse = lesson.reverse;

  log(`\n${"=".repeat(60)}`);
  log(`  DAY ${dayNum}: ${lesson.title}`);
  log(`  Focus: ${lesson.focus}`);
  log(`  Items: ${itemCount} | Category: ${lesson.category} | Cleaning: ${hasCleaning} | Reverse: ${hasReverse}`);
  log(`${"=".repeat(60)}`);

  // Pick stops for this session
  const stopsNeeded = itemCount;
  const sessionStops = BOT_CONFIG.stops.slice(0, stopsNeeded);

  // ---- CHECK-IN RECALL (Days 2+, if yesterday had a session) ----
  if (isReturning && botState.lastAssignments.length > 0) {
    log(`\n${DIVIDER}`);
    log(`  📋 CHECK-IN RECALL (reviewing yesterday)`);
    log(DIVIDER);

    logTimbuk("check-in-intro", `${BOT_CONFIG.userName}! Welcome back. Before we start today, let's take a quick stroll through your ${botState.lastPalaceName} and see what stuck from last time.`);

    let checkInCorrect = 0;
    for (let i = 0; i < botState.lastAssignments.length; i++) {
      const a = botState.lastAssignments[i];
      const isCorrect = Math.random() < BOT_CONFIG.recallAccuracy;
      const userAnswer = isCorrect ? a.object : "I forgot";

      logTimbuk("check-in-recall", `${i === 0 ? `You're at ${a.stopName}.` : `Next stop -- ${a.stopName}.`} What was waiting for you there?`);
      logUser("check-in-answer", userAnswer);

      if (isCorrect) {
        checkInCorrect++;
        logTimbuk("react-check-in", `${a.object} -- you got it!`);
      } else {
        logTimbuk("react-check-in", `That was ${a.object}. That's alright -- let's keep going.`);
      }
    }

    logTimbuk("check-in-done", `${checkInCorrect} out of ${botState.lastAssignments.length}.`);
    logResult("Check-in score", `${checkInCorrect}/${botState.lastAssignments.length}`);
  }

  // ---- WELCOME ----
  log(`\n${DIVIDER}`);
  log(`  👋 WELCOME`);
  log(DIVIDER);

  if (isDay1) {
    logTimbuk("onboard-welcome", `Ah, ${BOT_CONFIG.userName}! I am so happy to meet you. I am Timbuk...`);
    logSystem("→ Button: Yes, let us go!");
    logTimbuk("onboard-skill", `Fantastic — before we begin, memory is not fixed...`);
  } else if (isReturning) {
    // Session opener would come from AI — we'll call the API
    const openerData = await apiPost("/api/session-opener", {
      userName: BOT_CONFIG.userName,
      currentDay: dayNum,
      yesterdayScore: botState.lastScore,
      yesterdayTotal: botState.lastTotal,
      yesterdayAssignments: botState.lastAssignments.map((a, i) => ({
        stopName: a.stopName,
        object: a.object,
        userAssociation: botState.lastUserScenes[i] || "",
      })),
      placeName: botState.lastPalaceName,
    });
    if (openerData.greeting) {
      logTimbuk("welcome (AI opener)", openerData.greeting);
    } else {
      logTimbuk("welcome", `Welcome back, ${BOT_CONFIG.userName}! Day ${dayNum}.`);
    }
  }

  // ---- CLEANING (Days 2+ if enabled) ----
  if (hasCleaning && isReturning) {
    log(`\n${DIVIDER}`);
    log(`  🧹 PALACE CLEANING`);
    log(DIVIDER);

    logTimbuk("pre-clean", `Before we build today, let us take a moment to clear your palace from yesterday...`);
    logSystem("→ Button: Continue");
    logTimbuk("cleaning-walkthrough-done", `Your palace is clean. Fresh. Ready for today.`);
  }

  // ---- PALACE SETUP ----
  log(`\n${DIVIDER}`);
  log(`  🏰 PALACE SETUP`);
  log(DIVIDER);

  if (isDay1) {
    logUser("palace-name", BOT_CONFIG.palaceName);
    const placeConfirm = await getSmartConfirm({
      userName: BOT_CONFIG.userName,
      userAssociation: BOT_CONFIG.palaceName,
      context: "place-confirmation",
    });
    logTimbuk("react-place (AI)", placeConfirm);
  } else {
    logSystem(`Using saved palace: ${botState.lastPalaceName || BOT_CONFIG.palaceName}`);
  }

  // Name stops
  for (let i = 0; i < stopsNeeded; i++) {
    const stop = sessionStops[i];
    if (i === 0) {
      logTimbuk("ask-stop", `You are at the entrance of your house. What is your first stop?`);
    } else if (i === stopsNeeded - 1) {
      logTimbuk("ask-stop", `As you continue through your house, where do you end up next?`);
    } else {
      logTimbuk("ask-stop", `What do you notice next?`);
    }
    logUser("stop-name", stop);

    const stopConfirm = await getSmartConfirm({
      userName: BOT_CONFIG.userName,
      userAssociation: stop,
      context: i === stopsNeeded - 1 ? "stop-confirmation" : "stop-transition",
    });
    logTimbuk("react-stop (AI)", stopConfirm);
  }

  // ---- GET ASSIGNMENTS ----
  log(`\n${DIVIDER}`);
  log(`  📦 ASSIGNMENTS`);
  log(DIVIDER);

  const assignments = await getAssignments(sessionStops, lesson.category, botState.dayCount);
  for (const a of assignments) {
    logSystem(`${a.stopName} → ${a.object}`);
  }

  // ---- PRACTICE ROUND (Day 1 only) ----
  if (isDay1) {
    log(`\n${DIVIDER}`);
    log(`  🎯 PRACTICE ROUND`);
    log(DIVIDER);

    logTimbuk("practice-intro", `Before we place your items — let me show you exactly how this works...`);
    logTimbuk("practice-item", `Front door — 🍍 Pineapple. Make it YOURS — what is happening with that Pineapple at your front door?`);
    logUser("practice-scene", "it is wearing sunglasses and blocking the whole door");

    const practiceConfirm = await getSmartConfirm({
      userName: BOT_CONFIG.userName,
      objectName: "pineapple",
      userAssociation: "it is wearing sunglasses and blocking the whole door",
      stopName: "front door",
      context: "object-placement",
    });
    logTimbuk("react-practice (AI)", practiceConfirm);

    logTimbuk("practice-buffer", `Now let us see if it stuck. Close your eyes for a moment. Picture your front door.`);
    logSystem("→ Button: Ok, I Pictured It");

    logTimbuk("practice-recall", `Front door. What do you see there?`);
    logUser("practice-answer", "pineapple");
    logSystem("🔔 DING DING + CHEER");

    logTimbuk("practice-success", `Yes! That is the palace at work, ${BOT_CONFIG.userName}. You just remembered something using a technique that is 2,000 years old.`);
  }

  // ---- ITEM PREVIEW ----
  log(`\n${DIVIDER}`);
  log(`  📋 ITEM PREVIEW`);
  log(DIVIDER);

  const itemLines = assignments.map(a => `  ${a.object}`).join("\n");
  logTimbuk("item-preview", `Today's items:\n${itemLines}`);
  logSystem("→ Button: Ready to place them →");

  // ---- PLACEMENT ----
  log(`\n${DIVIDER}`);
  log(`  🎨 PLACEMENT PHASE`);
  log(DIVIDER);

  logTimbuk("placement-intro", `Right, ${BOT_CONFIG.userName} — ${itemCount} items, one at each stop.`);

  const userScenes: string[] = [];
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const scene = BOT_CONFIG.sceneTemplates[i % BOT_CONFIG.sceneTemplates.length];

    logTimbuk("place-object", `${a.stopName} — ${a.object}. Make it YOURS —`);
    logUser("scene", `${scene}`);
    userScenes.push(scene);

    const mirrorConfirm = await getSmartConfirm({
      userName: BOT_CONFIG.userName,
      objectName: a.object,
      userAssociation: scene,
      stopName: a.stopName,
      context: "object-placement",
    });
    logTimbuk("mirror-object (AI)", mirrorConfirm);
  }

  logTimbuk("palace-buffer", `Good. All ${itemCount} planted, ${BOT_CONFIG.userName}. Take a breath.`);
  logSystem("→ SCREEN WIPE");

  // ---- FORWARD RECALL ----
  log(`\n${DIVIDER}`);
  log(`  🧠 RECALL PHASE (forward)`);
  log(DIVIDER);

  logTimbuk("walkthrough-intro", `You are back at the entrance of your house. Just walk — whatever you placed will be waiting.`);

  let correctCount = 0;
  const userAnswers: string[] = [];
  for (let i = 0; i < assignments.length; i++) {
    const a = assignments[i];
    const isCorrect = Math.random() < BOT_CONFIG.recallAccuracy;
    const userAnswer = isCorrect ? a.object : "I don't remember";

    if (i === 0) {
      logTimbuk("recall", `${a.stopName}. Something strange. What do you see?`);
    } else if (i === assignments.length - 1) {
      logTimbuk("recall", `${a.stopName}. Last one. What's waiting for you here?`);
    } else {
      logTimbuk("recall", `${a.stopName}. Something's out of place. What is it?`);
    }

    logUser("recall-answer", userAnswer);
    userAnswers.push(userAnswer);

    if (isCorrect) {
      correctCount++;
      const recallConfirm = await getSmartConfirm({
        userName: BOT_CONFIG.userName,
        objectName: a.object,
        userAssociation: userAnswer,
        originalScene: userScenes[i],
        stopName: a.stopName,
        context: "recall-confirmation",
      });
      logTimbuk("react-recall CORRECT (AI)", recallConfirm);
      logSystem("🔔 DING DING + CHEER");
    } else {
      logTimbuk("react-recall INCORRECT", `It was ${a.object}. No worries -- keep walking...`);
    }
  }

  logResult("Forward recall score", `${correctCount}/${assignments.length}`);

  // ---- REVERSE RECALL OFFER (if enabled) ----
  if (hasReverse) {
    log(`\n${DIVIDER}`);
    log(`  🔄 REVERSE RECALL OFFER`);
    log(DIVIDER);

    logTimbuk("reverse-offer", `You just walked that forward. Want to try something harder? Same palace, backwards.`);

    // Bot accepts the reverse challenge
    logUser("reverse-choice", "Let's try it!");
    logSystem("→ Accepted reverse recall");

    let reverseCorrect = 0;
    for (let i = assignments.length - 1; i >= 0; i--) {
      const a = assignments[i];
      const isCorrect = Math.random() < (BOT_CONFIG.recallAccuracy - 0.1); // slightly harder
      const userAnswer = isCorrect ? a.object : "hmm I forgot";

      logTimbuk("recall (reverse)", `${a.stopName}. What do you see?`);
      logUser("recall-answer", userAnswer);

      if (isCorrect) {
        reverseCorrect++;
        logTimbuk("react-recall CORRECT", `✓`);
      } else {
        logTimbuk("react-recall INCORRECT", `It was ${a.object}.`);
      }
    }

    logResult("Reverse recall score", `${reverseCorrect}/${assignments.length}`);
  }

  // ---- EXPANSION OFFER (Day 2) ----
  if (botState.dayCount === 1) {
    log(`\n${DIVIDER}`);
    log(`  ➕ EXPANSION OFFER`);
    log(DIVIDER);

    logTimbuk("expansion-offer", `${correctCount} out of ${assignments.length} — want to push it further? Two more stops.`);
    logUser("expansion-choice", "That's a win!");
    logSystem("→ Declined expansion");
  }

  // ---- WISDOM DROP ----
  const wisdoms = [
    "The stranger the image, the harder your brain works to file it. That is why it sticks.",
    "A clean palace is ready for anything. That is why we clear it each time.",
    "Walking it backwards uses a different part of your memory. That is the stretch.",
    "You are not memorizing. You are placing. There is a difference — and you just felt it.",
    "This works for anything. Grocery lists, names, numbers, appointments. You are building a skill for life.",
    "Names stick when you attach them to something you already know. That is the bridge.",
    "You have walked this palace seven times now. It is yours. No one can take it.",
  ];
  const wisdom = wisdoms[botState.dayCount % wisdoms.length];
  log(`\n${DIVIDER}`);
  log(`  💎 WISDOM DROP`);
  log(DIVIDER);
  logTimbuk("wisdom-drop", wisdom);

  // ---- PALACE WIPE (if cleaning enabled) ----
  if (hasCleaning) {
    log(`\n${DIVIDER}`);
    log(`  🌬️ PALACE WIPE`);
    log(DIVIDER);
    logTimbuk("palace-wipe", `${BOT_CONFIG.userName}, before we finish, we need to clear the palace...`);
  }

  // ---- GRADUATION (if perfect) ----
  if (correctCount === assignments.length) {
    log(`\n${DIVIDER}`);
    log(`  🎓 GRADUATION`);
    log(DIVIDER);
    if (botState.dayCount === 6) {
      logTimbuk("graduation-offer", `${BOT_CONFIG.userName}. Stop for a moment. Look what you did this week...`);
    } else {
      logTimbuk("graduation-offer", `${BOT_CONFIG.userName}, you got every single one right! Next time, we'll step up.`);
    }
  }

  // ---- FINAL ----
  log(`\n${DIVIDER}`);
  log(`  🏁 FINAL`);
  log(DIVIDER);

  const placeName = BOT_CONFIG.palaceName.toLowerCase().replace(/^my\s+/, "");
  if (correctCount === assignments.length) {
    logTimbuk("final", `${BOT_CONFIG.userName}, ${correctCount} out of ${assignments.length}. A perfect walk! Your palace at ${placeName} is yours now.`);
  } else if (correctCount >= assignments.length * 0.66) {
    logTimbuk("final", `${correctCount} out of ${assignments.length}, ${BOT_CONFIG.userName}! That is genuinely impressive.`);
  } else {
    logTimbuk("final", `${correctCount} out of ${assignments.length} -- and ${BOT_CONFIG.userName}, that is a real start.`);
  }

  logTimbuk("final", `I made you something while you were walking. Continue to see it.`);
  logSystem("🔔 COMPLETE SOUND");

  // ---- AMBLE SCROLL ----
  log(`\n${DIVIDER}`);
  log(`  📜 AMBLE SCROLL`);
  log(DIVIDER);

  const stopsWithScenes = assignments.map((a, i) => ({
    stopName: a.stopName,
    object: a.object,
    userScene: userScenes[i] || "",
  }));

  const scroll = await getScroll({
    userName: BOT_CONFIG.userName,
    palaceName: BOT_CONFIG.palaceName,
    dayNumber: dayNum,
    correctCount,
    totalItems: assignments.length,
    stops: stopsWithScenes,
  });

  logTimbuk("scroll", scroll);

  // ---- SUMMARY ----
  log(`\n${"=".repeat(60)}`);
  log(`  DAY ${dayNum} SUMMARY`);
  log(`  Score: ${correctCount}/${assignments.length} (${Math.round(correctCount / assignments.length * 100)}%)`);
  log(`  Items: ${assignments.map(a => a.object).join(", ")}`);
  log(`  Streak: ${botState.streak + 1}`);
  log(`${"=".repeat(60)}\n`);

  // Return updated state for next day
  return {
    currentDay: botState.currentDay + 1,
    dayCount: botState.dayCount + 1,
    currentLevel: correctCount === assignments.length
      ? Math.min(botState.currentLevel + 2, 12)
      : botState.currentLevel,
    currentCategory: lesson.category,
    lastPalaceName: BOT_CONFIG.palaceName,
    lastStops: sessionStops,
    lastAssignments: assignments,
    lastScore: correctCount,
    lastTotal: assignments.length,
    lastUserScenes: userScenes,
    streak: botState.streak + 1,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  verbose = args.includes("--verbose");

  let targetDay = 1;
  let startDay = 1;

  if (args.includes("--all")) {
    targetDay = 7;
  } else if (args.includes("--day")) {
    const dayIdx = args.indexOf("--day");
    targetDay = parseInt(args[dayIdx + 1]) || 1;
  }

  if (args.includes("--start")) {
    const startIdx = args.indexOf("--start");
    startDay = parseInt(args[startIdx + 1]) || 1;
    if (targetDay < startDay) targetDay = startDay;
  }

  log(`\n${"█".repeat(60)}`);
  log(`  MEMORYAMBLE TEST BOT`);
  log(`  User: ${BOT_CONFIG.userName}`);
  log(`  Running: Day ${startDay}${targetDay > startDay ? ` → Day ${targetDay}` : ""}`);
  log(`  Server: ${BASE_URL}`);
  log(`  Recall accuracy: ${BOT_CONFIG.recallAccuracy * 100}%`);
  log(`${"█".repeat(60)}`);

  // Check server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/assign-objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stops: ["test"], category: "objects" }),
    });
    if (!healthCheck.ok) throw new Error(`HTTP ${healthCheck.status}`);
    log(`\n  ✅ Server is running\n`);
  } catch (e: any) {
    log(`\n  ❌ Server not reachable at ${BASE_URL}`);
    log(`  Make sure the app is running first.`);
    log(`  Error: ${e.message}\n`);
    process.exit(1);
  }

  let state = createInitialState();

  // Fast-forward state if starting from a later day
  if (startDay > 1) {
    log(`\n  ⏩ Fast-forwarding state to Day ${startDay}...\n`);
    for (let d = 0; d < startDay - 1; d++) {
      const lesson = getLessonConfig(d);
      const stops = BOT_CONFIG.stops.slice(0, lesson.itemCount);
      const assignments = await getAssignments(stops, lesson.category, d);
      const score = Math.round(assignments.length * BOT_CONFIG.recallAccuracy);

      state = {
        currentDay: d + 2,
        dayCount: d + 1,
        currentLevel: Math.min(3 + d * 2, 12),
        currentCategory: lesson.category,
        lastPalaceName: BOT_CONFIG.palaceName,
        lastStops: stops,
        lastAssignments: assignments,
        lastScore: score,
        lastTotal: assignments.length,
        lastUserScenes: stops.map((_, i) => BOT_CONFIG.sceneTemplates[i % BOT_CONFIG.sceneTemplates.length]),
        streak: d + 1,
      };

      log(`  Day ${d + 1}: ${lesson.title} — ${score}/${assignments.length} (fast-forwarded)`);
    }
    log("");
  }

  // Run each day
  for (let d = (startDay - 1); d < targetDay; d++) {
    state.dayCount = d;
    state.currentDay = d + 1;
    state = await simulateDay(state);

    // Small delay between days to not hammer the API
    if (d < targetDay - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  log(`\n${"█".repeat(60)}`);
  log(`  TEST COMPLETE`);
  log(`  Days run: ${startDay} → ${targetDay}`);
  log(`  Final streak: ${state.streak}`);
  log(`${"█".repeat(60)}\n`);
}

main().catch(console.error);
