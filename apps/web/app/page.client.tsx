"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  BookOpen,
  Trash2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetManager } from "@/components/assets/asset-manager";
import { createProject, deleteProjectAction } from "./actions";
import type { ProjectRow } from "@kimigatari/db";

interface HomeClientProps {
  projects: ProjectRow[];
}

export function HomeClient({ projects }: HomeClientProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const handleNewProject = async () => {
    setIsCreating(true);

    try {
      const result = await createProject({
        title: "新規マンガ",
      });

      if (result.success && result.project) {
        router.push(`/comics/${result.project.id}/edit`);
      } else {
        console.error("Failed to create project:", result.error);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();

    if (!confirm("このプロジェクトを削除しますか？")) {
      return;
    }

    setDeletingId(projectId);
    try {
      const result = await deleteProjectAction(projectId);
      if (result.success) {
        router.refresh();
      } else {
        console.error("Failed to delete project:", result.error);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-60 border-r border-border/50 flex flex-col bg-card/30">
          {/* Logo */}
          <div className="p-4 border-b border-border/50">
            <h1 className="headline-editorial text-lg">キミガタリ</h1>
          </div>

          {/* New Project Button */}
          <div className="p-4">
            <Button
              onClick={handleNewProject}
              disabled={isCreating}
              className="w-full gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  新規作成
                </>
              )}
            </Button>
          </div>

          {/* Recent Projects List */}
          {projects.length > 0 && (
            <nav className="flex-1 overflow-auto px-2">
              <p className="text-xs text-muted-foreground px-2 py-2 font-medium">
                最近のプロジェクト
              </p>
              <div className="space-y-1">
                {projects.slice(0, 10).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/comics/${project.id}/edit`)}
                    className="w-full text-left px-3 py-2 rounded text-sm hover:bg-muted/50 transition-colors truncate flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{project.title}</span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* Spacer when no projects */}
          {projects.length === 0 && <div className="flex-1" />}

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border/50">
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-2 rounded hover:bg-muted/50"
            >
              <ImageIcon className="w-4 h-4" />
              素材管理
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {projects.length === 0 ? (
            <EmptyState
              onNewProject={handleNewProject}
              isCreating={isCreating}
            />
          ) : (
            <ProjectGrid
              projects={projects}
              onSelect={(id) => router.push(`/comics/${id}/edit`)}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          )}
        </main>
      </div>

      {/* Asset Manager Modal */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsAssetModalOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="headline-editorial text-lg">素材ライブラリ</h2>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssetManager />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Empty State Component
function EmptyState({
  onNewProject,
  isCreating,
}: {
  onNewProject: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h2 className="headline-editorial text-2xl mb-3">
          最初のマンガを作りましょう
        </h2>
        <p className="text-muted-foreground mb-8">
          プロットを入力するだけで、AIがマンガを自動生成します。
        </p>
        <Button
          onClick={onNewProject}
          disabled={isCreating}
          size="lg"
          className="gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              作成中...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              新規作成
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Project Grid Component
function ProjectGrid({
  projects,
  onSelect,
  onDelete,
  deletingId,
}: {
  projects: ProjectRow[];
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-6">プロジェクト</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`paper-card group p-4 rounded cursor-pointer transition-all hover:border-primary/50 hover-lift relative ${deletingId === project.id ? "opacity-50" : ""
              }`}
            onClick={() => onSelect(project.id)}
          >
            {/* Delete Button */}
            <button
              onClick={(e) => onDelete(e, project.id)}
              disabled={deletingId === project.id}
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              title="プロジェクトを削除"
            >
              {deletingId === project.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>

            {/* Project Content */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{project.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.updated_at).toLocaleDateString("ja-JP")}
                </p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${project.status === "completed"
                      ? "bg-green-500/10 text-green-500"
                      : project.status === "generating"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : project.status === "error"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                    }`}
                >
                  {project.status === "completed"
                    ? "完了"
                    : project.status === "generating"
                      ? "生成中"
                      : project.status === "error"
                        ? "エラー"
                        : "下書き"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
