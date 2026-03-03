import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { z } from "zod";

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
  stops: z.array(z.string()).min(3).max(9),
  category: z.enum(["objects", "names"]).default("objects"),
});

const sparkSchema = z.object({
  object: z.string(),
  stopName: z.string(),
  placeName: z.string(),
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

  return httpServer;
}
