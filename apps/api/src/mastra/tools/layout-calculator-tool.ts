import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { panelLayoutSchema, positionSchema } from "@kimigatari/types";

// Page dimensions for standard manga (B5 size in pixels at 300dpi)
const PAGE_WIDTH = 1748;
const PAGE_HEIGHT = 2480;
const MARGIN = 50;
const GUTTER = 20;

export const layoutResultSchema = z.object({
  pages: z.array(
    z.object({
      pageNumber: z.number(),
      panels: z.array(panelLayoutSchema),
    })
  ),
  totalPages: z.number(),
});

export const layoutCalculatorTool = createTool({
  id: "layout-calculator",
  description:
    "シーン情報に基づいてコマ割りレイアウトを計算します。日本のマンガの読み順（右から左）を考慮します。",
  inputSchema: z.object({
    scenes: z.array(
      z.object({
        sceneNumber: z.number(),
        suggestedPanelCount: z.number().optional(),
        dialogueCount: z.number(),
        hasAction: z.boolean().optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
      })
    ),
    targetPageCount: z.number().optional(),
    pageWidth: z.number().default(PAGE_WIDTH),
    pageHeight: z.number().default(PAGE_HEIGHT),
  }),
  outputSchema: layoutResultSchema,
  execute: async ({ context, writer }) => {
    await writer?.custom({
      type: "tool-progress",
      data: { status: "in-progress", message: "レイアウトを計算中..." },
    });

    const { scenes, targetPageCount, pageWidth, pageHeight } = context;
    const pages: Array<{
      pageNumber: number;
      panels: Array<{
        panelOrder: number;
        position: { x: number; y: number; width: number; height: number };
        sceneDescription?: string;
      }>;
    }> = [];

    // Calculate total panels needed
    const totalPanels = scenes.reduce(
      (sum, scene) => sum + (scene.suggestedPanelCount || 3),
      0
    );

    // Estimate panels per page (typically 4-6 for manga)
    const panelsPerPage = 5;
    const estimatedPages = targetPageCount || Math.ceil(totalPanels / panelsPerPage);

    let currentPage = 1;
    let panelsOnCurrentPage = 0;
    let globalPanelOrder = 0;
    let currentPagePanels: Array<{
      panelOrder: number;
      position: { x: number; y: number; width: number; height: number };
      sceneDescription?: string;
    }> = [];

    for (const scene of scenes) {
      const panelCount = scene.suggestedPanelCount || 3;

      for (let i = 0; i < panelCount; i++) {
        if (panelsOnCurrentPage >= panelsPerPage) {
          pages.push({
            pageNumber: currentPage,
            panels: calculatePanelPositions(currentPagePanels, pageWidth, pageHeight),
          });
          currentPage++;
          panelsOnCurrentPage = 0;
          currentPagePanels = [];
        }

        currentPagePanels.push({
          panelOrder: globalPanelOrder,
          position: { x: 0, y: 0, width: 0, height: 0 },
          sceneDescription: i === 0 ? `Scene ${scene.sceneNumber}` : undefined,
        });

        panelsOnCurrentPage++;
        globalPanelOrder++;
      }
    }

    // Add remaining panels
    if (currentPagePanels.length > 0) {
      pages.push({
        pageNumber: currentPage,
        panels: calculatePanelPositions(currentPagePanels, pageWidth, pageHeight),
      });
    }

    await writer?.custom({
      type: "tool-progress",
      data: { status: "completed", message: `${pages.length}ページのレイアウトを生成しました` },
    });

    return {
      pages,
      totalPages: pages.length,
    };
  },
});

function calculatePanelPositions(
  panels: Array<{
    panelOrder: number;
    position: { x: number; y: number; width: number; height: number };
    sceneDescription?: string;
  }>,
  pageWidth: number,
  pageHeight: number
): Array<{
  panelOrder: number;
  position: { x: number; y: number; width: number; height: number };
  sceneDescription?: string;
}> {
  const margin = MARGIN;
  const gutter = GUTTER;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const count = panels.length;

  // Different layout patterns based on panel count
  const layouts = getLayoutPattern(count, contentWidth, contentHeight);

  return panels.map((panel, index) => {
    const layout = layouts[index] || layouts[0];
    return {
      ...panel,
      position: {
        x: margin + (layout?.x ?? 0),
        y: margin + (layout?.y ?? 0),
        width: layout?.width ?? contentWidth,
        height: layout?.height ?? contentHeight / count,
      },
    };
  });
}

function getLayoutPattern(
  count: number,
  width: number,
  height: number
): Array<{ x: number; y: number; width: number; height: number }> {
  const gutter = GUTTER;
  const halfWidth = (width - gutter) / 2;
  const thirdHeight = (height - gutter * 2) / 3;
  const halfHeight = (height - gutter) / 2;

  switch (count) {
    case 1:
      return [{ x: 0, y: 0, width, height }];

    case 2:
      return [
        { x: 0, y: 0, width, height: halfHeight },
        { x: 0, y: halfHeight + gutter, width, height: halfHeight },
      ];

    case 3:
      return [
        { x: 0, y: 0, width, height: thirdHeight },
        { x: 0, y: thirdHeight + gutter, width, height: thirdHeight },
        { x: 0, y: thirdHeight * 2 + gutter * 2, width, height: thirdHeight },
      ];

    case 4:
      return [
        { x: halfWidth + gutter, y: 0, width: halfWidth, height: halfHeight },
        { x: 0, y: 0, width: halfWidth, height: halfHeight },
        { x: halfWidth + gutter, y: halfHeight + gutter, width: halfWidth, height: halfHeight },
        { x: 0, y: halfHeight + gutter, width: halfWidth, height: halfHeight },
      ];

    case 5:
      return [
        { x: halfWidth + gutter, y: 0, width: halfWidth, height: thirdHeight },
        { x: 0, y: 0, width: halfWidth, height: thirdHeight },
        { x: 0, y: thirdHeight + gutter, width, height: thirdHeight },
        { x: halfWidth + gutter, y: thirdHeight * 2 + gutter * 2, width: halfWidth, height: thirdHeight },
        { x: 0, y: thirdHeight * 2 + gutter * 2, width: halfWidth, height: thirdHeight },
      ];

    case 6:
      return [
        { x: halfWidth + gutter, y: 0, width: halfWidth, height: thirdHeight },
        { x: 0, y: 0, width: halfWidth, height: thirdHeight },
        { x: halfWidth + gutter, y: thirdHeight + gutter, width: halfWidth, height: thirdHeight },
        { x: 0, y: thirdHeight + gutter, width: halfWidth, height: thirdHeight },
        { x: halfWidth + gutter, y: thirdHeight * 2 + gutter * 2, width: halfWidth, height: thirdHeight },
        { x: 0, y: thirdHeight * 2 + gutter * 2, width: halfWidth, height: thirdHeight },
      ];

    default:
      // For more panels, distribute evenly
      const rows = Math.ceil(count / 2);
      const rowHeight = (height - gutter * (rows - 1)) / rows;
      return Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const isRightColumn = col === 0; // Right-to-left reading
        return {
          x: isRightColumn ? halfWidth + gutter : 0,
          y: row * (rowHeight + gutter),
          width: halfWidth,
          height: rowHeight,
        };
      });
  }
}
