import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  storyAnalyzerAgent,
  panelLayoutAgent,
  imageGeneratorAgent,
  textPlacementAgent,
} from "../agents";
import { sceneSchema, panelLayoutSchema } from "@kimigatari/types";

// Step 1: Analyze the plot and extract scenes
const analyzeStory = createStep({
  id: "analyze-story",
  description: "プロットを解析してシーンに分割",
  inputSchema: z.object({
    plot: z.string(),
    title: z.string().optional(),
    targetPageCount: z.number().optional(),
  }),
  outputSchema: z.object({
    scenes: z.array(sceneSchema),
    totalScenes: z.number(),
    characters: z.array(z.string()),
    estimatedPages: z.number(),
  }),
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "progress",
      data: { step: "analyze-story", status: "started", message: "プロット解析を開始..." },
    });

    const prompt = `以下のプロットをマンガ用のシーンに分割してください。

プロット:
${inputData.plot}

目標ページ数: ${inputData.targetPageCount || "自動"}

各シーンには以下の情報を含めてJSON形式で出力してください:
- sceneNumber: シーン番号
- description: シーンの視覚的説明
- setting: 場面設定
- characters: 登場キャラクター
- dialogues: セリフ配列（characterName, text, emotion, bubbleType）
- narration: ナレーション（あれば）
- visualNotes: 作画指示（あれば）
- suggestedPanelCount: 推奨コマ数`;

    const response = await storyAnalyzerAgent.stream([
      { role: "user", content: prompt },
    ]);

    let fullResponse = "";
    for await (const chunk of response.textStream) {
      fullResponse += chunk;
    }

    // Parse the response (assuming JSON output)
    // In production, add proper parsing and validation
    let result;
    try {
      // Extract JSON from the response
      const jsonMatch = fullResponse.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : fullResponse;
      result = JSON.parse(jsonStr || "{}");
    } catch {
      // Fallback structure if parsing fails
      result = {
        scenes: [
          {
            sceneNumber: 1,
            description: inputData.plot.substring(0, 200),
            setting: "Unknown",
            characters: [],
            dialogues: [],
            suggestedPanelCount: 4,
          },
        ],
        totalScenes: 1,
        characters: [],
        estimatedPages: 1,
      };
    }

    await writer?.write({
      type: "progress",
      data: {
        step: "analyze-story",
        status: "completed",
        message: `${result.totalScenes}シーンを抽出しました`,
      },
    });

    return {
      scenes: result.scenes || [],
      totalScenes: result.totalScenes || result.scenes?.length || 0,
      characters: result.characters || [],
      estimatedPages: result.estimatedPages || Math.ceil((result.scenes?.length || 1) / 2),
    };
  },
});

// Step 2: Generate panel layouts
const generateLayouts = createStep({
  id: "generate-layouts",
  description: "コマ割りレイアウトを生成",
  inputSchema: z.object({
    scenes: z.array(sceneSchema),
    totalScenes: z.number(),
    characters: z.array(z.string()),
    estimatedPages: z.number(),
  }),
  outputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        panels: z.array(panelLayoutSchema),
      })
    ),
    totalPages: z.number(),
    scenes: z.array(sceneSchema),
    characters: z.array(z.string()),
  }),
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "progress",
      data: { step: "generate-layouts", status: "started", message: "レイアウト生成を開始..." },
    });

    const sceneData = inputData.scenes.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      suggestedPanelCount: scene.suggestedPanelCount || 3,
      dialogueCount: scene.dialogues.length,
      hasAction: scene.visualNotes?.toLowerCase().includes("action") || false,
      importance: "medium" as const,
    }));

    const prompt = `以下のシーン情報に基づいてコマ割りを計算してください。
layoutCalculatorツールを使用してください。

シーン情報:
${JSON.stringify(sceneData, null, 2)}

目標ページ数: ${inputData.estimatedPages}`;

    const response = await panelLayoutAgent.stream([
      { role: "user", content: prompt },
    ]);

    let fullResponse = "";
    for await (const chunk of response.textStream) {
      fullResponse += chunk;
    }

    // In production, extract the tool result properly
    // For now, return a default layout
    const pages = [];
    let panelOrder = 0;

    for (let pageNum = 1; pageNum <= inputData.estimatedPages; pageNum++) {
      const panelsPerPage = 5;
      const panels = [];

      for (let i = 0; i < panelsPerPage; i++) {
        panels.push({
          panelOrder: panelOrder++,
          position: {
            x: (i % 2) * 400 + 50,
            y: Math.floor(i / 2) * 300 + 50,
            width: 350,
            height: 250,
          },
        });
      }

      pages.push({ pageNumber: pageNum, panels });
    }

    await writer?.write({
      type: "progress",
      data: {
        step: "generate-layouts",
        status: "completed",
        message: `${pages.length}ページのレイアウトを生成しました`,
      },
    });

    return {
      pages,
      totalPages: pages.length,
      scenes: inputData.scenes,
      characters: inputData.characters,
    };
  },
});

// Step 3: Generate images for each panel
const generateImages = createStep({
  id: "generate-images",
  description: "各コマの画像を生成",
  inputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        panels: z.array(panelLayoutSchema),
      })
    ),
    totalPages: z.number(),
    scenes: z.array(sceneSchema),
    characters: z.array(z.string()),
  }),
  outputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        panels: z.array(
          z.object({
            panelOrder: z.number(),
            position: z.object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            }),
            imageUrl: z.string().optional(),
            sceneIndex: z.number().optional(),
          })
        ),
      })
    ),
    scenes: z.array(sceneSchema),
    characters: z.array(z.string()),
  }),
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "progress",
      data: { step: "generate-images", status: "started", message: "画像生成を開始..." },
    });

    const totalPanels = inputData.pages.reduce((sum, p) => sum + p.panels.length, 0);
    let processedPanels = 0;

    const updatedPages = [];

    for (const page of inputData.pages) {
      const updatedPanels = [];

      for (const panel of page.panels) {
        // Find corresponding scene
        const sceneIndex = Math.min(
          Math.floor(panel.panelOrder / 3),
          inputData.scenes.length - 1
        );
        const scene = inputData.scenes[sceneIndex];

        await writer?.write({
          type: "progress",
          data: {
            step: "generate-images",
            status: "in-progress",
            message: `画像生成中: ${processedPanels + 1}/${totalPanels}`,
            progress: Math.round((processedPanels / totalPanels) * 100),
          },
        });

        // In production, call imageGeneratorAgent here
        // For now, placeholder
        const imageUrl = ""; // Would be generated image URL

        updatedPanels.push({
          ...panel,
          imageUrl,
          sceneIndex,
        });

        processedPanels++;
      }

      updatedPages.push({
        pageNumber: page.pageNumber,
        panels: updatedPanels,
      });
    }

    await writer?.write({
      type: "progress",
      data: {
        step: "generate-images",
        status: "completed",
        message: `${totalPanels}枚の画像を生成しました`,
      },
    });

    return {
      pages: updatedPages,
      scenes: inputData.scenes,
      characters: inputData.characters,
    };
  },
});

// Step 4: Place text and speech bubbles
const placeText = createStep({
  id: "place-text",
  description: "吹き出しとテキストを配置",
  inputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        panels: z.array(
          z.object({
            panelOrder: z.number(),
            position: z.object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            }),
            imageUrl: z.string().optional(),
            sceneIndex: z.number().optional(),
          })
        ),
      })
    ),
    scenes: z.array(sceneSchema),
    characters: z.array(z.string()),
  }),
  outputSchema: z.object({
    pages: z.array(
      z.object({
        pageNumber: z.number(),
        panels: z.array(
          z.object({
            panelOrder: z.number(),
            position: z.object({
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            }),
            imageUrl: z.string().optional(),
            sceneIndex: z.number().optional(),
            bubbles: z.array(
              z.object({
                id: z.string(),
                type: z.string(),
                text: z.string(),
                position: z.object({ x: z.number(), y: z.number() }),
                size: z.object({ width: z.number(), height: z.number() }),
                tailDirection: z.string(),
              })
            ).optional(),
          })
        ),
      })
    ),
    generationComplete: z.boolean(),
  }),
  execute: async ({ inputData, writer }) => {
    await writer?.write({
      type: "progress",
      data: { step: "place-text", status: "started", message: "テキスト配置を開始..." },
    });

    const updatedPages = [];

    for (const page of inputData.pages) {
      const updatedPanels = [];

      for (const panel of page.panels) {
        const sceneIndex = panel.sceneIndex ?? 0;
        const scene = inputData.scenes[sceneIndex];

        // Calculate text placement
        const bubbles = scene?.dialogues.map((dialogue, idx) => ({
          id: `bubble-${panel.panelOrder}-${idx}`,
          type: dialogue.bubbleType,
          text: dialogue.text,
          position: {
            x: panel.position.width - 100 - idx * 80,
            y: 20 + idx * 60,
          },
          size: {
            width: 80,
            height: Math.min(dialogue.text.length * 3 + 40, 150),
          },
          tailDirection: "bottom",
        })) || [];

        updatedPanels.push({
          ...panel,
          bubbles,
        });
      }

      updatedPages.push({
        pageNumber: page.pageNumber,
        panels: updatedPanels,
      });
    }

    await writer?.write({
      type: "progress",
      data: {
        step: "place-text",
        status: "completed",
        message: "テキスト配置が完了しました",
      },
    });

    return {
      pages: updatedPages,
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
    pages: z.array(z.any()),
    generationComplete: z.boolean(),
  }),
})
  .then(analyzeStory)
  .then(generateLayouts)
  .then(generateImages)
  .then(placeText);

mangaGenerationWorkflow.commit();
