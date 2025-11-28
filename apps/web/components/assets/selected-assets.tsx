"use client";

import { Plus, X } from "lucide-react";

interface Asset {
  key: string;
  url: string;
  name?: string;
}

interface SelectedAssetsProps {
  assets: Asset[];
  onRemove: (key: string) => void;
  onAdd: () => void;
  maxItems?: number;
}

export function SelectedAssets({
  assets,
  onRemove,
  onAdd,
  maxItems = 5,
}: SelectedAssetsProps) {
  const canAdd = assets.length < maxItems;

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) => (
        <div
          key={asset.key}
          className="relative group w-12 h-12 rounded overflow-hidden border border-border"
        >
          <img
            src={asset.url}
            alt={asset.name || asset.key}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onRemove(asset.key)}
            className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          onClick={onAdd}
          className="w-12 h-12 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
