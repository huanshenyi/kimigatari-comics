import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  sceneSchema,
  dialogueSchema,
  emotionSchema,
  bubbleTypeSchema,
} from "@kimigatari/types";

export const sceneParserOutputSchema = z.object({
  scenes: z.array(sceneSchema),
  totalScenes: z.number(),
  characters: z.array(z.string()),
  estimatedPages: z.number(),
});

export const sceneParserTool = createTool({
  id: "scene-parser",
  description:
    "プロットテキストを解析し、シーンに分割します。各シーンには場面説明、登場キャラクター、セリフ、感情指示が含まれます。",
  inputSchema: z.object({
    plot: z.string().describe("解析対象のプロットテキスト（小説形式）"),
    targetPageCount: z
      .number()
      .optional()
      .describe("目標ページ数（指定しない場合は自動計算）"),
  }),
  outputSchema: sceneParserOutputSchema,
  execute: async ({ context, writer }) => {
    await writer?.custom({
      type: "tool-progress",
      data: { status: "in-progress", message: "プロットを解析中..." },
    });

    // This tool's logic will be implemented by the StoryAnalyzerAgent
    // The tool serves as an interface for the agent to use
    return {
      scenes: [],
      totalScenes: 0,
      characters: [],
      estimatedPages: 0,
    };
  },
});
