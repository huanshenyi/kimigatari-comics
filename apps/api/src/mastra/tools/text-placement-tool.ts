import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  bubbleTypeSchema,
  tailDirectionSchema,
  bubbleStyleSchema,
} from "@kimigatari/types";

export const textPlacementResultSchema = z.object({
  bubbles: z.array(
    z.object({
      id: z.string(),
      type: bubbleTypeSchema,
      text: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      size: z.object({
        width: z.number(),
        height: z.number(),
      }),
      tailDirection: tailDirectionSchema,
      tailTarget: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional(),
      style: bubbleStyleSchema.optional(),
      characterName: z.string().optional(),
    })
  ),
});

export const textPlacementTool = createTool({
  id: "text-placement",
  description:
    "コマ内のセリフやナレーションの吹き出し配置を計算します。縦書きテキストと日本語マンガの読み順を考慮します。",
  inputSchema: z.object({
    panelWidth: z.number(),
    panelHeight: z.number(),
    dialogues: z.array(
      z.object({
        characterName: z.string(),
        text: z.string(),
        bubbleType: bubbleTypeSchema,
        speakerPosition: z
          .object({
            x: z.number(),
            y: z.number(),
          })
          .optional()
          .describe("話者の位置（画像内）"),
      })
    ),
    narration: z.string().optional(),
    existingElements: z
      .array(
        z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        })
      )
      .optional()
      .describe("既存の要素（重複を避けるため）"),
  }),
  outputSchema: textPlacementResultSchema,
  execute: async ({ context, writer }) => {
    await writer?.custom({
      type: "tool-progress",
      data: { status: "in-progress", message: "テキスト配置を計算中..." },
    });

    const { panelWidth, panelHeight, dialogues, narration, existingElements } =
      context;

    const bubbles: Array<{
      id: string;
      type: "normal" | "shout" | "thought" | "narration" | "whisper";
      text: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      tailDirection: "left" | "right" | "top" | "bottom" | "none";
      tailTarget?: { x: number; y: number };
      characterName?: string;
    }> = [];

    // Calculate bubble sizes based on text length (vertical text consideration)
    const calculateBubbleSize = (
      text: string,
      type: string
    ): { width: number; height: number } => {
      // For vertical Japanese text, width is based on lines, height on character count
      const charsPerLine = 10;
      const lines = Math.ceil(text.length / charsPerLine);
      const charWidth = 24; // Approximate character width
      const charHeight = 28; // Approximate character height
      const padding = 20;

      // Vertical text: narrow width, tall height
      return {
        width: Math.min(lines * charWidth + padding * 2, panelWidth * 0.4),
        height: Math.min(
          Math.min(text.length, charsPerLine) * charHeight + padding * 2,
          panelHeight * 0.6
        ),
      };
    };

    // Place dialogue bubbles (right to left, top to bottom for reading order)
    let currentX = panelWidth - 50; // Start from right side
    let currentY = 30;
    const margin = 15;

    for (let i = 0; i < dialogues.length; i++) {
      const dialogue = dialogues[i];
      if (!dialogue) continue;

      const size = calculateBubbleSize(dialogue.text, dialogue.bubbleType);

      // Determine tail direction based on speaker position
      let tailDirection: "left" | "right" | "top" | "bottom" | "none" = "bottom";
      let tailTarget: { x: number; y: number } | undefined;

      if (dialogue.speakerPosition) {
        const bubbleCenterX = currentX - size.width / 2;
        const bubbleCenterY = currentY + size.height / 2;

        if (dialogue.speakerPosition.x < bubbleCenterX) {
          tailDirection = "left";
        } else if (dialogue.speakerPosition.x > bubbleCenterX) {
          tailDirection = "right";
        } else if (dialogue.speakerPosition.y > bubbleCenterY) {
          tailDirection = "bottom";
        } else {
          tailDirection = "top";
        }

        tailTarget = dialogue.speakerPosition;
      }

      bubbles.push({
        id: `bubble-${i}`,
        type: dialogue.bubbleType,
        text: dialogue.text,
        position: {
          x: currentX - size.width,
          y: currentY,
        },
        size,
        tailDirection,
        tailTarget,
        characterName: dialogue.characterName,
      });

      // Move position for next bubble (right to left reading)
      currentY += size.height + margin;
      if (currentY + size.height > panelHeight - margin) {
        currentY = 30;
        currentX -= size.width + margin;
      }
    }

    // Add narration box if present
    if (narration) {
      const narrationSize = {
        width: Math.min(200, panelWidth * 0.3),
        height: Math.min(100, panelHeight * 0.15),
      };

      bubbles.push({
        id: "narration",
        type: "narration",
        text: narration,
        position: {
          x: margin,
          y: margin,
        },
        size: narrationSize,
        tailDirection: "none",
      });
    }

    await writer?.custom({
      type: "tool-progress",
      data: {
        status: "completed",
        message: `${bubbles.length}個の吹き出しを配置しました`,
      },
    });

    return { bubbles };
  },
});
