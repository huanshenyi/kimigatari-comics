import { Canvas, Rect, Line } from "fabric";
import type { PanelPosition, PanelObject } from "./types";

const PANEL_BORDER_WIDTH = 2;
const PANEL_BORDER_COLOR = "#000000";
const PANEL_FILL_COLOR = "#ffffff";

export function createPanel(
  canvas: Canvas,
  position: PanelPosition,
  panelId: string,
  panelOrder: number
): PanelObject {
  const rect = new Rect({
    left: position.x,
    top: position.y,
    width: position.width,
    height: position.height,
    fill: PANEL_FILL_COLOR,
    stroke: PANEL_BORDER_COLOR,
    strokeWidth: PANEL_BORDER_WIDTH,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: true,
  }) as unknown as PanelObject;

  rect.panelId = panelId;
  rect.panelOrder = panelOrder;

  canvas.add(rect);
  canvas.renderAll();

  return rect;
}

export function createPanelFromLayout(
  canvas: Canvas,
  layout: {
    panelId: string;
    position: PanelPosition;
    panelOrder: number;
  }[]
): PanelObject[] {
  const panels: PanelObject[] = [];

  for (const item of layout) {
    const panel = createPanel(canvas, item.position, item.panelId, item.panelOrder);
    panels.push(panel);
  }

  return panels;
}

export function updatePanelPosition(panel: PanelObject, position: Partial<PanelPosition>): void {
  if (position.x !== undefined) panel.set("left", position.x);
  if (position.y !== undefined) panel.set("top", position.y);
  if (position.width !== undefined) panel.set("width", position.width);
  if (position.height !== undefined) panel.set("height", position.height);
  panel.setCoords();
}

export function getPanelPosition(panel: PanelObject): PanelPosition {
  return {
    x: panel.left || 0,
    y: panel.top || 0,
    width: panel.width || 0,
    height: panel.height || 0,
  };
}

export function findPanelById(canvas: Canvas, panelId: string): PanelObject | undefined {
  const objects = canvas.getObjects();
  return objects.find(
    (obj) => (obj as PanelObject).panelId === panelId
  ) as PanelObject | undefined;
}

export function getAllPanels(canvas: Canvas): PanelObject[] {
  const objects = canvas.getObjects();
  return objects.filter((obj) => (obj as PanelObject).panelId !== undefined) as PanelObject[];
}

export function sortPanelsByOrder(panels: PanelObject[]): PanelObject[] {
  return [...panels].sort((a, b) => a.panelOrder - b.panelOrder);
}

export function deletePanel(canvas: Canvas, panelId: string): boolean {
  const panel = findPanelById(canvas, panelId);
  if (panel) {
    canvas.remove(panel);
    canvas.renderAll();
    return true;
  }
  return false;
}

export function createGutterLines(
  canvas: Canvas,
  panels: PanelObject[],
  gutterWidth: number = 10
): Line[] {
  const lines: Line[] = [];
  const sortedPanels = sortPanelsByOrder(panels);

  for (let i = 0; i < sortedPanels.length - 1; i++) {
    const currentPanel = sortedPanels[i];
    const nextPanel = sortedPanels[i + 1];

    if (!currentPanel || !nextPanel) continue;

    const currentRight = (currentPanel.left || 0) + (currentPanel.width || 0);
    const nextLeft = nextPanel.left || 0;

    if (Math.abs(currentRight - nextLeft) < gutterWidth * 2) {
      const midX = (currentRight + nextLeft) / 2;
      const minTop = Math.min(currentPanel.top || 0, nextPanel.top || 0);
      const maxBottom = Math.max(
        (currentPanel.top || 0) + (currentPanel.height || 0),
        (nextPanel.top || 0) + (nextPanel.height || 0)
      );
      const line = new Line(
        [midX, minTop, midX, maxBottom],
        {
          stroke: PANEL_BORDER_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        }
      );
      lines.push(line);
      canvas.add(line);
    }
  }

  canvas.renderAll();
  return lines;
}
