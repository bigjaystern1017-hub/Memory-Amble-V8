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
  
  for (const item of shuffled) {
    if (result.length >= count) break;
    
    if (RESTRICTED_ANIMALS.has(item)) {
      // This is a restricted animal
      if (animalCount === 0) {
        result.push(item);
        animalCount++;
      }
      // Otherwise skip it since we already have an animal
    } else {
      // Not a restricted animal, always add it
      result.push(item);
    }
  }
  
  return result;
}

const assignItemsSchema = z.object({
  stops: z.array(z.string()).min(1).max(10),
  category: z.enum(["objects", "names", "practical"]).default("objects"),
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
  stopName: z.string().optional().default(""),
  context: z.enum(["object-placement", "stop-confirmation", "place-confirmation"]).default("object-placement"),
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

  app.post("/api/smart-confirm", async (req, res) => {
    try {
      const parsed = smartConfirmSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { userName, objectName, userAssociation, stopName, context } = parsed.data;

      const isStopConfirmation = context === "stop-confirmation";
      const isPlaceConfirmation = context === "place-confirmation";

      let systemPrompt = "";
      let userMessage = "";

      if (isPlaceConfirmation) {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just named the place for their memory palace. It might be a specific location with personal detail. Respond in 15 words or less, warmly acknowledging what makes it specific. If they mentioned a city, neighborhood, or personal detail — reference it.`;
        userMessage = `${userName} chose their palace location: "${userAssociation}". Respond now.`;
      } else if (isStopConfirmation) {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just named a stop in their memory palace. They may have included personal detail or description. Respond in 15 words or less, warmly acknowledging what makes their stop specific and personal. If they gave extra detail like a color, a person, or a memory — reference it. If it is a plain noun with no detail, give a warm generic confirmation. Never say brilliant or perfect.`;
        userMessage = `${userName} named their stop: "${userAssociation}". Respond now.`;
      } else {
        systemPrompt = `You are Timbuk, a warm memory coach. The user just described their vivid association for a memory palace object. Respond in 15 words or less. Be specific to what they said — reference their actual association, not just the object. If their association is creative or funny, lean into it. Sound warm and delighted, not generic.`;
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
      res.json({ confirmation });
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

      const { date, level, category, score, totalItems, assignments, placeName, stops } = parsed.data;

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
