import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "./db";
import { palaces, userProgress, sessionHistory } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated, verifyAuth } from "./auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RANDOM_OBJECTS = [
  "guitar", "violin", "trombone", "accordion", "ladder", "ironing board",
  "wheelbarrow", "birdbath", "garden gnome", "park bench", "mailbox", "fire hydrant",
  "traffic cone", "watermelon", "wedding cake", "pineapple", "lobster", "gingerbread house",
  "rocking horse", "grandfather clock", "typewriter", "jukebox", "telephone booth", "globe",
  "gramophone", "bowling ball", "trophy", "dartboard", "sunflower", "cactus",
  "beehive", "fishing rod", "anchor", "canoe", "surfboard",
  "penguin", "flamingo", "tortoise", "parrot", "goldfish", "swan", "peacock",
  "telescope", "compass", "lantern", "weathervane", "top hat", "monocle",
  "crown", "scepter", "disco ball", "pinball machine", "parachute", "hot air balloon"
];

const RESTRICTED_ANIMALS = new Set(["penguin", "flamingo", "tortoise", "parrot", "goldfish", "swan", "peacock"]);

const PRACTICAL_ITEMS = [
  "milk", "bread", "eggs", "call the doctor", "pick up prescription",
  "water the plants", "pay the bills", "call Sarah", "dentist appointment",
  "buy birthday card", "return library books", "take vitamins",
];

const RANDOM_NAMES = [
  "Margaret",
  "Frederick",
  "Dorothy",
  "Winston",
  "Beatrice",
  "Theodore",
  "Gladys",
  "Reginald",
  "Florence",
  "Archibald",
  "Penelope",
  "Barnaby",
  "Constance",
  "Humphrey",
  "Millicent",
  "Leopold",
  "Cordelia",
  "Percival",
  "Harriet",
  "Montague",
];

function pickRandom(list: string[], count: number): string[] {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  const result: string[] = [];
  let animalCount = 0;

  const categories: Record<string, string> = {
    "penguin": "animal", "flamingo": "animal", "tortoise": "animal",
    "parrot": "animal", "goldfish": "animal", "swan": "animal", "peacock": "animal",
    "birdbath": "garden", "garden gnome": "garden", "beehive": "garden",
    "sunflower": "garden", "cactus": "garden", "weathervane": "garden",
    "fishing rod": "outdoor", "anchor": "outdoor", "canoe": "outdoor",
    "surfboard": "outdoor", "parachute": "outdoor", "hot air balloon": "outdoor",
    "guitar": "music", "violin": "music", "trombone": "music", "accordion": "music",
    "gramophone": "music", "jukebox": "music",
    "telescope": "study", "compass": "study", "globe": "study",
    "typewriter": "study", "monocle": "study",
    "trophy": "game", "dartboard": "game", "bowling ball": "game",
    "disco ball": "game", "pinball machine": "game",
  };

  const usedCategories = new Set<string>();

  for (const item of shuffled) {
    if (result.length >= count) break;

    const cat = categories[item] || "misc";

    if (RESTRICTED_ANIMALS.has(item)) {
      if (animalCount >= 1) continue;
      animalCount++;
    }

    if (cat !== "misc" && usedCategories.has(cat) && result.length < count) {
      const remaining = shuffled.filter(i => !result.includes(i));
      const hasAlternative = remaining.some(i => (categories[i] || "misc") !== cat);
      if (hasAlternative) continue;
    }

    result.push(item);
    if (cat !== "misc") usedCategories.add(cat);
  }

  if (result.length < count) {
    for (const item of shuffled) {
      if (result.length >= count) break;
      if (!result.includes(item)) result.push(item);
    }
  }

  return result;
}

const assignItemsSchema = z.object({
  stops: z.array(z.string()).min(1).max(10),
  category: z.enum(["objects", "names", "practical"]).default("objects"),
});

const sessionOpenerSchema = z.object({
  userName: z.string(),
  currentDay: z.number(),
  yesterdayScore: z.number(),
  yesterdayTotal: z.number(),
  yesterdayAssignments: z.array(z.object({
    stopName: z.string(),
    object: z.string(),
    userAssociation: z.string().optional().default(""),
  })),
  placeName: z.string(),
});

const generateScrollSchema = z.object({
  userName: z.string(),
  palaceName: z.string(),
  dayNumber: z.number(),
  correctCount: z.number(),
  totalItems: z.number(),
  stops: z.array(z.object({
    stopName: z.string(),
    object: z.string(),
    userScene: z.string(),
  })),
});

const sparkSchema = z.object({
  object: z.string(),
  stopName: z.string(),
  placeName: z.string(),
});

const smartConfirmSchema = z.object({
  userName: z.string(),
  objectName: z.string().optional().default(""),
  userAssociation: z.string(),
  originalScene: z.string().optional().default(""),
  stopName: z.string().optional().default(""),
  context: z.enum(["object-placement", "stop-confirmation", "stop-transition", "stop-display", "place-confirmation", "recall-confirmation"]).default("object-placement"),
});

const savePalaceSchema = z.object({
  locations: z.array(z.object({
    locationName: z.string(),
    position: z.number(),
  })),
});

const saveProgressSchema = z.object({
  currentDay: z.number().min(1),
  currentLevel: z.number().min(3).max(9),
  currentCategory: z.enum(["objects", "names"]),
  dayCount: z.number().min(0),
});

const saveSessionSchema = z.object({
  date: z.string(),
  level: z.number(),
  category: z.string(),
  score: z.number(),
  totalItems: z.number(),
  assignments: z.array(z.object({ stopName: z.string(), object: z.string() })),
  placeName: z.string(),
  stops: z.array(z.string()),
  userScenes: z.array(z.string()).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/assign-objects", verifyAuth, async (req: any, res) => {
    const parsed = assignItemsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { stops, category } = parsed.data;
    const basePool = category === "names" ? RANDOM_NAMES : category === "practical" ? PRACTICAL_ITEMS : RANDOM_OBJECTS;
    let pool = [...basePool];

    // If user is authenticated, exclude objects from their last 3 sessions
    if (req.user?.id) {
      try {
        const userId = req.user.id;
        const recentSessions = await db
          .select()
          .from(sessionHistory)
          .where(eq(sessionHistory.userId, userId))
          .orderBy(desc(sessionHistory.id))
          .limit(3);

        const usedObjects = new Set<string>();
        recentSessions.forEach((session) => {
          const assignments = JSON.parse(session.assignmentsJson);
          assignments.forEach((a: any) => {
            usedObjects.add(a.object);
          });
        });

        // Filter pool to exclude used objects
        pool = pool.filter((obj) => !usedObjects.has(obj));

        // If we filtered out too many, fall back to full pool
        if (pool.length < stops.length) {
          pool = [...basePool];
        }
      } catch (error) {
        console.error("Error excluding previous objects:", error);
        // Fall back to full pool on error
        pool = [...basePool];
      }
    }

    const items = pickRandom(pool, stops.length);
    const assignments = stops.map((stop, i) => ({
      stopName: stop,
      object: items[i],
    }));

    res.json({ assignments });
  });

  app.post("/api/format-stops", async (req, res) => {
    try {
      const { stops, placeName } = req.body as { stops: string[]; placeName: string };
      if (!Array.isArray(stops) || stops.length === 0) {
        return res.status(400).json({ error: "stops must be a non-empty array" });
      }
      const openai = (await import("openai")).default;
      const client = new openai();
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a grammar assistant. Given a list of memory palace stop names, return a JSON array of strings where each stop is naturally phrased for mid-sentence use. Rules: if stop starts with our/my → keep as-is. If stop starts with where/when/the place/the spot → use as-is without adding any article. Otherwise prepend your. Return ONLY valid JSON array, nothing else.`,
          },
          {
            role: "user",
            content: `Stop names: ${JSON.stringify(stops)}. Return the formatted JSON array now.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });
      const raw = completion.choices[0]?.message?.content?.trim() || "[]";
      const formatted = JSON.parse(raw);
      res.json({ formatted });
    } catch (err) {
      console.error("format-stops error:", err);
      res.status(500).json({ error: "Failed to format stops" });
    }
  });

  app.post("/api/spark", async (req, res) => {
    try {
      const parsed = sparkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { object, stopName, placeName } = parsed.data;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a warm memory coach. The user is trying to remember what they placed at a location. Give a short sensory nudge (10 words max) that hints at the feeling or action without naming the object directly. For example if the object is accordion say something like: think music... something you squeeze... it makes a sound. Never say the object name.`,
          },
          {
            role: "user",
            content: `The object is: ${object}. The location is: ${stopName} in ${placeName}. Give the hint now.`,
          },
        ],
        temperature: 1.0,
        max_tokens: 40,
      });

      const spark = response.choices[0]?.message?.content?.trim() || "";
      res.json({ spark });
    } catch (error: any) {
      console.error("Error generating spark:", error);
      res.status(500).json({ error: "Could not generate a hint right now." });
    }
  });

  function cleanPlaceNameForStorage(input: string): string {
    let s = input.trim().toLowerCase();
    
    if (s.startsWith('my ')) {
      s = 'your ' + s.slice(3);
    }
    
    s = s.charAt(0).toUpperCase() + s.slice(1);
    
    s = s.replace(/\b(in|near|at|on)\s+([\w]+)(\s+([\w]+))?/g, 
      (match, prep, word1, space, word2) => {
        const cap1 = word1.charAt(0).toUpperCase() + word1.slice(1);
        const result = `${prep} ${cap1}`;
        if (word2) {
          const cap2 = word2.charAt(0).toUpperCase() + word2.slice(1);
          return result + ` ${cap2}`;
        }
        return result;
      }
    );
    
    return s;
  }

  app.post("/api/session-opener", async (req, res) => {
    try {
      const parsed = sessionOpenerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { userName, currentDay, yesterdayScore, yesterdayTotal, yesterdayAssignments, placeName } = parsed.data;

      const assignmentLines = yesterdayAssignments
        .map(a => `- ${a.object} at ${a.stopName}${a.userAssociation ? ` (they imagined: ${a.userAssociation})` : ""}`)
        .join("\n");

      const systemPrompt = `You are Timbuk, a warm wise memory coach. Write a single sentence greeting for a returning user — maximum 15 words. Reference ONE specific thing from their previous session — a stop name, an object, or their personal association. Make it feel like you genuinely remember them. Be warm, slightly playful, specific. Never generic. Examples: Yesterday you had Jimi Hendrix at your front door — I wonder if he is still there. That pineapple luau from last time — your front door has never been the same. Do not use the words brilliant, perfect, wonderful, lovely.`;

      const userMessage = `${userName} is returning for Day ${currentDay}. Yesterday they scored ${yesterdayScore} out of ${yesterdayTotal} at ${placeName}. Previous session placements:\n${assignmentLines}\n\nWrite their personalised greeting now.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 1.1,
        max_tokens: 60,
      });

      const greeting = response.choices[0]?.message?.content?.trim() || "";
      res.json({ greeting });
    } catch (error) {
      console.error("Error generating session opener:", error);
      res.status(500).json({ error: "Could not generate greeting." });
    }
  });

  app.post("/api/generate-scroll", async (req, res) => {
    const parsed = generateScrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { userName, palaceName, dayNumber, correctCount, totalItems, stops } = parsed.data;

    function sanitizeScene(scene: string): string {
      let s = scene;
      s = s.replace(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g, "a family member");
      s = s.replace(/\b\d+\s+(Street|Ave|Avenue|Road|Drive|Lane|Blvd|Boulevard)\b/gi, "a nearby location");
      return s;
    }

    const sanitizedStops = stops.map(stop => ({
      stopName: stop.stopName,
      object: stop.object,
      userScene: sanitizeScene(stop.userScene),
    }));

    const fallback = `${userName} walked through ${palaceName} today and found the most extraordinary things waiting at every turn. Timbuk was not even slightly surprised — he has always suspected this particular mind works in remarkable ways.`;

    try {
      const systemPrompt = `You are Timbuk — a warm, wise, slightly arch memory coach. Your written voice is that of a distinguished naturalist filing field notes. Dry. Specific. Occasionally allowing one quiet aside. You have warmth but you underplay it.

Here is an example of your scroll voice — study it carefully:

"As [userName] moved through My Kitchen, a canoe lay at the front door — [userName]'s husband was fishing, undeterred by the complete absence of water. Near the spot where [userName]'s children threw their bags, a parrot had established itself on Jimmy Buffett's shoulder and showed no intention of leaving. In the corner where [userName]'s husband left his belongings, a dartboard waited with the patience of something that has waited before. Timbuk noted all three recalled. He was not surprised."

Write in exactly that register. Short sentences. Specific details. One quiet Timbuk aside at the end referencing himself in third person.

RULES:
- Exactly 3-4 sentences.
- Third person only — "Jane" not "you"
- Use ONLY the provided stop names, objects, and scenes. No invented details.
- Never open with the user's name or "In the"
- Never use gendered pronouns (her, his, she, he). Always use the user's name possessively instead — "Jane's husband", "Jane's kitchen", "Jane's children". This applies throughout the entire scroll.
- Never use: brilliant, perfect, wonderful, lovely, amazing, fantastic, delightful, charming, ethereal, embrace, realm, alignment, domesticity, intrigued, amusingly, displayed, focused intently
- The closing line is always Timbuk observing — never a compliment to the user directly`;

      const userMessage = `Write an Amble Scroll for ${userName} who walked through ${palaceName} on Day ${dayNumber} and remembered ${correctCount} out of ${totalItems} items. Here are the stops: ${JSON.stringify(sanitizedStops)}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 1.1,
        max_tokens: 200,
      });

      const scroll = response.choices[0]?.message?.content?.trim() || fallback;
      res.json({ scroll });
    } catch (error) {
      console.error("Error generating scroll:", error);
      res.json({ scroll: fallback });
    }
  });

  app.post("/api/smart-confirm", async (req, res) => {
    try {
      const parsed = smartConfirmSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { userName, objectName, userAssociation, originalScene, stopName, context } = parsed.data;

      const isStopConfirmation = context === "stop-confirmation";
      const isPlaceConfirmation = context === "place-confirmation";

      const genericPrompt = `You are Timbuk, a warm sharp memory coach. The user just said something about their memory palace. Respond in under 12 words. Do not repeat their words. Make one specific sharp observation about what their words reveal about them as a person — their personality, their history, their character. Be unexpected. Never use these words: cherished, warmth, nostalgia, pride, memories, personal, lovely, brilliant, perfect, wonderful. If the input has a typo, understand what they meant and respond to the intent not the typo. Examples: my house in brooklyn → Brooklyn shaped you. That palace runs deep. my door had a yankees logo → That door already knew what mattered most. my mom kept keys in a dish → Every house has one spot that holds everything together. Always convert first-person possessives to second-person when referencing anything the user named or described. Convert: our → your, my → your, we → you, us → you. Never echo the user's exact words back with first-person possessives intact.`;

      let systemPrompt = "";
      let userMessage = "";

      if (isPlaceConfirmation) {
        systemPrompt = genericPrompt;
        userMessage = `${userName} chose their palace location: "${userAssociation}". Respond now.`;
      } else if (isStopConfirmation) {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just named a stop in their memory palace. Respond in 5 words or fewer. Be warm. Sound like a friend. Never analyze what their choice means or reveals about them. Never comment on the emotional significance. Just acknowledge it simply and move on. Examples: front door → Perfect. Right where it all begins. key bowl → Good. Right by the door. where our dog eats → That one is unforgettable. kitchen → Central command. hat rack → Something you pass every day. Never use: reveals, suggests, symbolizes, reflects, anchors, signifies, meaningful, handy, love, warmth, cherished, cozy, practical, playful, spirit, belonging. Always convert first-person possessives to second-person when referencing anything the user named or described. Convert: our → your, my → your, we → you, us → you. Never echo the user's exact words back with first-person possessives intact.`;
        userMessage = `${userName} named their stop: "${userAssociation}". Respond now.`;
      } else if (context === "stop-transition") {
        systemPrompt = `You are Timbuk, a warm memory coach walking with the user through their memory palace. The user named a stop. Work it naturally into a short walking acknowledgment of 6 words or fewer. Fix any typos or awkward phrasing naturally without drawing attention to them. Never prepend your or the blindly — use whatever sounds natural for the stop name. Examples: front door → Past your front door. where our kids put their boots → Past the boot spot. were kids put boos → Past the kids boot spot. kitchen → Past the kitchen. Never use: reveals, suggests, symbolizes, reflects, brilliant, wonderful, lovely. Always convert first-person possessives to second-person when referencing anything the user named or described. Convert: our → your, my → your, we → you, us → you. Never echo the user's exact words back with first-person possessives intact.`;
        userMessage = `${userName} named their stop: "${userAssociation}". Respond now.`;
      } else if (context === "stop-display") {
        systemPrompt = `You are a grammar assistant. Given a stop name from a memory palace, return ONLY the natural way to reference it mid-sentence — with correct article. Examples: front door → your front door. our weird red door → our weird red door. where kids put boots → the spot where the kids put their boots. where my husband throws his jacket → where your husband throws his jacket. Return only the phrase, nothing else, no punctuation.`;
        userMessage = `Stop name: "${userAssociation}". Return the natural mid-sentence reference now.`;
      } else if (context === "recall-confirmation") {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just recalled what they placed at a stop. You know the vivid scene they originally created. Respond in 8 words or fewer. React to the specific image they described. Sound like a real person who just heard something vivid and unexpected. Short, warm, specific. Never generic. Never philosophical. Never analyze what their choice reveals about them. Never use these words: reveals, suggests, symbolizes, reflects, anchors, playful, spirit, belonging, meaning, brilliant, perfect, wonderful, lovely, fantastic, amazing, great job, nailed it, impressive, delightful, charming, whimsical, intriguing.`;
        userMessage = `The object was: ${objectName}. Their original scene was: ${originalScene}. They recalled: ${userAssociation} at ${stopName}. Respond now.`;
      } else if (context === "object-placement") {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just described their vivid scene for a memory palace object. Respond in under 12 words. React to the specific image they described. Sound like a real person who just heard something vivid and unexpected. Short, warm, specific. Never generic. Never say make it stranger. Never push back on their association. If the object is a person's name, respond to how the user pictured meeting that person — reference their physical description or action, not an object. Keep it warm and specific. Never use: reveals, suggests, symbolizes, reflects, brilliant, perfect, wonderful, lovely, charming, fantastic, amazing, great job, nailed it, impressive, delightful, whimsical, intriguing. Always convert first-person possessives to second-person when referencing anything the user named or described. Convert: our → your, my → your, we → you, us → you. Never echo the user's exact words back with first-person possessives intact.`;
        userMessage = `${userName} placed a ${objectName} at their ${stopName} and described it as: "${userAssociation}". Respond now.`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 1.1,
        max_tokens: 50,
      });

      const confirmation = response.choices[0]?.message?.content?.trim() || "";
      
      if (isPlaceConfirmation) {
        const cleanedInput = cleanPlaceNameForStorage(userAssociation);
        res.json({ response: confirmation, cleanedInput });
      } else {
        res.json({ confirmation });
      }
    } catch (error: any) {
      console.error("Error generating smart confirmation:", error);
      res.status(500).json({ error: "Could not generate confirmation." });
    }
  });

  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
      if (!progress) {
        return res.json({
          currentDay: 1,
          currentLevel: 3,
          currentCategory: "objects",
          dayCount: 0,
          streak: 0,
          lastLogin: null,
          subscriptionStatus: "inactive",
        });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = saveProgressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { currentDay, currentLevel, currentCategory, dayCount } = parsed.data;

      const now = new Date();
      const [existing] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));

      if (existing) {
        const lastLogin = existing.lastLogin;
        let streak = existing.streak;
        if (lastLogin) {
          const lastDate = new Date(lastLogin).toISOString().slice(0, 10);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().slice(0, 10);
          if (lastDate === yesterdayStr) {
            streak += 1;
          } else if (lastDate !== now.toISOString().slice(0, 10)) {
            streak = 1;
          }
        } else {
          streak = 1;
        }

        const [updated] = await db
          .update(userProgress)
          .set({ currentDay, currentLevel, currentCategory, dayCount, streak, lastLogin: now })
          .where(eq(userProgress.userId, userId))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db
          .insert(userProgress)
          .values({ userId, currentDay, currentLevel, currentCategory, dayCount, streak: 1, lastLogin: now })
          .returning();
        res.json(created);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });

  app.get("/api/palaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const locations = await db
        .select()
        .from(palaces)
        .where(eq(palaces.userId, userId))
        .orderBy(palaces.position);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching palaces:", error);
      res.status(500).json({ error: "Failed to fetch palaces" });
    }
  });

  app.post("/api/palaces", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = savePalaceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      await db.delete(palaces).where(eq(palaces.userId, userId));

      const rows = parsed.data.locations.map((loc) => ({
        userId,
        locationName: loc.locationName,
        position: loc.position,
      }));

      if (rows.length > 0) {
        await db.insert(palaces).values(rows);
      }

      const saved = await db
        .select()
        .from(palaces)
        .where(eq(palaces.userId, userId))
        .orderBy(palaces.position);

      res.json(saved);
    } catch (error) {
      console.error("Error saving palaces:", error);
      res.status(500).json({ error: "Failed to save palaces" });
    }
  });

  app.get("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const rows = await db
        .select()
        .from(sessionHistory)
        .where(eq(sessionHistory.userId, userId))
        .orderBy(desc(sessionHistory.id));
      const parsed = rows.map((r) => ({
        ...r,
        assignments: JSON.parse(r.assignmentsJson),
        stops: JSON.parse(r.stopsJson),
      }));
      res.json(parsed);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/latest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [row] = await db
        .select()
        .from(sessionHistory)
        .where(eq(sessionHistory.userId, userId))
        .orderBy(desc(sessionHistory.id))
        .limit(1);

      if (!row) {
        return res.json(null);
      }

      res.json({
        ...row,
        assignments: JSON.parse(row.assignmentsJson),
        stops: JSON.parse(row.stopsJson),
      });
    } catch (error) {
      console.error("Error fetching latest session:", error);
      res.status(500).json({ error: "Failed to fetch latest session" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = saveSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { date, level, category, score, totalItems, assignments, placeName, stops, userScenes } = parsed.data;

      const [created] = await db
        .insert(sessionHistory)
        .values({
          userId,
          date,
          level,
          category,
          score,
          totalItems,
          assignmentsJson: JSON.stringify(assignments),
          placeName,
          stopsJson: JSON.stringify(stops),
          userScenesJson: JSON.stringify(userScenes || []),
        })
        .returning();

      res.json({
        ...created,
        assignments,
        stops,
      });
    } catch (error) {
      console.error("Error saving session:", error);
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  app.post("/api/user/current-day", isAuthenticated, async (req: any, res) => {
    try {
      const { currentDay } = req.body;
      if (!currentDay || typeof currentDay !== "number") {
        return res.status(400).json({ error: "Invalid currentDay" });
      }
      const userId = req.user.id;
      
      await db
        .update(userProgress)
        .set({ currentDay })
        .where(eq(userProgress.userId, userId));
      
      res.json({ success: true, currentDay });
    } catch (error) {
      console.error("Error saving current day:", error);
      res.status(500).json({ error: "Failed to save current day" });
    }
  });

  app.get("/api/user/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
      });
      
      if (!progress) {
        return res.json({
          currentDay: 1,
          currentLevel: 3,
          currentCategory: "objects",
          dayCount: 0,
          streak: 0,
          lastLogin: null,
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { email } = req.body;
      const origin = `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: "price_1TBgLTHJdGxZBU1hSpwIVY80", quantity: 1 }],
        mode: "subscription",
        customer_email: email || undefined,
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId },
        },
        success_url: `${origin}/amble?session=success`,
        cancel_url: `${origin}/amble`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/webhook", async (req: any, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (event.type === "customer.subscription.created") {
      if (userId) {
        try {
          await db
            .update(userProgress)
            .set({ subscriptionStatus: "active" })
            .where(eq(userProgress.userId, userId));
        } catch (e) {
          console.error("Failed to activate subscription:", e);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      if (userId) {
        try {
          await db
            .update(userProgress)
            .set({ subscriptionStatus: "inactive" })
            .where(eq(userProgress.userId, userId));
        } catch (e) {
          console.error("Failed to deactivate subscription:", e);
        }
      }
    }

    res.json({ received: true });
  });

  return httpServer;
}
