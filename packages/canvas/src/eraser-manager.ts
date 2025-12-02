import type { Canvas, FabricObject } from "fabric";
import { EraserBrush } from "@erase2d/fabric";

/**
 * 消しゴムブラシを初期化
 */
export function initializeEraser(canvas: Canvas, width: number = 20): EraserBrush {
  const eraser = new EraserBrush(canvas);
  eraser.width = width;
  eraser.color = "#ffffff"; // 消しゴムの色（実際には透明になる）
  return eraser;
}

/**
 * 消しゴムモードを開始
 */
export function startErasing(canvas: Canvas, eraser: EraserBrush): void {
  canvas.freeDrawingBrush = eraser;
  canvas.isDrawingMode = true;
}

/**
 * 消しゴムモードを終了
 */
export function stopErasing(canvas: Canvas): void {
  canvas.isDrawingMode = false;
}

/**
 * 消しゴムのサイズを設定
 */
export function setEraserSize(eraser: EraserBrush, size: number): void {
  eraser.width = size;
}

/**
 * 消しゴムを復元モードに切り替え
 * @param eraser - EraserBrush インスタンス
 * @param inverted - true で復元モード、false で消去モード
 */
export function setEraserInverted(eraser: EraserBrush, inverted: boolean): void {
  eraser.inverted = inverted;
}

/**
 * キャンバス上のオブジェクトを消しゴムで消せるように設定
 */
export function setObjectErasable(obj: FabricObject, erasable: boolean = true): void {
  (obj as FabricObject & { erasable?: boolean }).erasable = erasable;
}

/**
 * キャンバス上の全画像を消しゴムで消せるように設定
 */
export function setAllImagesErasable(canvas: Canvas, erasable: boolean = true): void {
  const objects = canvas.getObjects();
  objects.forEach((obj) => {
    if (obj.type === "image") {
      setObjectErasable(obj, erasable);
    }
  });
}

export { EraserBrush };
