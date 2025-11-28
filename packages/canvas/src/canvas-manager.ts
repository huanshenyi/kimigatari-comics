import { Canvas, Point } from "fabric";
import type { MangaCanvasConfig, CanvasPage, ToolType } from "./types";

export interface CanvasManager {
  canvas: Canvas;
  config: MangaCanvasConfig;
  pages: CanvasPage[];
  currentPageIndex: number;
  undoStack: string[];
  redoStack: string[];
}

export function initializeCanvas(
  canvasElement: HTMLCanvasElement,
  config: MangaCanvasConfig
): Canvas {
  const canvas = new Canvas(canvasElement, {
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor,
    selection: true,
    preserveObjectStacking: true,
  });

  return canvas;
}

export function createCanvasManager(
  canvas: Canvas,
  config: MangaCanvasConfig
): CanvasManager {
  return {
    canvas,
    config,
    pages: [
      {
        pageNumber: 1,
        objects: [],
        backgroundColor: config.backgroundColor,
      },
    ],
    currentPageIndex: 0,
    undoStack: [],
    redoStack: [],
  };
}

export function savePageState(manager: CanvasManager): void {
  const currentPage = manager.pages[manager.currentPageIndex];
  if (currentPage) {
    currentPage.objects = manager.canvas.getObjects().map((obj) => obj.toObject());
  }
}

export function loadPageState(manager: CanvasManager, pageIndex: number): void {
  if (pageIndex < 0 || pageIndex >= manager.pages.length) return;

  savePageState(manager);

  manager.currentPageIndex = pageIndex;
  const page = manager.pages[pageIndex];
  if (!page) return;

  manager.canvas.clear();
  manager.canvas.backgroundColor = page.backgroundColor;

  // Note: In a real implementation, you would deserialize objects here
  // For now, this is a placeholder
  manager.canvas.renderAll();
}

export function addPage(manager: CanvasManager): number {
  savePageState(manager);

  const newPage: CanvasPage = {
    pageNumber: manager.pages.length + 1,
    objects: [],
    backgroundColor: manager.config.backgroundColor,
  };

  manager.pages.push(newPage);
  return manager.pages.length - 1;
}

export function deletePage(manager: CanvasManager, pageIndex: number): boolean {
  if (manager.pages.length <= 1) return false;
  if (pageIndex < 0 || pageIndex >= manager.pages.length) return false;

  manager.pages.splice(pageIndex, 1);

  for (let i = pageIndex; i < manager.pages.length; i++) {
    const p = manager.pages[i];
    if (p) {
      p.pageNumber = i + 1;
    }
  }

  if (manager.currentPageIndex >= manager.pages.length) {
    manager.currentPageIndex = manager.pages.length - 1;
  }

  loadPageState(manager, manager.currentPageIndex);

  return true;
}

export function saveToUndo(manager: CanvasManager): void {
  const json = JSON.stringify(manager.canvas.toJSON());
  manager.undoStack.push(json);
  manager.redoStack = [];

  if (manager.undoStack.length > 50) {
    manager.undoStack.shift();
  }
}

export function undo(manager: CanvasManager): boolean {
  if (manager.undoStack.length === 0) return false;

  const currentState = JSON.stringify(manager.canvas.toJSON());
  manager.redoStack.push(currentState);

  const previousState = manager.undoStack.pop();
  if (previousState) {
    manager.canvas.loadFromJSON(previousState).then(() => {
      manager.canvas.renderAll();
    });
    return true;
  }

  return false;
}

export function redo(manager: CanvasManager): boolean {
  if (manager.redoStack.length === 0) return false;

  const currentState = JSON.stringify(manager.canvas.toJSON());
  manager.undoStack.push(currentState);

  const nextState = manager.redoStack.pop();
  if (nextState) {
    manager.canvas.loadFromJSON(nextState).then(() => {
      manager.canvas.renderAll();
    });
    return true;
  }

  return false;
}

export function setZoom(canvas: Canvas, zoom: number): void {
  const center = canvas.getCenter();
  canvas.zoomToPoint(new Point(center.left, center.top), zoom);
}

export function getZoom(canvas: Canvas): number {
  return canvas.getZoom();
}

export function exportToDataURL(
  canvas: Canvas,
  format: "png" | "jpeg" = "png",
  quality: number = 1
): string {
  return canvas.toDataURL({
    format,
    quality,
    multiplier: 2,
  });
}

export function exportAllPagesToDataURLs(
  manager: CanvasManager,
  format: "png" | "jpeg" = "png",
  quality: number = 1
): string[] {
  const currentPage = manager.currentPageIndex;
  const dataURLs: string[] = [];

  for (let i = 0; i < manager.pages.length; i++) {
    loadPageState(manager, i);
    dataURLs.push(exportToDataURL(manager.canvas, format, quality));
  }

  loadPageState(manager, currentPage);

  return dataURLs;
}

export function clearCanvas(canvas: Canvas): void {
  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.renderAll();
}

export function deleteSelectedObjects(canvas: Canvas): void {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}

export function bringToFront(canvas: Canvas): void {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.bringObjectToFront(activeObject);
    canvas.renderAll();
  }
}

export function sendToBack(canvas: Canvas): void {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.sendObjectToBack(activeObject);
    canvas.renderAll();
  }
}

export function setupKeyboardShortcuts(
  canvas: Canvas,
  manager: CanvasManager,
  onToolChange?: (tool: ToolType) => void
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      if (e.shiftKey) {
        redo(manager);
      } else {
        undo(manager);
      }
      e.preventDefault();
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      deleteSelectedObjects(canvas);
      e.preventDefault();
    }

    if (e.key === "v" && !e.metaKey && !e.ctrlKey) {
      onToolChange?.("select");
    }
    if (e.key === "p" && !e.metaKey && !e.ctrlKey) {
      onToolChange?.("panel");
    }
    if (e.key === "b" && !e.metaKey && !e.ctrlKey) {
      onToolChange?.("bubble");
    }
    if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
      onToolChange?.("text");
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}
