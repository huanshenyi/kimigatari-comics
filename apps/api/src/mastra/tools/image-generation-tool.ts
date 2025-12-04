import { createTool } from "@mastra/core/tools";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { createStorageClient } from "@kimigatari/storage";
import { AISpanType } from "@mastra/core/ai-tracing";

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
  execute: async ({ context, writer, tracingContext }) => {
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
        message: "Geminiで画像生成中...",
        stage: "generating",
      },
    });

    // Generate image using Gemini gemini-2.5-flash-image
    const result = await generateText({
      model: google("gemini-2.5-flash-image"),
      prompt: `Generate a manga panel image with the following specifications:

Style: ${fullPrompt}

Important guidelines:
- Create a black and white manga-style illustration
- Avoid: ${finalNegativePrompt}
- Output dimensions should be suitable for a manga panel`,
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
    });

    // Extract generated image from result
    let imageBase64: string | undefined;
    let imageUrl = "";
    let mediaType = "image/png";

    for (const file of result.files ?? []) {
      if (file.mediaType.startsWith("image/")) {
        imageBase64 = file.base64;
        mediaType = file.mediaType;
        break;
      }
    }

    if (!imageBase64) {
      throw new Error("画像生成に失敗しました: 画像が生成されませんでした");
    }

    // トレースイベント作成
    tracingContext?.currentSpan?.createEventSpan({
      type: AISpanType.TOOL_CALL,
      name: "image-generation",
      output: {
        imageBase64,
        imageUrl: `data:${mediaType};base64,${imageBase64}`,
        width,
        height,
      },
    });

    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "in-progress",
        message: "画像をストレージに保存中...",
        stage: "uploading",
      },
    });

    // S3/MinIOに保存
    const storage = createStorageClient();
    const buffer = Buffer.from(imageBase64, "base64");
    const filename = `panel_${Date.now()}.png`;

    const uploadResult = await storage.upload(buffer, filename, "generated", {
      mimeType: mediaType,
    });

    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "completed",
        message: "画像生成完了",
        stage: "done",
      },
    });

    return {
      imageUrl: uploadResult.publicUrl,
      imageBase64,
      width,
      height,
      prompt: fullPrompt,
      revisedPrompt: fullPrompt,
    };
  },
});
