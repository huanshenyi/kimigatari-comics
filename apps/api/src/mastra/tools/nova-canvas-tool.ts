import { createTool } from "@mastra/core/tools";
import { experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import { bedrock } from "../lib/providers";
import { createStorageClient } from "@kimigatari/storage";
import { AISpanType } from "@mastra/core/ai-tracing";

export const novaCanvasStyleSchema = z.enum([
  "PHOTOREALISM",
  "3D_ANIMATED_FAMILY_FILM",
  "DESIGN_SKETCH",
  "FLAT_VECTOR_ILLUSTRATION",
  "GRAPHIC_NOVEL_ILLUSTRATION",
  "MAXIMALISM",
  "MIDCENTURY_RETRO",
  "SOFT_DIGITAL_PAINTING",
]);

export const novaCanvasResultSchema = z.object({
  imageUrl: z.string(),
  width: z.number(),
  height: z.number(),
  prompt: z.string(),
});

export const novaCanvasTool = createTool({
  id: "nova-canvas-image-generation",
  description:
    "Amazon Nova Canvasで画像を生成します。高品質な画像生成が可能で、様々なスタイルに対応しています。",
  inputSchema: z.object({
    prompt: z.string().describe("画像生成プロンプト（英語推奨）"),
    negativePrompt: z
      .string()
      .optional()
      .describe("生成したくない要素（例: blurry, low quality）"),
    width: z
      .number()
      .default(1024)
      .describe("画像の幅（320-4096、16の倍数）"),
    height: z
      .number()
      .default(1024)
      .describe("画像の高さ（320-4096、16の倍数）"),
    seed: z.number().optional().describe("再現性のためのシード値"),
    style: novaCanvasStyleSchema
      .optional()
      .describe("画像スタイル（PHOTOREALISM, GRAPHIC_NOVEL_ILLUSTRATION等）"),
    quality: z
      .enum(["standard", "premium"])
      .default("standard")
      .describe("品質レベル"),
  }),
  outputSchema: novaCanvasResultSchema,
  execute: async ({ context, writer, tracingContext }) => {
    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "in-progress",
        message: "Nova Canvasで画像生成中...",
        stage: "generating",
      },
    });

    const { prompt, negativePrompt, width, height, seed, style, quality } =
      context;

    // Ensure minimum size of 320 and multiple of 16 for Nova Canvas
    const actualWidth = Math.max(320, Math.ceil(width / 16) * 16);
    const actualHeight = Math.max(320, Math.ceil(height / 16) * 16);

    const { image } = await generateImage({
      model: bedrock.image("amazon.nova-canvas-v1:0"),
      prompt,
      size: `${actualWidth}x${actualHeight}`,
      seed,
      providerOptions: {
        bedrock: {
          quality,
          negativeText: negativePrompt || "",
          style: style || "PHOTOREALISM",
        },
      },
    });
    // langfuse Tracing確認用
    // tracingContext?.currentSpan?.update({ output: { image: image.base64 } });
    tracingContext?.currentSpan?.createEventSpan({
      type: AISpanType.TOOL_CALL,
      name: "nova-canvas-image-generation",
      output: {imageBase64: image.base64, imageUrl: `data:image/png;base64,${image.base64}`, width: actualWidth, height: actualHeight },
    })
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
    const buffer = Buffer.from(image.base64, "base64");
    const filename = `panel_${Date.now()}.png`;

    const uploadResult = await storage.upload(
      buffer,
      filename,
      "generated",
      { mimeType: "image/png" }
    );

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
      width: actualWidth,
      height: actualHeight,
      prompt,
    };
  },
});
