import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { imageGeneratorAgent } from "../agents";
import { novaCanvasResultSchema } from "../tools/nova-canvas-tool";
import { panelLayoutSchema } from "@kimigatari/types";

// Simple image generation step
const generateImage = createStep({
  id: "generate-image",
  description: "画像を1枚生成",
  inputSchema: z.object({
    plot: z.string(),
    title: z.string().optional(),
    targetPageCount: z.number().optional(),
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

    const prompt = `以下のプロットに基づいてマンガパネル画像を1枚生成してください。

プロット: ${inputData.plot}

白黒マンガスタイルで、キャラクターと背景を含む1コマの画像を生成してください。
サイズ: 512x512`;

    let imageUrl = "";

    try {
      const response = await imageGeneratorAgent.generate(prompt, {
        structuredOutput: { schema: novaCanvasResultSchema }
      });

      imageUrl = response.object?.imageUrl || "";
      console.log("Generated image URL:", imageUrl);

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
