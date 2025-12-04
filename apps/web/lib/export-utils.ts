import { jsPDF } from "jspdf";
import JSZip from "jszip";

// マンガページのサイズ（B5相当: 182mm x 257mm）
const PAGE_WIDTH_MM = 182;
const PAGE_HEIGHT_MM = 257;

/**
 * 画像URLからDataURLを取得
 */
async function imageUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * DataURLからBlobを取得
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64 || "");
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export interface ExportPage {
  pageNumber: number;
  imageUrl?: string;
  dataUrl?: string; // 現在編集中のページ用
}

/**
 * 複数ページからPDFを生成
 */
export async function exportToPdf(
  pages: ExportPage[],
  title: string,
  options?: { quality?: number }
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
  });

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  for (let i = 0; i < sortedPages.length; i++) {
    const page = sortedPages[i];
    if (!page) continue;

    if (i > 0) {
      pdf.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM]);
    }

    let dataUrl: string;
    if (page.dataUrl) {
      dataUrl = page.dataUrl;
    } else if (page.imageUrl) {
      dataUrl = await imageUrlToDataUrl(page.imageUrl);
    } else {
      continue;
    }

    // 画像をページ全体に配置
    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      0,
      PAGE_WIDTH_MM,
      PAGE_HEIGHT_MM,
      undefined,
      "FAST"
    );
  }

  return pdf.output("blob");
}

/**
 * 複数ページからZIPを生成
 */
export async function exportToPngZip(
  pages: ExportPage[],
  title: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(title) || zip;

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  for (const page of sortedPages) {
    if (!page) continue;

    let dataUrl: string;
    if (page.dataUrl) {
      dataUrl = page.dataUrl;
    } else if (page.imageUrl) {
      dataUrl = await imageUrlToDataUrl(page.imageUrl);
    } else {
      continue;
    }

    const blob = dataUrlToBlob(dataUrl);
    const filename = `${title}-page-${String(page.pageNumber).padStart(3, "0")}.png`;
    folder.file(filename, blob);
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * Blobをダウンロード
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
