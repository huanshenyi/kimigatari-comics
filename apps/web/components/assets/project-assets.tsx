"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Loader2,
  Users,
  Mountain,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";
import { AssetManager } from "./asset-manager";
import {
  getProjectAssetsAction,
  removeAssetFromProjectAction,
  addAssetToProjectAction,
  getAssetByKeyAction,
} from "@/app/actions";

type AssetRole = "character" | "background" | "reference";

interface ProjectAsset {
  id: string;
  user_id: string | null;
  type: string;
  name: string;
  s3_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  role: AssetRole | null;
  display_order: number;
}

interface ProjectAssetsProps {
  projectId: string;
}

const roleConfig: Record<AssetRole, { label: string; icon: typeof Users }> = {
  character: { label: "キャラクター", icon: Users },
  background: { label: "背景", icon: Mountain },
  reference: { label: "参照", icon: ImageIcon },
};

export function ProjectAssets({ projectId }: ProjectAssetsProps) {
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Load project assets
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getProjectAssetsAction(projectId);
      if (result.success && result.assets) {
        setAssets(result.assets as ProjectAsset[]);
      }
    } catch (error) {
      console.error("Failed to load project assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Remove asset from project
  const handleRemove = useCallback(
    async (assetId: string) => {
      if (!confirm("このプロジェクトから素材を削除しますか？")) return;

      setRemovingId(assetId);
      try {
        const result = await removeAssetFromProjectAction(projectId, assetId);
        if (result.success) {
          setAssets((prev) => prev.filter((a) => a.id !== assetId));
        }
      } catch (error) {
        console.error("Failed to remove asset:", error);
      } finally {
        setRemovingId(null);
      }
    },
    [projectId]
  );

  // Handle asset selection from picker
  const handleAssetSelect = useCallback(
    async (asset: { key: string; url: string; type?: string }) => {
      try {
        // Get asset ID from s3_key
        const assetResult = await getAssetByKeyAction(asset.key);
        if (!assetResult.success || !assetResult.asset) {
          console.error("Asset not found:", asset.key);
          return;
        }

        // Determine role from asset type
        // "generated" is not a valid AssetRole, so map it to undefined
        const validRoles = ["character", "background", "reference"];
        const role = asset.type && validRoles.includes(asset.type)
          ? (asset.type as AssetRole)
          : undefined;

        // Add asset to project
        const result = await addAssetToProjectAction(
          projectId,
          assetResult.asset.id,
          role
        );

        if (result.success) {
          setIsAddModalOpen(false);
          await loadAssets();
        } else {
          console.error("Failed to add asset:", result.error);
        }
      } catch (error) {
        console.error("Failed to add asset:", error);
      }
    },
    [projectId, loadAssets]
  );

  // Get public URL for an asset
  const getAssetUrl = (asset: ProjectAsset) => {
    // Construct URL from s3_key
    const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000/kimigatari-assets";
    return `${baseUrl}/${asset.s3_key}`;
  };

  // Group assets by role
  const groupedAssets = assets.reduce(
    (acc, asset) => {
      const role = asset.role || "reference";
      if (!acc[role]) acc[role] = [];
      acc[role].push(asset);
      return acc;
    },
    {} as Record<AssetRole, ProjectAsset[]>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">プロジェクト素材</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            追加
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          このプロジェクトで使用する素材
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">
              まだ素材がありません
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              「追加」ボタンから素材を選択してください
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              素材を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(roleConfig) as AssetRole[]).map((role) => {
              const roleAssets = groupedAssets[role] || [];
              if (roleAssets.length === 0) return null;

              const config = roleConfig[role];
              const Icon = config.icon;

              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({roleAssets.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {roleAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="group relative aspect-square rounded border border-border overflow-hidden"
                      >
                        <img
                          src={getAssetUrl(asset)}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemove(asset.id)}
                          disabled={removingId === asset.id}
                          className="absolute top-1 right-1 w-5 h-5 rounded bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {removingId === asset.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-medium">素材を追加</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                閉じる
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssetManager
                onAssetSelect={handleAssetSelect}
                selectionMode
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
