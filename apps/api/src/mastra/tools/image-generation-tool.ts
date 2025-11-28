import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const mangaStyleSchema = z.enum([
  "shonen", // 少年マンガスタイル
  "shoujo", // 少女マンガスタイル
  "seinen", // 青年マンガスタイル
  "classic", // クラシックな手描き風
]);

export const imageGenerationResultSchema = z.object({
  imageUrl: z.string(),
  imageBase64: z.string().optional(),
  width: z.number(),
  height: z.number(),
  prompt: z.string(),
  revisedPrompt: z.string().optional(),
});

export const imageGenerationTool = createTool({
  id: "image-generation",
  description:
    "コマの画像を生成します。白黒マンガスタイルで、キャラクターの一貫性を維持しながら画像を生成します。",
  inputSchema: z.object({
    sceneDescription: z.string().describe("シーンの説明（英語推奨）"),
    characters: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          referenceImageUrl: z.string().optional(),
        })
      )
      .optional(),
    style: mangaStyleSchema.default("shonen"),
    width: z.number().default(512),
    height: z.number().default(768),
    negativePrompt: z.string().optional(),
  }),
  outputSchema: imageGenerationResultSchema,
  execute: async ({ context, writer, mastra }) => {
    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "in-progress",
        message: "画像を生成中...",
        stage: "preparing",
      },
    });

    const { sceneDescription, characters, style, width, height, negativePrompt } =
      context;

    // Build the prompt for manga-style image generation
    const stylePrompts: Record<string, string> = {
      shonen:
        "manga style, black and white, screentone shading, dynamic action lines, bold linework",
      shoujo:
        "shoujo manga style, black and white, delicate linework, sparkles, soft shading, detailed eyes",
      seinen:
        "seinen manga style, black and white, detailed realistic style, heavy inking, mature themes",
      classic:
        "classic manga style, black and white, hand-drawn look, traditional screentones, vintage feel",
    };

    const characterDescriptions = characters
      ?.map((c) => `${c.name}: ${c.description}`)
      .join("; ");

    const fullPrompt = [
      stylePrompts[style],
      sceneDescription,
      characterDescriptions ? `Characters: ${characterDescriptions}` : "",
      "high quality, professional manga panel, clean lines",
    ]
      .filter(Boolean)
      .join(", ");

    const defaultNegative =
      "color, colored, realistic photo, 3d render, watermark, signature, blurry, low quality";
    const finalNegativePrompt = negativePrompt
      ? `${defaultNegative}, ${negativePrompt}`
      : defaultNegative;

    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "in-progress",
        message: "Bedrockで画像生成中...",
        stage: "generating",
      },
    });

    // Note: Actual Bedrock Nova Canvas implementation would go here
    // For now, return a placeholder result
    // In production, this would call Amazon Bedrock's Nova Canvas model

    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "completed",
        message: "画像生成完了",
        stage: "done",
      },
    });

    return {
      imageUrl: "", // Would be S3 URL in production
      width,
      height,
      prompt: fullPrompt,
      revisedPrompt: fullPrompt,
    };
  },
});
