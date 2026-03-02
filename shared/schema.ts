import { z } from "zod";

export const palaceStopSchema = z.object({
  name: z.string().min(1, "Please name this stop"),
  description: z.string().optional(),
});

export const palaceSetupSchema = z.object({
  placeName: z.string().min(1, "Please name your place"),
  placeDescription: z.string().optional(),
  stops: z.array(palaceStopSchema).length(3, "Please add exactly 3 stops"),
});

export const associationSchema = z.object({
  stopName: z.string(),
  object: z.string(),
  scene: z.string(),
});

export const generateAssociationsSchema = z.object({
  placeName: z.string(),
  placeDescription: z.string().optional(),
  stops: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })),
});

export type PalaceStop = z.infer<typeof palaceStopSchema>;
export type PalaceSetup = z.infer<typeof palaceSetupSchema>;
export type Association = z.infer<typeof associationSchema>;
export type GenerateAssociationsRequest = z.infer<typeof generateAssociationsSchema>;

export interface WalkthroughAnswer {
  stopName: z.infer<typeof palaceStopSchema>["name"];
  userAnswer: string;
  correctObject: string;
  isCorrect: boolean;
}
