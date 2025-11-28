"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "fabric";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Move,
  Square,
  Type,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Trash2,
  Plus,
  Layers,
  Grip,
  Settings2,
  MousePointer2,
} from "lucide-react";
import type { Page } from "@kimigatari/types";
import {
  initializeCanvas,
  createCanvasManager,
  createPanel,
  createBubble,
  createText,
  saveToUndo,
  undo,
  redo,
  setZoom,
  getZoom,
  exportToDataURL,
  deleteSelectedObjects,
  addPage,
  loadPageState,
  type CanvasManager,
  type ToolType,
  type BubbleType,
  DEFAULT_CANVAS_CONFIG,
} from "@kimigatari/canvas";
import { LayerPanel, useLayerManager } from "./layer-panel";

interface MangaEditorProps {
  pages: Page[];
}

export function MangaEditor({ pages: initialPages }: MangaEditorProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const managerRef = useRef<CanvasManager | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [zoom, setZoomState] = useState(100);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(initialPages.length || 1);
  const [bubbleType, setBubbleType] = useState<BubbleType>("normal");
  const [showLayerPanel, setShowLayerPanel] = useState(true);

  // Layer management
  const {
    layers,
    selectedLayerId,
    refreshLayers,
    selectLayer,
    toggleVisibility,
    toggleLock,
    moveUp,
    moveDown,
    deleteLayer,
  } = useLayerManager(fabricCanvasRef.current);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = initializeCanvas(canvasRef.current, DEFAULT_CANVAS_CONFIG);
    fabricCanvasRef.current = canvas;

    const manager = createCanvasManager(canvas, DEFAULT_CANVAS_CONFIG);
    managerRef.current = manager;

    // Set up selection events
    canvas.on("selection:created", (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        const id =
          (selected as { panelId?: string }).panelId ||
          (selected as { bubbleId?: string }).bubbleId ||
          (selected as { textId?: string }).textId;
        setSelectedElement(id || null);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedElement(null);
    });

    // Refresh layers when objects are added/removed/modified
    canvas.on("object:added", () => {
      setTimeout(refreshLayers, 0);
    });
    canvas.on("object:removed", () => {
      setTimeout(refreshLayers, 0);
    });

    // Load initial page data
    if (initialPages.length > 0 && initialPages[0]?.layoutData) {
      initialPages[0].layoutData.forEach((layout, index) => {
        createPanel(
          canvas,
          layout.position,
          `panel-${index}`,
          layout.panelOrder
        );
      });
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      managerRef.current = null;
    };
  }, []);

  // Handle tool actions
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = fabricCanvasRef.current;
      const manager = managerRef.current;
      if (!canvas || !manager) return;

      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (activeTool === "panel") {
        saveToUndo(manager);
        const panelId = `panel-${Date.now()}`;
        createPanel(
          canvas,
          { x, y, width: 150, height: 200 },
          panelId,
          canvas.getObjects().length
        );
      } else if (activeTool === "bubble") {
        saveToUndo(manager);
        const bubbleId = `bubble-${Date.now()}`;
        createBubble(
          canvas,
          { x, y, width: 100, height: 60 },
          bubbleId,
          bubbleType,
          ""
        );
      } else if (activeTool === "text") {
        saveToUndo(manager);
        const textId = `text-${Date.now()}`;
        createText(canvas, "テキスト", x, y, textId, true);
      }
    },
    [activeTool, bubbleType]
  );

  // Zoom handlers
  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const newZoom = Math.min(zoom + 10, 200);
    setZoomState(newZoom);
    setZoom(canvas, newZoom / 100);
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const newZoom = Math.max(zoom - 10, 50);
    setZoomState(newZoom);
    setZoom(canvas, newZoom / 100);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    const manager = managerRef.current;
    if (manager) {
      undo(manager);
    }
  };

  const handleRedo = () => {
    const manager = managerRef.current;
    if (manager) {
      redo(manager);
    }
  };

  // Delete handler
  const handleDelete = () => {
    const canvas = fabricCanvasRef.current;
    const manager = managerRef.current;
    if (canvas && manager) {
      saveToUndo(manager);
      deleteSelectedObjects(canvas);
      setSelectedElement(null);
    }
  };

  // Page navigation
  const handlePrevPage = () => {
    const manager = managerRef.current;
    if (manager && currentPage > 0) {
      loadPageState(manager, currentPage - 1);
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const manager = managerRef.current;
    if (manager && currentPage < totalPages - 1) {
      loadPageState(manager, currentPage + 1);
      setCurrentPage(currentPage + 1);
    }
  };

  const handleAddPage = () => {
    const manager = managerRef.current;
    if (manager) {
      const newIndex = addPage(manager);
      setTotalPages(manager.pages.length);
      loadPageState(manager, newIndex);
      setCurrentPage(newIndex);
    }
  };

  // Export handler
  const handleExport = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = exportToDataURL(canvas, "png");
    const link = document.createElement("a");
    link.download = `manga-page-${currentPage + 1}.png`;
    link.href = dataURL;
    link.click();
  };

  const tools = [
    { id: "select" as ToolType, icon: MousePointer2, label: "選択 (V)" },
    { id: "panel" as ToolType, icon: Square, label: "コマ (P)" },
    { id: "bubble" as ToolType, icon: MessageSquare, label: "吹き出し (B)" },
    { id: "text" as ToolType, icon: Type, label: "テキスト (T)" },
  ];

  const bubbleTypes: { id: BubbleType; label: string }[] = [
    { id: "normal", label: "通常" },
    { id: "shout", label: "叫び" },
    { id: "thought", label: "思考" },
    { id: "narration", label: "ナレーション" },
    { id: "whisper", label: "ささやき" },
  ];

  return (
    <div className="flex gap-3 h-[calc(100vh-140px)]">
      {/* Left Toolbar */}
      <div className="w-14 flex-shrink-0 paper-card rounded-lg p-2 flex flex-col gap-1">
        {/* Tool buttons */}
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="icon"
            className={`w-10 h-10 ${
              activeTool === tool.id ? "glow-accent" : ""
            }`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}

        <div className="h-px bg-border my-2" />

        {/* History */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={handleUndo}
          title="元に戻す (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={handleRedo}
          title="やり直し (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="h-px bg-border my-2" />

        {/* Zoom */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={handleZoomIn}
          title="ズームイン"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={handleZoomOut}
          title="ズームアウト"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={!selectedElement}
          title="削除 (Delete)"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Layer panel toggle */}
        <Button
          variant={showLayerPanel ? "default" : "ghost"}
          size="icon"
          className="w-10 h-10"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          title="レイヤーパネル"
        >
          <Layers className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 paper-card rounded-lg overflow-hidden flex flex-col">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/50">
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={handleAddPage}
              title="ページを追加"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom & Export */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center bg-muted/20 overflow-auto p-8"
          onClick={activeTool !== "select" ? handleCanvasClick : undefined}
        >
          <div className="shadow-dramatic rounded manga-frame bg-[hsl(var(--washi))]">
            <canvas ref={canvasRef} style={{ imageRendering: "crisp-edges" }} />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-auto">
        {/* Page Thumbnails */}
        <div className="paper-card rounded-lg p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Grip className="w-3 h-3" />
            ページ一覧
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`aspect-[3/4] rounded border-2 overflow-hidden transition-all ${
                  index === currentPage
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  const manager = managerRef.current;
                  if (manager) {
                    loadPageState(manager, index);
                    setCurrentPage(index);
                    setTimeout(refreshLayers, 0);
                  }
                }}
              >
                <div className="w-full h-full bg-[hsl(var(--washi))] flex items-center justify-center text-xs text-muted-foreground font-medium">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Layer Panel */}
        {showLayerPanel && (
          <div className="paper-card rounded-lg flex-1 min-h-0 overflow-hidden">
            <LayerPanel
              canvas={fabricCanvasRef.current}
              layers={layers}
              selectedLayerId={selectedLayerId}
              onLayerSelect={selectLayer}
              onLayerVisibilityToggle={toggleVisibility}
              onLayerLockToggle={toggleLock}
              onLayerMoveUp={moveUp}
              onLayerMoveDown={moveDown}
              onLayerDelete={deleteLayer}
              onRefreshLayers={refreshLayers}
            />
          </div>
        )}

        {/* Bubble Type Selection */}
        {activeTool === "bubble" && (
          <div className="paper-card rounded-lg p-3">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              吹き出しタイプ
            </h3>
            <div className="space-y-1">
              {bubbleTypes.map((type) => (
                <button
                  key={type.id}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    bubbleType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setBubbleType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Properties Panel */}
        <div className="paper-card rounded-lg p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Settings2 className="w-3 h-3" />
            プロパティ
          </h3>
          {selectedElement ? (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">選択中: </span>
                <span className="font-medium">{selectedElement}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 mr-2" />
                削除
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              要素を選択してください
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
