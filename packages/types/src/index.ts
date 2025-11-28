import { z } from "zod";

// ============================================
// Project Types
// ============================================

export const projectStatusSchema = z.enum([
  "draft",
  "generating",
  "completed",
  "error",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  plot: z.string(),
  status: projectStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Project = z.infer<typeof projectSchema>;

// ============================================
// Character Types
// ============================================

export const characterStyleSchema = z.object({
  hairColor: z.string().optional(),
  hairStyle: z.string().optional(),
  eyeColor: z.string().optional(),
  clothingDescription: z.string().optional(),
  distinguishingFeatures: z.array(z.string()).optional(),
});
export type CharacterStyle = z.infer<typeof characterStyleSchema>;

export const characterSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string(),
  referenceImages: z.array(z.string().url()),
  styleConfig: characterStyleSchema,
});
export type Character = z.infer<typeof characterSchema>;

// ============================================
// Panel & Layout Types
// ============================================

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type Position = z.infer<typeof positionSchema>;

export const panelLayoutSchema = z.object({
  panelOrder: z.number(),
  position: positionSchema,
  sceneDescription: z.string().optional(),
});
export type PanelLayout = z.infer<typeof panelLayoutSchema>;

export const panelSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  panelOrder: z.number(),
  position: positionSchema,
  generatedImageUrl: z.string().url().nullable(),
  sceneDescription: z.string().optional(),
});
export type Panel = z.infer<typeof panelSchema>;

// ============================================
// Page Types
// ============================================

export const pageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  layoutData: z.array(panelLayoutSchema),
});
export type Page = z.infer<typeof pageSchema>;

// ============================================
// Speech Bubble Types
// ============================================

export const bubbleTypeSchema = z.enum([
  "normal",
  "shout",
  "thought",
  "narration",
  "whisper",
]);
export type BubbleType = z.infer<typeof bubbleTypeSchema>;

export const tailDirectionSchema = z.enum([
  "left",
  "right",
  "top",
  "bottom",
  "none",
]);
export type TailDirection = z.infer<typeof tailDirectionSchema>;

export const bubbleStyleSchema = z.object({
  fontSize: z.number().positive().optional(),
  fontFamily: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  padding: z.number().optional(),
});
export type BubbleStyle = z.infer<typeof bubbleStyleSchema>;

export const speechBubbleSchema = z.object({
  id: z.string().uuid(),
  panelId: z.string().uuid(),
  type: bubbleTypeSchema,
  text: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  tailDirection: tailDirectionSchema,
  style: bubbleStyleSchema.optional(),
});
export type SpeechBubble = z.infer<typeof speechBubbleSchema>;

// ============================================
// Scene Types (AI Analysis Output)
// ============================================

export const emotionSchema = z.enum([
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "scared",
  "thoughtful",
  "determined",
]);
export type Emotion = z.infer<typeof emotionSchema>;

export const dialogueSchema = z.object({
  characterName: z.string(),
  text: z.string(),
  emotion: emotionSchema,
  bubbleType: bubbleTypeSchema,
});
export type Dialogue = z.infer<typeof dialogueSchema>;

export const sceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  description: z.string(),
  setting: z.string(),
  characters: z.array(z.string()),
  dialogues: z.array(dialogueSchema),
  narration: z.string().optional(),
  visualNotes: z.string().optional(),
  suggestedPanelCount: z.number().int().positive().optional(),
});
export type Scene = z.infer<typeof sceneSchema>;

export const storyAnalysisResultSchema = z.object({
  title: z.string(),
  totalScenes: z.number().int().positive(),
  scenes: z.array(sceneSchema),
  characters: z.array(z.string()),
  estimatedPages: z.number().int().positive(),
});
export type StoryAnalysisResult = z.infer<typeof storyAnalysisResultSchema>;

// ============================================
// API Request/Response Types
// ============================================

export const createProjectRequestSchema = z.object({
  title: z.string().min(1).max(200),
  plot: z.string().min(1),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

export const generateMangaRequestSchema = z.object({
  projectId: z.string().uuid(),
  pageCount: z.number().int().positive().optional(),
  style: z.string().optional(),
});
export type GenerateMangaRequest = z.infer<typeof generateMangaRequestSchema>;

export const generationStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: projectStatusSchema,
  progress: z.number().min(0).max(100),
  currentStep: z.string().optional(),
  error: z.string().optional(),
});
export type GenerationStatus = z.infer<typeof generationStatusSchema>;

// ============================================
// Image Generation Types
// ============================================

export const imageGenerationRequestSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  referenceImages: z.array(z.string().url()).optional(),
  style: z.string().optional(),
});
export type ImageGenerationRequest = z.infer<
  typeof imageGenerationRequestSchema
>;

export const imageGenerationResultSchema = z.object({
  imageUrl: z.string().url(),
  seed: z.number().optional(),
  revisedPrompt: z.string().optional(),
});
export type ImageGenerationResult = z.infer<typeof imageGenerationResultSchema>;
