import { createTool } from "@mastra/core/tools";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { createStorageClient } from "@kimigatari/storage";
import { AISpanType } from "@mastra/core/ai-tracing";

export const bananaAspectRatioSchema = z.enum([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

export const bananaImageSizeSchema = z.enum(["1K", "2K", "4K"]);

export const bananaImageResultSchema = z.object({
  imageUrl: z.string(),
  width: z.number(),
  height: z.number(),
  prompt: z.string(),
  textResponse: z.string().optional(),
});

// Resolution mapping based on aspect ratio and size
const RESOLUTION_MAP: Record<string, Record<string, { width: number; height: number }>> = {
  "1:1": { "1K": { width: 1024, height: 1024 }, "2K": { width: 2048, height: 2048 }, "4K": { width: 4096, height: 4096 } },
  "2:3": { "1K": { width: 848, height: 1264 }, "2K": { width: 1696, height: 2528 }, "4K": { width: 3392, height: 5056 } },
  "3:2": { "1K": { width: 1264, height: 848 }, "2K": { width: 2528, height: 1696 }, "4K": { width: 5056, height: 3392 } },
  "3:4": { "1K": { width: 896, height: 1200 }, "2K": { width: 1792, height: 2400 }, "4K": { width: 3584, height: 4800 } },
  "4:3": { "1K": { width: 1200, height: 896 }, "2K": { width: 2400, height: 1792 }, "4K": { width: 4800, height: 3584 } },
  "4:5": { "1K": { width: 928, height: 1152 }, "2K": { width: 1856, height: 2304 }, "4K": { width: 3712, height: 4608 } },
  "5:4": { "1K": { width: 1152, height: 928 }, "2K": { width: 2304, height: 1856 }, "4K": { width: 4608, height: 3712 } },
  "9:16": { "1K": { width: 768, height: 1376 }, "2K": { width: 1536, height: 2752 }, "4K": { width: 3072, height: 5504 } },
  "16:9": { "1K": { width: 1376, height: 768 }, "2K": { width: 2752, height: 1536 }, "4K": { width: 5504, height: 3072 } },
  "21:9": { "1K": { width: 1584, height: 672 }, "2K": { width: 3168, height: 1344 }, "4K": { width: 6336, height: 2688 } },
};

export const bananaImageTool = createTool({
  id: "banana-image-generation",
  description: `Gemini 3 Pro Image Preview（Nano Banana Pro）で高品質な画像を生成します。

特徴:
- 高解像度出力（1K/2K/4K）
- 高度なテキストレンダリング（ロゴ、インフォグラフィック向け）
- 複雑なプロンプトの推論（Thinkingモード）
- 複数の参照画像からの合成

推奨用途:
- プロダクトモックアップ
- ロゴ・インフォグラフィック生成
- スタイル転送
- 複数画像からの合成
- 高品質なイラスト・コンセプトアート`,
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "画像生成プロンプト（英語推奨）。シーンを詳細に説明すると良い結果が得られます"
      ),
    referenceImageUrls: z
      .array(z.string().url())
      .max(14)
      .optional()
      .describe("参照画像のURL（最大14枚）。スタイル転送、キャラクター一貫性、画像編集に使用"),
    aspectRatio: bananaAspectRatioSchema
      .default("1:1")
      .describe("出力画像のアスペクト比"),
    imageSize: bananaImageSizeSchema
      .default("1K")
      .describe("出力画像の解像度（1K/2K/4K）"),
  }),
  outputSchema: bananaImageResultSchema,
  execute: async ({ context, writer, tracingContext }) => {
    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "in-progress",
        message: "Banana Pro で画像生成中...",
        stage: "generating",
      },
    });

    const { prompt, referenceImageUrls, aspectRatio, imageSize } = context;

    // Build content array with optional reference images
    const contents: Array<{ type: "text"; text: string } | { type: "image"; image: string; mimeType: string }> = [];

    // Fetch and add reference images if provided
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      await writer?.custom({
        type: "tool-progress",
        data: {
          status: "in-progress",
          message: `参照画像を取得中... (${referenceImageUrls.length}枚)`,
          stage: "fetching",
        },
      });

      for (const url of referenceImageUrls) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`画像の取得に失敗しました: ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const contentType = response.headers.get("content-type") || "image/png";

        contents.push({
          type: "image",
          image: base64,
          mimeType: contentType,
        });
      }
    }

    // Add text prompt
    contents.push({ type: "text", text: prompt });

    // Generate image using Gemini 3 Pro Image Preview
    const result = await generateText({
      model: google("gemini-3-pro-image-preview"),
      messages: [{ role: "user", content: contents }],
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      },
    });

    // Extract generated image from result
    let imageBase64: string | undefined;
    let mediaType = "image/png";
    let textResponse: string | undefined;

    for (const file of result.files ?? []) {
      if (file.mediaType.startsWith("image/")) {
        imageBase64 = file.base64;
        mediaType = file.mediaType;
        break;
      }
    }

    // Collect text response
    if (result.text) {
      textResponse = result.text;
    }

    if (!imageBase64) {
      throw new Error("画像生成に失敗しました: 画像が生成されませんでした");
    }

    // Get resolution based on aspect ratio and size
    const resolution = RESOLUTION_MAP[aspectRatio]?.[imageSize] ?? { width: 1024, height: 1024 };

    // トレースイベント作成
    tracingContext?.currentSpan?.createEventSpan({
      type: AISpanType.TOOL_CALL,
      name: "banana-image-generation",
      output: {
        imageBase64,
        imageUrl: `data:${mediaType};base64,${imageBase64}`,
        width: resolution.width,
        height: resolution.height,
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
    const filename = `banana_${Date.now()}.png`;

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
      width: resolution.width,
      height: resolution.height,
      prompt,
      textResponse,
    };
  },
});
