import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { imageGeneratorAgent } from "../agents";
import { novaCanvasResultSchema } from "../tools/nova-canvas-tool";
import { panelLayoutSchema } from "@kimigatari/types";

// Asset schema for characters, backgrounds, and references
const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  s3_key: z.string(),
  url: z.string(),
});

const assetsSchema = z.object({
  characters: z.array(assetSchema).optional(),
  backgrounds: z.array(assetSchema).optional(),
  references: z.array(assetSchema).optional(),
}).optional();

// Simple image generation step
const generateImage = createStep({
  id: "generate-image",
  description: "画像を1枚生成",
  inputSchema: z.object({
    plot: z.string(),
    title: z.string().optional(),
    targetPageCount: z.number().optional(),
    assets: assetsSchema,
  }),
  outputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        layoutData: z.array(panelLayoutSchema),
      })
    ),
    generationComplete: z.boolean(),
  }),
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "progress",
      data: { stepId: "generate-image", status: "started", message: "画像生成を開始..." },
    });

    // Build background context from assets
    const backgroundContext = inputData.assets?.backgrounds?.length
      ? `\n背景素材: ${inputData.assets.backgrounds.length}点利用可能`
      : '';

    // Collect reference image URLs from all assets
    const referenceImageUrls: string[] = [];

    // Add character reference images
    if (inputData.assets?.characters) {
      inputData.assets.characters.forEach(char => {
        if (char.url) referenceImageUrls.push(char.url);
      });
    }

    // Add background reference images
    if (inputData.assets?.backgrounds) {
      inputData.assets.backgrounds.forEach(bg => {
        if (bg.url) referenceImageUrls.push(bg.url);
      });
    }

    // Add other reference images
    if (inputData.assets?.references) {
      inputData.assets.references.forEach(ref => {
        if (ref.url) referenceImageUrls.push(ref.url);
      });
    }

    const prompt = `

プロット: ${inputData.plot}${backgroundContext}

白黒マンガスタイルで生成してください。`;

    let imageUrl = "";

    try {
      // Build enhanced prompt with reference image instruction
      let enhancedPrompt = prompt;

      if (referenceImageUrls.length > 0) {
        enhancedPrompt = `${prompt}

参照画像が${referenceImageUrls.length}枚提供されています。
これらの参照画像を使用して、キャラクターや背景の一貫性を保ってください。

bananaImageToolを使用する場合は、referenceImageUrlsパラメータに以下のURLを渡してください:
${referenceImageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

参照画像を活用して、キャラクターの外見や背景のスタイルを維持しながら、プロットに沿った画像を生成してください。`;
      }

      const response = await imageGeneratorAgent.generate(enhancedPrompt, {
        structuredOutput: { schema: novaCanvasResultSchema },
      });

      imageUrl = response.object?.imageUrl || "";
      console.log("Generated image URL:", imageUrl);
      console.log("Reference images provided:", referenceImageUrls.length);

    } catch (error) {
      console.error("Failed to generate image:", error);
    }

    await writer?.write({
      type: "progress",
      data: {
        stepId: "generate-image",
        status: "completed",
        message: "画像生成が完了しました",
      },
    });

    return {
      pages: [
        {
          pageNumber: 1,
          layoutData: [
            {
              panelOrder: 0,
              position: { x: 50, y: 50, width: 512, height: 512 },
              imageUrl,
              sceneDescription: inputData.plot,
            },
          ],
        },
      ],
      generationComplete: true,
    };
  },
});

// Create and export the workflow
export const mangaGenerationWorkflow = createWorkflow({
  id: "manga-generation",
  description: "プロットからマンガを自動生成するワークフロー",
  inputSchema: z.object({
    plot: z.string(),
    title: z.string().optional(),
    targetPageCount: z.number().optional(),
    assets: assetsSchema,
  }),
  outputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        layoutData: z.array(panelLayoutSchema),
      })
    ),
    generationComplete: z.boolean(),
  }),
})
  .then(generateImage);

mangaGenerationWorkflow.commit();
