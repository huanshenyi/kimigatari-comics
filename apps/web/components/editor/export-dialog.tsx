"use client";

import { useState, useMemo } from "react";
import { FileDown, FileImage, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageRow } from "@kimigatari/db";
import {
  exportToPdf,
  exportToPngZip,
  downloadBlob,
  type ExportPage,
} from "@/lib/export-utils";

type ExportFormat = "pdf" | "png";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: PageRow[];
  projectTitle: string;
  currentPageIndex: number;
  getCurrentPageDataUrl: () => string | null;
}

export function ExportDialog({
  open,
  onOpenChange,
  pages,
  projectTitle,
  currentPageIndex,
  getCurrentPageDataUrl,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(pages.length);
  const [isExporting, setIsExporting] = useState(false);

  // ページ番号オプションを生成
  const pageOptions = useMemo(() => {
    return pages.map((_, i) => i + 1);
  }, [pages]);

  // 範囲が変更されたときに調整
  const handleStartChange = (value: string) => {
    const start = parseInt(value, 10);
    setPageRangeStart(start);
    if (start > pageRangeEnd) {
      setPageRangeEnd(start);
    }
  };

  const handleEndChange = (value: string) => {
    const end = parseInt(value, 10);
    setPageRangeEnd(end);
    if (end < pageRangeStart) {
      setPageRangeStart(end);
    }
  };

  // エクスポート実行
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 選択されたページを収集
      const selectedPages = pages.filter(
        (_, i) => i + 1 >= pageRangeStart && i + 1 <= pageRangeEnd
      );

      const exportPages: ExportPage[] = selectedPages.map((page, i) => {
        const pageIndex = pages.indexOf(page);
        const isCurrentPage = pageIndex === currentPageIndex;

        // layout_data から imageUrl を取得
        const layoutData = page.layout_data as Array<{ imageUrl?: string }> | null;
        const imageUrl = layoutData?.[0]?.imageUrl;

        return {
          pageNumber: page.page_number,
          imageUrl: isCurrentPage ? undefined : imageUrl,
          dataUrl: isCurrentPage ? (getCurrentPageDataUrl() || undefined) : undefined,
        };
      });

      // フィルタ: 画像がないページを除外
      const validPages = exportPages.filter((p) => p.imageUrl || p.dataUrl);

      if (validPages.length === 0) {
        alert("エクスポートできるページがありません。ページに画像が含まれていることを確認してください。");
        return;
      }

      const safeTitle = projectTitle.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]/g, "_") || "manga";

      if (format === "pdf") {
        const blob = await exportToPdf(validPages, safeTitle);
        downloadBlob(blob, `${safeTitle}.pdf`);
      } else {
        const blob = await exportToPngZip(validPages, safeTitle);
        downloadBlob(blob, `${safeTitle}.zip`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            ダウンロード
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ファイル形式 */}
          <div className="space-y-3">
            <Label>ファイルの種類</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label htmlFor="format-pdf" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    <span>PDF（標準）</span>
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      推奨
                    </span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="png" id="format-png" />
                <Label htmlFor="format-png" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    <span>PNG（ZIP圧縮）</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* ページ選択 */}
          <div className="space-y-3">
            <Label>ページを選択</Label>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageRangeStart)}
                onValueChange={handleStartChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}ページ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">〜</span>
              <Select
                value={String(pageRangeEnd)}
                onValueChange={handleEndChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageOptions.map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}ページ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {pageRangeEnd - pageRangeStart + 1}ページを出力します
            </p>
          </div>
        </div>

        {/* ダウンロードボタン */}
        <Button
          onClick={handleExport}
          disabled={isExporting || pages.length === 0}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              エクスポート中...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              ダウンロード
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
