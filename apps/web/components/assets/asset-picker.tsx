"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Loader2,
  Check,
  Upload,
  FolderOpen,
} from "lucide-react";

type AssetType = "character" | "background" | "effect" | "reference";

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  type?: AssetType;
  name?: string;
}

interface AssetPickerProps {
  type: AssetType;
  onSelect: (asset: Asset) => void;
  onClose: () => void;
  selectedKeys?: string[];
  title?: string;
}

const typeLabels: Record<AssetType, string> = {
  character: "キャラクター",
  background: "背景",
  effect: "エフェクト",
  reference: "参照素材",
};

export function AssetPicker({
  type,
  onSelect,
  onClose,
  selectedKeys = [],
  title,
}: AssetPickerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("type", type);

        const response = await fetch(
          `http://localhost:4111/assets?${params.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setAssets(
            data.assets.map((a: Asset) => ({
              ...a,
              lastModified: new Date(a.lastModified),
              type,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, [type]);

  // Filter assets by search
  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery) return true;
    const name = asset.name || asset.key.split("/").pop() || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = useCallback(
    (asset: Asset) => {
      onSelect(asset);
    },
    [onSelect]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium">
            {title || `${typeLabels[type]}を選択`}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="素材を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery
                  ? "検索結果がありません"
                  : `${typeLabels[type]}素材がまだありません`}
              </p>
              <p className="text-xs text-muted-foreground">
                素材管理から追加してください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedKeys.includes(asset.key);
                return (
                  <button
                    key={asset.key}
                    onClick={() => handleSelect(asset)}
                    className={`group relative aspect-square rounded-lg border overflow-hidden transition-all ${
                      isSelected
                        ? "ring-2 ring-primary border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={asset.url}
                      alt={asset.name || asset.key}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-medium truncate">
                          {asset.name || asset.key.split("/").pop()}
                        </p>
                      </div>
                    </div>
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}
