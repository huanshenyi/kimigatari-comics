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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AssetManager } from "@/components/assets/asset-manager";
import { createProject, deleteProjectAction } from "./actions";
import { cn } from "@/lib/utils";
import type { ProjectRow } from "@kimigatari/db";

interface HomeClientProps {
  projects: ProjectRow[];
}

export function HomeClient({ projects }: HomeClientProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNewProject = async () => {
    setIsCreating(true);

    try {
      // 日時+ランダム数字でデフォルトタイトルを生成 (例: "1204_1523_42")
      const now = new Date();
      const defaultTitle = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}_${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;

      const result = await createProject({
        title: defaultTitle,
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
    <TooltipProvider delayDuration={300}>
      <div className="relative flex h-full bg-background">
        {/* Toggle Button - サイドバーの右端に接する縦長ボタン */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-200",
            "w-6 h-16 bg-card border border-border border-l-0 rounded-r-lg",
            "flex items-center justify-center shadow-sm hover:shadow-md hover:bg-secondary",
            sidebarOpen ? "left-60" : "left-14"
          )}
          aria-label={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={cn(
            "border-r border-border/50 flex flex-col bg-card/30 flex-shrink-0 transition-all duration-200",
            sidebarOpen ? "w-60" : "w-14"
          )}
        >
          {/* New Project Button */}
          <div className={cn("p-4", !sidebarOpen && "p-2")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleNewProject}
                  disabled={isCreating}
                  className={cn(
                    "transition-all duration-200",
                    sidebarOpen ? "w-full gap-2 h-11" : "w-10 h-10"
                  )}
                  size={sidebarOpen ? "default" : "icon"}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {sidebarOpen && (isCreating ? "作成中..." : "新規作成")}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">新規作成</TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Recent Projects List */}
          {projects.length > 0 && (
            <nav className={cn("flex-1 overflow-auto", sidebarOpen ? "px-4" : "px-2")}>
              {sidebarOpen && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  最近のプロジェクト
                </h3>
              )}
              <div className="space-y-1">
                {projects.slice(0, 10).map((project) => (
                  <Tooltip key={project.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(`/comics/${project.id}/edit`)}
                        className={cn(
                          "w-full text-left rounded-lg text-sm hover:bg-muted/50 transition-colors flex items-center gap-3 group",
                          sidebarOpen ? "px-3 py-2.5" : "justify-center py-2.5"
                        )}
                      >
                        <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        {sidebarOpen && (
                          <span className="truncate">{project.title}</span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!sidebarOpen && (
                      <TooltipContent side="right">{project.title}</TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            </nav>
          )}

          {/* Spacer when no projects */}
          {projects.length === 0 && <div className="flex-1" />}

          {/* Bottom Actions */}
          <div className={cn("border-t border-border/50", sidebarOpen ? "p-4" : "p-2")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsAssetModalOpen(true)}
                  className={cn(
                    "flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50 group",
                    sidebarOpen ? "gap-3 w-full px-3 py-2.5" : "w-10 h-10 justify-center"
                  )}
                >
                  <ImageIcon className="w-4 h-4 group-hover:text-foreground transition-colors" />
                  {sidebarOpen && "素材管理"}
                </button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">素材管理</TooltipContent>
              )}
            </Tooltip>
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
    </TooltipProvider>
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
