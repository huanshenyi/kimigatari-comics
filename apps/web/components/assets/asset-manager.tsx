"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Image as ImageIcon,
  Users,
  Mountain,
  History,
  Trash2,
  Search,
  Grid,
  List,
  Check,
  Loader2,
  FolderOpen,
} from "lucide-react";
import {
  listAssets as listAssetsAction,
  uploadAsset as uploadAssetAction,
  deleteAsset as deleteAssetAction,
} from "@/app/actions";

type AssetType = "generated" | "character" | "background" | "reference";

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  type?: AssetType;
  name?: string;
}

interface AssetManagerProps {
  projectId?: string;
  onAssetSelect?: (asset: Asset) => void;
  selectionMode?: boolean;
}

const assetCategories: Array<{
  id: AssetType;
  label: string;
  icon: typeof ImageIcon;
  description: string;
}> = [
  {
    id: "generated",
    label: "生成履歴",
    icon: History,
    description: "AI生成画像の履歴",
  },
  {
    id: "character",
    label: "キャラクター",
    icon: Users,
    description: "キャラクター参照画像",
  },
  {
    id: "background",
    label: "背景",
    icon: Mountain,
    description: "シーン背景素材",
  },
  {
    id: "reference",
    label: "参照素材",
    icon: ImageIcon,
    description: "その他の参照画像",
  },
];

export function AssetManager({
  projectId,
  onAssetSelect,
  selectionMode = false,
}: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AssetType | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load assets via Server Action
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAssetsAction({
        type: selectedCategory || undefined,
        projectId: projectId || undefined,
      });

      if (result.success && result.assets) {
        setAssets(
          result.assets.map((a: Asset) => ({
            ...a,
            lastModified: new Date(a.lastModified),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, projectId]);

  // Handle file upload via Server Action
  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !selectedCategory) return;

      setIsUploading(true);

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", selectedCategory);
          if (projectId) {
            formData.append("projectId", projectId);
          }

          const result = await uploadAssetAction(formData);

          if (result.success && result.key && result.url) {
            setAssets((prev) => [
              {
                key: result.key,
                url: result.url,
                size: result.size || 0,
                lastModified: new Date(),
                type: selectedCategory,
                name: file.name,
              },
              ...prev,
            ]);
          } else {
            console.error("Upload failed:", result.error);
          }
        } catch (error) {
          console.error("Upload failed:", error);
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [selectedCategory, projectId]
  );

  // Handle delete via Server Action
  const handleDelete = useCallback(async (asset: Asset) => {
    if (!confirm("この素材を削除しますか？")) return;

    try {
      const result = await deleteAssetAction(asset.key);

      if (result.success) {
        setAssets((prev) => prev.filter((a) => a.key !== asset.key));
        if (selectedAsset?.key === asset.key) {
          setSelectedAsset(null);
        }
      } else {
        console.error("Delete failed:", result.error);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [selectedAsset]);

  // Filter assets by search
  const filteredAssets = assets.filter((asset) => {
    if (!searchQuery) return true;
    const name = asset.name || asset.key.split("/").pop() || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="paper-card rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="headline-editorial text-lg mb-1">素材ライブラリ</h2>
        <p className="text-xs text-muted-foreground">
          キャラクター・背景・エフェクト素材を管理
        </p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Category Sidebar */}
        <div className="w-48 border-r border-border/50 p-3 space-y-1">
          {assetCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setAssets([]);
                setTimeout(loadAssets, 0);
              }}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedCategory === category.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <category.icon
                  className={`w-4 h-4 ${
                    selectedCategory === category.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="text-sm font-medium">{category.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-6">
                {category.description}
              </p>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedCategory ? (
            <>
              {/* Toolbar */}
              <div className="p-3 border-b border-border/50 flex items-center gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="素材を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* View toggle */}
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  アップロード
                </Button>
              </div>

              {/* Asset Grid/List */}
              <div className="flex-1 overflow-auto p-3">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      まだ素材がありません
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      「アップロード」ボタンで素材を追加してください
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      素材をアップロード
                    </Button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-3 gap-3">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.key}
                        onClick={() => {
                          if (selectionMode && onAssetSelect) {
                            onAssetSelect(asset);
                          } else {
                            setSelectedAsset(asset);
                          }
                        }}
                        className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                          selectedAsset?.key === asset.key
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
                            <p className="text-xs text-muted-foreground">
                              {formatSize(asset.size)}
                            </p>
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {/* Selection indicator */}
                        {selectionMode && selectedAsset?.key === asset.key && (
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAssets.map((asset) => (
                      <div
                        key={asset.key}
                        onClick={() => {
                          if (selectionMode && onAssetSelect) {
                            onAssetSelect(asset);
                          } else {
                            setSelectedAsset(asset);
                          }
                        }}
                        className={`group flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                          selectedAsset?.key === asset.key
                            ? "ring-2 ring-primary border-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={asset.url}
                            alt={asset.name || asset.key}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {asset.name || asset.key.split("/").pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(asset.size)} •{" "}
                            {asset.lastModified.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset);
                          }}
                          className="w-8 h-8 rounded flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  左のカテゴリから素材を選択してください
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
