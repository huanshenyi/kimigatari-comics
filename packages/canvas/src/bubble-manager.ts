import { Canvas, Ellipse, Path, Group, IText } from "fabric";
import type { BubbleObject, BubbleType, BubblePosition } from "./types";

const BUBBLE_STYLES: Record<
  BubbleType,
  {
    fill: string;
    stroke: string;
    strokeWidth: number;
    strokeDashArray?: number[];
  }
> = {
  normal: {
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
  },
  shout: {
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 3,
  },
  thought: {
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
    strokeDashArray: [5, 5],
  },
  narration: {
    fill: "#f0f0f0",
    stroke: "#000000",
    strokeWidth: 1,
  },
  whisper: {
    fill: "#ffffff",
    stroke: "#888888",
    strokeWidth: 1,
    strokeDashArray: [3, 3],
  },
};

export function createBubble(
  canvas: Canvas,
  position: BubblePosition,
  bubbleId: string,
  bubbleType: BubbleType,
  text: string = ""
): BubbleObject {
  const style = BUBBLE_STYLES[bubbleType];

  let bubbleShape: Ellipse | Path;

  if (bubbleType === "shout") {
    bubbleShape = createShoutBubbleShape(position, style);
  } else if (bubbleType === "narration") {
    bubbleShape = createNarrationBubbleShape(position, style);
  } else {
    bubbleShape = new Ellipse({
      rx: position.width / 2,
      ry: position.height / 2,
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      strokeDashArray: style.strokeDashArray,
      originX: "center",
      originY: "center",
    });
  }

  const textObj = new IText(text, {
    fontSize: 14,
    fontFamily: "sans-serif",
    fill: "#000000",
    textAlign: "center",
    originX: "center",
    originY: "center",
  });

  const group = new Group([bubbleShape, textObj], {
    left: position.x,
    top: position.y,
    selectable: true,
    hasControls: true,
    hasBorders: true,
  }) as BubbleObject;

  group.bubbleId = bubbleId;
  group.bubbleType = bubbleType;
  group.text = text;

  canvas.add(group);
  canvas.renderAll();

  return group;
}

function createShoutBubbleShape(
  position: BubblePosition,
  style: (typeof BUBBLE_STYLES)["shout"]
): Path {
  const cx = 0;
  const cy = 0;
  const rx = position.width / 2;
  const ry = position.height / 2;
  const spikes = 12;

  let pathData = "";
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const nextAngle = ((i + 0.5) / spikes) * Math.PI * 2;

    const outerX = cx + rx * 1.2 * Math.cos(angle);
    const outerY = cy + ry * 1.2 * Math.sin(angle);
    const innerX = cx + rx * 0.85 * Math.cos(nextAngle);
    const innerY = cy + ry * 0.85 * Math.sin(nextAngle);

    if (i === 0) {
      pathData = `M ${outerX} ${outerY}`;
    }
    pathData += ` L ${innerX} ${innerY}`;

    const nextOuterAngle = ((i + 1) / spikes) * Math.PI * 2;
    const nextOuterX = cx + rx * 1.2 * Math.cos(nextOuterAngle);
    const nextOuterY = cy + ry * 1.2 * Math.sin(nextOuterAngle);
    pathData += ` L ${nextOuterX} ${nextOuterY}`;
  }
  pathData += " Z";

  return new Path(pathData, {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    originX: "center",
    originY: "center",
  });
}

function createNarrationBubbleShape(
  position: BubblePosition,
  style: (typeof BUBBLE_STYLES)["narration"]
): Path {
  const w = position.width;
  const h = position.height;

  const pathData = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;

  return new Path(pathData, {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    originX: "center",
    originY: "center",
  });
}

export function updateBubbleText(bubble: BubbleObject, newText: string): void {
  const objects = bubble.getObjects();
  const textObj = objects.find((obj) => obj instanceof IText) as IText | undefined;

  if (textObj) {
    textObj.set("text", newText);
    bubble.text = newText;
  }
}

export function findBubbleById(canvas: Canvas, bubbleId: string): BubbleObject | undefined {
  const objects = canvas.getObjects();
  return objects.find(
    (obj) => (obj as BubbleObject).bubbleId === bubbleId
  ) as BubbleObject | undefined;
}

export function getAllBubbles(canvas: Canvas): BubbleObject[] {
  const objects = canvas.getObjects();
  return objects.filter((obj) => (obj as BubbleObject).bubbleId !== undefined) as BubbleObject[];
}

export function deleteBubble(canvas: Canvas, bubbleId: string): boolean {
  const bubble = findBubbleById(canvas, bubbleId);
  if (bubble) {
    canvas.remove(bubble);
    canvas.renderAll();
    return true;
  }
  return false;
}

export function changeBubbleType(
  canvas: Canvas,
  bubbleId: string,
  newType: BubbleType
): BubbleObject | null {
  const bubble = findBubbleById(canvas, bubbleId);
  if (!bubble) return null;

  const position: BubblePosition = {
    x: bubble.left || 0,
    y: bubble.top || 0,
    width: bubble.width || 100,
    height: bubble.height || 50,
  };

  const text = bubble.text;

  canvas.remove(bubble);
  return createBubble(canvas, position, bubbleId, newType, text);
}
