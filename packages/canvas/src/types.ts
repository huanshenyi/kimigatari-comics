import type { Canvas, Object as FabricObject, Rect, IText, Group } from "fabric";

export interface CanvasState {
  canvas: Canvas | null;
  selectedTool: ToolType;
  zoom: number;
  currentPage: number;
  totalPages: number;
}

export type ToolType = "select" | "panel" | "bubble" | "text" | "eraser";

export interface PanelObject extends Rect {
  panelId: string;
  panelOrder: number;
}

export interface BubbleObject extends Group {
  bubbleId: string;
  bubbleType: BubbleType;
  text: string;
}

export type BubbleType = "normal" | "shout" | "thought" | "narration" | "whisper";

export interface TextObject extends IText {
  textId: string;
  isVertical: boolean;
}

export interface CanvasPage {
  pageNumber: number;
  objects: FabricObject[];
  backgroundColor: string;
}

export interface MangaCanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export const DEFAULT_CANVAS_CONFIG: MangaCanvasConfig = {
  width: 600,
  height: 850,
  backgroundColor: "#ffffff",
  gridSize: 10,
  snapToGrid: true,
  showGrid: false,
};

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BubblePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  tailX?: number;
  tailY?: number;
}
