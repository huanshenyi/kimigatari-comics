"use client";

import { useCallback, useState } from "react";
import { Canvas, FabricObject } from "fabric";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Square,
  MessageSquare,
  Type,
  Image as ImageIcon,
  Layers,
  RefreshCw,
} from "lucide-react";

export interface LayerItem {
  id: string;
  name: string;
  type: "panel" | "bubble" | "text" | "image" | "unknown";
  visible: boolean;
  locked: boolean;
  object: FabricObject;
}

interface LayerPanelProps {
  canvas: Canvas | null;
  layers: LayerItem[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
  onLayerVisibilityToggle: (id: string) => void;
  onLayerLockToggle: (id: string) => void;
  onLayerMoveUp: (id: string) => void;
  onLayerMoveDown: (id: string) => void;
  onLayerDelete: (id: string) => void;
  onRefreshLayers: () => void;
}

function getLayerIcon(type: LayerItem["type"]) {
  switch (type) {
    case "panel":
      return <Square className="w-3.5 h-3.5" />;
    case "bubble":
      return <MessageSquare className="w-3.5 h-3.5" />;
    case "text":
      return <Type className="w-3.5 h-3.5" />;
    case "image":
      return <ImageIcon className="w-3.5 h-3.5" />;
    default:
      return <Layers className="w-3.5 h-3.5" />;
  }
}

function getLayerTypeLabel(type: LayerItem["type"]) {
  switch (type) {
    case "panel":
      return "コマ";
    case "bubble":
      return "吹き出し";
    case "text":
      return "テキスト";
    case "image":
      return "画像";
    default:
      return "オブジェクト";
  }
}

export function LayerPanel({
  canvas,
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerMoveUp,
  onLayerMoveDown,
  onLayerDelete,
  onRefreshLayers,
}: LayerPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Layers className="w-3 h-3" />
          レイヤー
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefreshLayers}
          title="レイヤーを更新"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layers className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              レイヤーがありません
            </p>
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`group flex items-center gap-1.5 p-2 rounded-md border transition-all cursor-pointer ${
                selectedLayerId === layer.id
                  ? "bg-primary/10 border-primary/50"
                  : "border-transparent hover:bg-muted/50 hover:border-border"
              }`}
              onClick={() => onLayerSelect(layer.id)}
            >
              {/* Layer icon */}
              <span
                className={`flex-shrink-0 ${
                  selectedLayerId === layer.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {getLayerIcon(layer.type)}
              </span>

              {/* Layer name */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{layer.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {getLayerTypeLabel(layer.type)}
                </p>
              </div>

              {/* Controls - visible on hover or when selected */}
              <div
                className={`flex items-center gap-0.5 transition-opacity ${
                  selectedLayerId === layer.id
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerVisibilityToggle(layer.id);
                  }}
                  title={layer.visible ? "非表示" : "表示"}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>

                {/* Lock toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerLockToggle(layer.id);
                  }}
                  title={layer.locked ? "ロック解除" : "ロック"}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-[hsl(var(--gold))]" />
                  ) : (
                    <Unlock className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>

                {/* Move up/down */}
                <div className="flex flex-col -space-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerMoveUp(layer.id);
                    }}
                    disabled={index === 0}
                    title="前面へ"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-3 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerMoveDown(layer.id);
                    }}
                    disabled={index === layers.length - 1}
                    title="背面へ"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerDelete(layer.id);
                  }}
                  title="削除"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage layer state from a Fabric.js canvas
 */
export function useLayerManager(canvas: Canvas | null) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const refreshLayers = useCallback(() => {
    if (!canvas) {
      setLayers([]);
      return;
    }

    const objects = canvas.getObjects();
    const layerItems: LayerItem[] = [];

    for (const obj of objects) {
      // Determine layer type and ID
      const panelId = (obj as { panelId?: string }).panelId;
      const bubbleId = (obj as { bubbleId?: string }).bubbleId;
      const textId = (obj as { textId?: string }).textId;
      const imageId = (obj as { imageId?: string }).imageId;

      let type: LayerItem["type"] = "unknown";
      let id = "";
      let name = "";

      if (panelId) {
        type = "panel";
        id = panelId;
        name = `Panel ${panelId.split("-").pop()}`;
      } else if (bubbleId) {
        type = "bubble";
        id = bubbleId;
        name = `Bubble ${bubbleId.split("-").pop()}`;
      } else if (textId) {
        type = "text";
        id = textId;
        const textContent = (obj as { text?: string }).text || "";
        name = textContent.substring(0, 10) || `Text ${textId.split("-").pop()}`;
      } else if (imageId) {
        type = "image";
        id = imageId;
        name = `Image ${imageId.split("-").pop()}`;
      } else {
        // Skip objects without IDs
        continue;
      }

      layerItems.push({
        id,
        name,
        type,
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        object: obj,
      });
    }

    // Reverse to show top layers first
    layerItems.reverse();

    setLayers(layerItems);
  }, [canvas]);

  const selectLayer = useCallback(
    (id: string) => {
      if (!canvas) return;

      setSelectedLayerId(id);
      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        canvas.setActiveObject(layer.object);
        canvas.renderAll();
      }
    },
    [canvas, layers]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      if (!canvas) return;

      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        layer.object.set("visible", !layer.visible);
        canvas.renderAll();
        refreshLayers();
      }
    },
    [canvas, layers, refreshLayers]
  );

  const toggleLock = useCallback(
    (id: string) => {
      if (!canvas) return;

      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        const newLocked = !layer.locked;
        layer.object.set({
          selectable: !newLocked,
          evented: !newLocked,
        });
        canvas.renderAll();
        refreshLayers();
      }
    },
    [canvas, layers, refreshLayers]
  );

  const moveUp = useCallback(
    (id: string) => {
      if (!canvas) return;

      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        canvas.bringObjectForward(layer.object);
        canvas.renderAll();
        refreshLayers();
      }
    },
    [canvas, layers, refreshLayers]
  );

  const moveDown = useCallback(
    (id: string) => {
      if (!canvas) return;

      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        canvas.sendObjectBackwards(layer.object);
        canvas.renderAll();
        refreshLayers();
      }
    },
    [canvas, layers, refreshLayers]
  );

  const deleteLayer = useCallback(
    (id: string) => {
      if (!canvas) return;

      const layer = layers.find((l) => l.id === id);
      if (layer && layer.object) {
        canvas.remove(layer.object);
        canvas.renderAll();
        refreshLayers();
        if (selectedLayerId === id) {
          setSelectedLayerId(null);
        }
      }
    },
    [canvas, layers, refreshLayers, selectedLayerId]
  );

  return {
    layers,
    selectedLayerId,
    refreshLayers,
    selectLayer,
    toggleVisibility,
    toggleLock,
    moveUp,
    moveDown,
    deleteLayer,
  };
}
