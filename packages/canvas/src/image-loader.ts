import { Canvas, FabricImage, Rect, filters } from "fabric";
import type { Object as FabricObject } from "fabric";

export interface LoadedImage {
  id: string;
  image: FabricImage;
  originalWidth: number;
  originalHeight: number;
}

interface ImageWithId extends FabricObject {
  imageId?: string;
}

export async function loadImageFromURL(
  canvas: Canvas,
  url: string,
  imageId: string,
  options?: {
    x?: number;
    y?: number;
    scaleToFit?: { width: number; height: number };
    selectable?: boolean;
  }
): Promise<LoadedImage> {
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });

  const originalWidth = img.width || 0;
  const originalHeight = img.height || 0;

  if (options?.scaleToFit) {
    const scaleX = options.scaleToFit.width / originalWidth;
    const scaleY = options.scaleToFit.height / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    img.scale(scale);
  }

  img.set({
    left: options?.x || 0,
    top: options?.y || 0,
    selectable: options?.selectable !== false,
  });

  (img as unknown as ImageWithId).imageId = imageId;

  canvas.add(img);
  canvas.renderAll();

  return {
    id: imageId,
    image: img,
    originalWidth,
    originalHeight,
  };
}

export async function loadImageFromFile(
  canvas: Canvas,
  file: File,
  imageId: string,
  options?: {
    x?: number;
    y?: number;
    scaleToFit?: { width: number; height: number };
    selectable?: boolean;
  }
): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("Failed to read file"));
        return;
      }

      try {
        const loadedImage = await loadImageFromURL(canvas, dataUrl, imageId, options);
        resolve(loadedImage);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

export function findImageById(
  canvas: Canvas,
  imageId: string
): FabricImage | undefined {
  const objects = canvas.getObjects();
  return objects.find(
    (obj) => (obj as unknown as ImageWithId).imageId === imageId
  ) as FabricImage | undefined;
}

export function deleteImage(canvas: Canvas, imageId: string): boolean {
  const image = findImageById(canvas, imageId);
  if (image) {
    canvas.remove(image);
    canvas.renderAll();
    return true;
  }
  return false;
}

export function fitImageToPanel(
  image: FabricImage,
  panelBounds: { x: number; y: number; width: number; height: number },
  padding: number = 0
): void {
  const imageWidth = image.width || 0;
  const imageHeight = image.height || 0;

  const availableWidth = panelBounds.width - padding * 2;
  const availableHeight = panelBounds.height - padding * 2;

  const scaleX = availableWidth / imageWidth;
  const scaleY = availableHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);

  image.scale(scale);

  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  image.set({
    left: panelBounds.x + (panelBounds.width - scaledWidth) / 2,
    top: panelBounds.y + (panelBounds.height - scaledHeight) / 2,
  });

  image.setCoords();
}

export function clipImageToPanel(
  canvas: Canvas,
  image: FabricImage,
  panelBounds: { x: number; y: number; width: number; height: number }
): void {
  image.set({
    clipPath: new Rect({
      left: panelBounds.x - (image.left || 0),
      top: panelBounds.y - (image.top || 0),
      width: panelBounds.width,
      height: panelBounds.height,
      absolutePositioned: true,
    }),
  });

  canvas.renderAll();
}

export function applyGrayscaleFilter(image: FabricImage): void {
  const imageFilters = image.filters || [];
  imageFilters.push(new filters.Grayscale());
  image.filters = imageFilters;
  image.applyFilters();
}

export function applyContrastFilter(image: FabricImage, contrast: number): void {
  const imageFilters = image.filters || [];
  imageFilters.push(new filters.Contrast({ contrast }));
  image.filters = imageFilters;
  image.applyFilters();
}

export function clearImageFilters(image: FabricImage): void {
  image.filters = [];
  image.applyFilters();
}
