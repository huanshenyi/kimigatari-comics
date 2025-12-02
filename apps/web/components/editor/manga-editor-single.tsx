"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "fabric";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Square,
  Type,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  Settings2,
  MousePointer2,
  Eraser,
} from "lucide-react";
import type { PageRow } from "@kimigatari/db";
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
  deleteSelectedObjects,
  loadImageFromURL,
  fitImageToPanel,
  exportToDataURL,
  initializeEraser,
  startErasing,
  stopErasing,
  setEraserSize,
  setEraserInverted,
  setAllImagesErasable,
  type CanvasManager,
  type ToolType,
  type BubbleType,
  DEFAULT_CANVAS_CONFIG,
  EraserBrush,
} from "@kimigatari/canvas";
import { LayerPanel, useLayerManager } from "./layer-panel";

// エクスポート用のハンドル型
export interface MangaEditorHandle {
  exportCanvas: () => string | null;
}

interface MangaEditorSingleProps {
  page: PageRow;
  onPageUpdate?: (updates: Partial<PageRow>) => void;
}

export const MangaEditorSingle = forwardRef<MangaEditorHandle, MangaEditorSingleProps>(
  function MangaEditorSingle({ page, onPageUpdate }, ref) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const eraserRef = useRef<EraserBrush | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [zoom, setZoomState] = useState(100);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [bubbleType, setBubbleType] = useState<BubbleType>("normal");
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [eraserSize, setEraserSizeState] = useState(20);
  const [isEraserInverted, setIsEraserInverted] = useState(false);

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

    // Refresh layers when objects are added/removed
    canvas.on("object:added", () => {
      setTimeout(refreshLayers, 0);
    });
    canvas.on("object:removed", () => {
      setTimeout(refreshLayers, 0);
    });

    // Initialize eraser
    const eraser = initializeEraser(canvas, 20);
    eraserRef.current = eraser;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      managerRef.current = null;
      eraserRef.current = null;
    };
  }, [refreshLayers]);

  // 親から呼び出し可能なメソッドを公開
  useImperativeHandle(ref, () => ({
    exportCanvas: () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      return exportToDataURL(canvas, "png");
    },
  }), []);

  // Load page data when page changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !page) return;

    // Clear existing objects
    canvas.clear();
    canvas.backgroundColor = "#ffffff";

    // Load layout data
    const layoutData = page.layout_data as Array<{
      position: { x: number; y: number; width: number; height: number };
      panelOrder: number;
      imageUrl?: string;
    }> | null;

    if (layoutData && Array.isArray(layoutData)) {
      (async () => {
        for (const [index, layout] of layoutData.entries()) {
          // Load and display image if available (no panel frame needed for single-page manga)
          if (layout.imageUrl) {
            try {
              const loadedImage = await loadImageFromURL(
                canvas,
                layout.imageUrl,
                `image-${index}`,
                { selectable: true }
              );
              // Position the image
              loadedImage.image.set({
                left: layout.position.x,
                top: layout.position.y,
              });
              fitImageToPanel(loadedImage.image, layout.position);
            } catch (error) {
              console.error(`Failed to load image for panel ${index}:`, error);
            }
          }
        }
        canvas.renderAll();
        refreshLayers();
      })();
    }
  }, [page, refreshLayers]);

  // Handle eraser tool activation/deactivation
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const eraser = eraserRef.current;
    if (!canvas) return;

    if (activeTool === "eraser" && eraser) {
      // 画像を消しゴムで消せるように設定
      setAllImagesErasable(canvas, true);
      startErasing(canvas, eraser);
    } else {
      stopErasing(canvas);
    }
  }, [activeTool]);

  // Handle eraser size change
  const handleEraserSizeChange = useCallback((size: number) => {
    setEraserSizeState(size);
    if (eraserRef.current) {
      setEraserSize(eraserRef.current, size);
    }
  }, []);

  // Handle eraser mode toggle (erase / restore)
  const handleEraserModeToggle = useCallback((inverted: boolean) => {
    setIsEraserInverted(inverted);
    if (eraserRef.current) {
      setEraserInverted(eraserRef.current, inverted);
    }
  }, []);

  // Handle mouse down to track position for drag detection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Handle tool actions
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Check if mouse moved significantly (drag detection)
      if (mouseDownPosRef.current) {
        const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
        if (dx > 5 || dy > 5) {
          mouseDownPosRef.current = null;
          return;
        }
      }
      mouseDownPosRef.current = null;

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
  const handleDelete = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const manager = managerRef.current;
    if (canvas && manager) {
      saveToUndo(manager);
      deleteSelectedObjects(canvas);
      setSelectedElement(null);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElement) {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, handleDelete]);

  const tools = [
    { id: "select" as ToolType, icon: MousePointer2, label: "選択 (V)" },
    { id: "panel" as ToolType, icon: Square, label: "枠 (P)" },
    { id: "bubble" as ToolType, icon: MessageSquare, label: "吹き出し (B)" },
    { id: "text" as ToolType, icon: Type, label: "テキスト (T)" },
    { id: "eraser" as ToolType, icon: Eraser, label: "消しゴム (E)" },
  ];

  const bubbleTypes: { id: BubbleType; label: string }[] = [
    { id: "normal", label: "通常" },
    { id: "shout", label: "叫び" },
    { id: "thought", label: "思考" },
    { id: "narration", label: "ナレーション" },
    { id: "whisper", label: "ささやき" },
  ];

  return (
    <div className="flex gap-3 h-full p-3">
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
          <span className="text-sm font-medium">
            ページ {page.page_number}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {zoom}%
          </span>
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-start bg-muted/20 overflow-auto p-8"
          onMouseDown={handleMouseDown}
          onClick={activeTool !== "select" ? handleCanvasClick : undefined}
        >
          <div className="shadow-dramatic rounded manga-frame bg-[hsl(var(--washi))] m-auto">
            <canvas ref={canvasRef} style={{ imageRendering: "crisp-edges" }} />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-3 overflow-auto">
        {/* Layer Panel */}
        {showLayerPanel && (
          <div className="paper-card rounded-lg flex-1 min-h-[200px] max-h-[300px] overflow-auto">
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

        {/* Eraser Settings */}
        {activeTool === "eraser" && (
          <div className="paper-card rounded-lg p-3">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Eraser className="w-3 h-3" />
              消しゴム設定
            </h3>
            <div className="space-y-3">
              {/* Mode Toggle */}
              <div className="flex gap-1">
                <button
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    !isEraserInverted
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleEraserModeToggle(false)}
                >
                  消す
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    isEraserInverted
                      ? "bg-green-600 text-white"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleEraserModeToggle(true)}
                >
                  復元
                </button>
              </div>

              {/* Size Slider */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">サイズ:</span>
                  <span className="font-medium">{eraserSize}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={eraserSize}
                  onChange={(e) => handleEraserSizeChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {isEraserInverted
                  ? "消した部分をドラッグで復元"
                  : "画像の上をドラッグして消去"}
              </p>
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
});
