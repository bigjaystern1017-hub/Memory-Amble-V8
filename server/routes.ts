import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "./db";
import { palaces, userProgress, sessionHistory } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RANDOM_OBJECTS = [
  "a giant rubber duck",
  "a flaming guitar",
  "a dancing penguin",
  "a golden telephone",
  "a purple elephant",
  "a singing cactus",
  "a flying pizza",
  "a glowing jellyfish",
  "a tiny dinosaur",
  "a rainbow umbrella",
  "a chocolate fountain",
  "a neon flamingo",
  "a crystal ball",
  "a roller-skating cat",
  "a bubble-blowing fish",
  "a velvet top hat",
  "a sparkling diamond shoe",
  "a giant magnifying glass",
  "a trumpeting rooster",
  "a floating teapot",
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
  return shuffled.slice(0, count);
}

const assignItemsSchema = z.object({
  stops: z.array(z.string()).min(1).max(10),
  category: z.enum(["objects", "names"]).default("objects"),
});

const sparkSchema = z.object({
  object: z.string(),
  stopName: z.string(),
  placeName: z.string(),
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

  app.post("/api/assign-objects", (req, res) => {
    const parsed = assignItemsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const { stops, category } = parsed.data;
    const pool = category === "names" ? RANDOM_NAMES : RANDOM_OBJECTS;
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

      const prompt = `You are a warm memory coach. Give ONE short, vivid, funny sentence (15 words max) to help someone visualize "${object}" at "${stopName}" in "${placeName}". Be absurd and sensory. Just the sentence, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.0,
        max_tokens: 60,
      });

      const spark = response.choices[0]?.message?.content?.trim() || "";
      res.json({ spark });
    } catch (error: any) {
      console.error("Error generating spark:", error);
      res.status(500).json({ error: "Could not generate a hint right now." });
    }
  });

  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
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
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  return httpServer;
}
