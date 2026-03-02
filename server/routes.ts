import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { generateAssociationsSchema } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
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

function pickRandomObjects(count: number): string[] {
  const shuffled = [...RANDOM_OBJECTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/generate-associations", async (req, res) => {
    try {
      const parsed = generateAssociationsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.errors });
      }

      const { placeName, placeDescription, stops } = parsed.data;
      const objects = pickRandomObjects(3);

      const prompt = `You are a warm, encouraging memory coach helping a senior citizen learn the Memory Palace technique. 

The person has chosen "${placeName}" as their memory palace${placeDescription ? ` (${placeDescription})` : ""}.

They have identified these 3 stops in their palace:
1. ${stops[0].name}${stops[0].description ? ` - ${stops[0].description}` : ""}
2. ${stops[1].name}${stops[1].description ? ` - ${stops[1].description}` : ""}
3. ${stops[2].name}${stops[2].description ? ` - ${stops[2].description}` : ""}

Create a vivid, bizarre, and FUNNY mental image for each stop, placing these objects:
- Stop 1 (${stops[0].name}): ${objects[0]}
- Stop 2 (${stops[1].name}): ${objects[1]}
- Stop 3 (${stops[2].name}): ${objects[2]}

For each association, write a vivid 2-3 sentence scene description that is:
- Absurd and exaggerated (the more bizarre, the more memorable!)
- Sensory-rich (include sounds, smells, textures, colors)
- Emotionally engaging (funny, surprising, delightful)
- Written in second person ("You walk into..." "You see...")

Respond in this exact JSON format:
[
  {
    "stopName": "${stops[0].name}",
    "object": "${objects[0]}",
    "scene": "Your vivid scene description here..."
  },
  {
    "stopName": "${stops[1].name}",
    "object": "${objects[1]}",
    "scene": "Your vivid scene description here..."
  },
  {
    "stopName": "${stops[2].name}",
    "object": "${objects[2]}",
    "scene": "Your vivid scene description here..."
  }
]

Only respond with the JSON array, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "[]";

      let associations;
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        associations = JSON.parse(cleaned);
      } catch {
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      res.json({ associations });
    } catch (error: any) {
      console.error("Error generating associations:", error);
      res.status(500).json({ error: "Failed to generate associations. Please try again." });
    }
  });

  return httpServer;
}
