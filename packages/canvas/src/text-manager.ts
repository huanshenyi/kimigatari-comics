import { Canvas, IText } from "fabric";
import type { TextObject } from "./types";

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = "sans-serif";
const DEFAULT_TEXT_COLOR = "#000000";

export interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  fill?: string;
  textAlign?: string;
}

export function createText(
  canvas: Canvas,
  text: string,
  x: number,
  y: number,
  textId: string,
  isVertical: boolean = true,
  style?: TextStyle
): TextObject {
  const displayText = isVertical ? convertToVerticalText(text) : text;

  const textObj = new IText(displayText, {
    left: x,
    top: y,
    fontSize: style?.fontSize || DEFAULT_FONT_SIZE,
    fontFamily: style?.fontFamily || DEFAULT_FONT_FAMILY,
    fontWeight: style?.fontWeight || "normal",
    fontStyle: style?.fontStyle || "normal",
    fill: style?.fill || DEFAULT_TEXT_COLOR,
    textAlign: isVertical ? "center" : (style?.textAlign || "left"),
    selectable: true,
    hasControls: true,
    hasBorders: true,
  }) as unknown as TextObject;

  textObj.textId = textId;
  textObj.isVertical = isVertical;

  canvas.add(textObj);
  canvas.renderAll();

  return textObj;
}

export function convertToVerticalText(text: string): string {
  return text.split("").join("\n");
}

export function convertToHorizontalText(verticalText: string): string {
  return verticalText.split("\n").join("");
}

export function updateText(textObj: TextObject, newText: string): void {
  const displayText = textObj.isVertical ? convertToVerticalText(newText) : newText;
  textObj.set("text", displayText);
}

export function toggleTextOrientation(canvas: Canvas, textObj: TextObject): void {
  const currentText = textObj.isVertical
    ? convertToHorizontalText(textObj.text || "")
    : textObj.text || "";

  textObj.isVertical = !textObj.isVertical;

  const newDisplayText = textObj.isVertical
    ? convertToVerticalText(currentText)
    : currentText;

  textObj.set("text", newDisplayText);
  textObj.set("textAlign", textObj.isVertical ? "center" : "left");

  canvas.renderAll();
}

export function findTextById(canvas: Canvas, textId: string): TextObject | undefined {
  const objects = canvas.getObjects();
  return objects.find(
    (obj) => (obj as TextObject).textId === textId
  ) as TextObject | undefined;
}

export function getAllTexts(canvas: Canvas): TextObject[] {
  const objects = canvas.getObjects();
  return objects.filter((obj) => (obj as TextObject).textId !== undefined) as TextObject[];
}

export function deleteText(canvas: Canvas, textId: string): boolean {
  const textObj = findTextById(canvas, textId);
  if (textObj) {
    canvas.remove(textObj);
    canvas.renderAll();
    return true;
  }
  return false;
}

export function applyTextStyle(textObj: TextObject, style: TextStyle): void {
  if (style.fontSize !== undefined) textObj.set("fontSize", style.fontSize);
  if (style.fontFamily !== undefined) textObj.set("fontFamily", style.fontFamily);
  if (style.fontWeight !== undefined) textObj.set("fontWeight", style.fontWeight);
  if (style.fontStyle !== undefined) textObj.set("fontStyle", style.fontStyle);
  if (style.fill !== undefined) textObj.set("fill", style.fill);
  if (style.textAlign !== undefined && !textObj.isVertical) {
    textObj.set("textAlign", style.textAlign);
  }
}

export const JAPANESE_PUNCTUATION_MAP: Record<string, string> = {
  "。": "︒",
  "、": "︑",
  "「": "﹁",
  "」": "﹂",
  "『": "﹃",
  "』": "﹄",
  "（": "︵",
  "）": "︶",
  "【": "︻",
  "】": "︼",
  "〈": "︿",
  "〉": "﹀",
  "《": "︽",
  "》": "︾",
  "ー": "︱",
  "…": "︙",
};

export function convertPunctuationForVertical(text: string): string {
  let result = text;
  for (const [horizontal, vertical] of Object.entries(JAPANESE_PUNCTUATION_MAP)) {
    result = result.replace(new RegExp(horizontal, "g"), vertical);
  }
  return result;
}
