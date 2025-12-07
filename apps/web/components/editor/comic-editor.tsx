"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  BookOpen,
  Download,
  Home,
  Loader2,
  Image as ImageIcon,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MangaEditorSingle,
  type MangaEditorHandle,
} from "./manga-editor-single";
import { PageStrip } from "./page-strip";
import { AddPageModal } from "./add-page-modal";
import { GenerationProgress } from "./generation-progress";
import { ExportDialog } from "./export-dialog";
import { ProjectAssets } from "@/components/assets/project-assets";
import {
  createPage,
  updatePageAction,
  deletePageAction,
  reorderPages,
} from "@/app/actions";
import { updateProjectTitle } from "@/app/comics/[id]/edit/actions";
import type { ProjectRow, PageRow } from "@kimigatari/db";

interface ProjectAsset {
  id: string;
  user_id: string | null;
  type: string;
  name: string;
  s3_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  display_order: number;
}

// Helper to get asset URL
function getAssetUrl(s3Key: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_MINIO_URL ||
    "http://localhost:9000/kimigatari-assets";
  return `${baseUrl}/${s3Key}`;
}

// Helper to calculate progress percentage (outside component to avoid re-creation)
function calculateProgress(stepId: string, status: string): number {
  const stepOrder = ["generate-image"];
  const index = stepOrder.indexOf(stepId);
  if (index === -1) return 0;
  return status === "completed"
    ? 100
    : ((index + 0.5) / stepOrder.length) * 100;
}

interface ComicEditorProps {
  project: ProjectRow;
  initialPages: PageRow[];
}

export function ComicEditor({ project, initialPages }: ComicEditorProps) {
  const router = useRouter();
  const editorRef = useRef<MangaEditorHandle>(null);
  const [pages, setPages] = useState<PageRow[]>(initialPages);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAssetPanelOpen, setIsAssetPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([]);
  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    progress: number;
    currentStep: string;
    currentStepId: string | null;
    completedSteps: string[];
  }>({
    isGenerating: false,
    progress: 0,
    currentStep: "",
    currentStepId: null,
    completedSteps: [],
  });

  const currentPage = pages[currentPageIndex];

  // Handle drag end for page reordering
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);

      const reordered = arrayMove(pages, oldIndex, newIndex);
      setPages(reordered);

      // Update current page index if needed
      if (currentPageIndex === oldIndex) {
        setCurrentPageIndex(newIndex);
      } else if (currentPageIndex > oldIndex && currentPageIndex <= newIndex) {
        setCurrentPageIndex(currentPageIndex - 1);
      } else if (currentPageIndex < oldIndex && currentPageIndex >= newIndex) {
        setCurrentPageIndex(currentPageIndex + 1);
      }

      // Persist order to API
      try {
        const orders = reordered.map((p, i) => ({
          id: p.id,
          page_number: i + 1,
        }));
        await reorderPages(project.id, orders);
      } catch (error) {
        console.error("Failed to save page order:", error);
      }
    },
    [pages, currentPageIndex, project.id]
  );

  // Handle adding a new page
  const handleAddPage = useCallback(
    async (prompt: string) => {
      setIsAddPageModalOpen(false);
      setGenerationState({
        isGenerating: true,
        progress: 0,
        currentStep: "生成を開始中...",
        currentStepId: null,
        completedSteps: [],
      });

      try {
        // Create page record first
        const pageResult = await createPage(project.id, { layoutData: [] });

        if (!pageResult.success || !pageResult.page) {
          throw new Error(pageResult.error || "Failed to create page");
        }

        const newPage = pageResult.page;

        // Call generation workflow with SSE
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4111";
        const response = await fetch(`${apiUrl}/workflow/mangaGeneration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputData: {
              plot: prompt,
              title: project.title,
              targetPageCount: 1,
              assets: {
                characters: projectAssets
                  .filter((a) => a.type === "character")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    s3_key: a.s3_key,
                    url: getAssetUrl(a.s3_key),
                  })),
                backgrounds: projectAssets
                  .filter((a) => a.type === "background")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    s3_key: a.s3_key,
                    url: getAssetUrl(a.s3_key),
                  })),
                references: projectAssets
                  .filter((a) => a.type === "reference")
                  .map((a) => ({
                    id: a.id,
                    name: a.name,
                    s3_key: a.s3_key,
                    url: getAssetUrl(a.s3_key),
                  })),
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let generatedLayoutData: unknown[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log("[SSE] Received:", data);

                  if (data.type === "progress") {
                    const { stepId, status, message } = data.data;
                    setGenerationState((s) => ({
                      ...s,
                      currentStep: message || s.currentStep,
                      currentStepId: stepId,
                      completedSteps:
                        status === "completed"
                          ? [...s.completedSteps, stepId]
                          : s.completedSteps,
                      progress: calculateProgress(stepId, status),
                    }));
                  } else if (data.type === "data-workflow") {
                    // Mastra workflow final result
                    // Structure: data.data.steps["generate-image"].output.pages[0].layoutData
                    const stepOutput =
                      data.data?.steps?.["generate-image"]?.output;
                    if (stepOutput?.pages?.[0]?.layoutData) {
                      generatedLayoutData = stepOutput.pages[0].layoutData;
                      console.log(
                        "[SSE] Generated layoutData:",
                        generatedLayoutData
                      );
                    }
                  }
                } catch {
                  // JSON parse error - skip this line
                }
              }
            }
          }

          // Update page with generated layout data
          if (generatedLayoutData.length > 0) {
            await updatePageAction(newPage.id, {
              layout_data: generatedLayoutData,
            });
          }
          const updatedPage = { ...newPage, layout_data: generatedLayoutData };

          setPages((prev) => {
            const newPages = [...prev, updatedPage as PageRow];
            setCurrentPageIndex(newPages.length - 1);
            return newPages;
          });
        } else {
          // Fallback if no reader available
          setPages((prev) => {
            const newPages = [...prev, newPage];
            setCurrentPageIndex(newPages.length - 1);
            return newPages;
          });
        }
      } catch (error) {
        console.error("Failed to generate:", error);
      } finally {
        setGenerationState((s) => ({ ...s, isGenerating: false }));
      }
    },
    [project.id, project.title, projectAssets]
  );

  // Handle page update
  const handlePageUpdate = useCallback(
    async (updates: Partial<PageRow>) => {
      if (!currentPage) return;

      setIsSaving(true);
      try {
        const result = await updatePageAction(currentPage.id, {
          page_number: updates.page_number,
          layout_data: updates.layout_data,
          image_url: updates.image_url,
        });

        if (result.success && result.page) {
          setPages((prev) =>
            prev.map((p) => (p.id === result.page!.id ? result.page! : p))
          );
        }
      } catch (error) {
        console.error("Failed to update page:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [currentPage]
  );

  // Handle page delete
  const handlePageDelete = useCallback(
    async (pageId: string) => {
      try {
        await deletePageAction(pageId);

        const newPages = pages.filter((p) => p.id !== pageId);
        setPages(newPages);

        // Adjust current index
        if (currentPageIndex >= newPages.length) {
          setCurrentPageIndex(Math.max(0, newPages.length - 1));
        }
      } catch (error) {
        console.error("Failed to delete page:", error);
      }
    },
    [pages, currentPageIndex]
  );

  // Handle export - エクスポートダイアログを開く
  const handleExport = useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  // Get current page DataURL for export
  const getCurrentPageDataUrl = useCallback(() => {
    return editorRef.current?.exportCanvas() || null;
  }, []);

  // Handle title change
  const handleTitleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "" || trimmedTitle === project.title) {
      setTitle(project.title);
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    await updateProjectTitle(project.id, trimmedTitle);
  }, [title, project.id, project.title]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <Home className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitle(project.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="font-medium bg-transparent border-b border-primary outline-none px-1"
              />
            ) : (
              <h1
                className="font-medium cursor-pointer hover:text-primary transition-colors px-1 border-b border-transparent hover:border-border"
                onClick={() => setIsEditingTitle(true)}
                title="クリックして編集"
              >
                {title || "無題"}
              </h1>
            )}
          </div>
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              保存中...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isAssetPanelOpen ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setIsAssetPanelOpen(!isAssetPanelOpen)}
          >
            {isAssetPanelOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            素材
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            エクスポート
          </Button>
        </div>
      </header>

      {/* Main editor area */}
      <main className="flex-1 overflow-hidden flex">
        {/* Asset Panel (Left) */}
        {isAssetPanelOpen && (
          <div className="w-80 border-r border-border/50 flex-shrink-0 overflow-hidden">
            <ProjectAssets
              projectId={project.id}
              onAssetsChange={setProjectAssets}
            />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {currentPage ? (
            <MangaEditorSingle
              ref={editorRef}
              page={currentPage}
              onPageUpdate={handlePageUpdate}
            />
          ) : (
            <EmptyState onAddPage={() => setIsAddPageModalOpen(true)} />
          )}
        </div>
      </main>

      {/* Bottom page strip */}
      <PageStrip
        pages={pages}
        currentIndex={currentPageIndex}
        onPageSelect={setCurrentPageIndex}
        onDragEnd={handleDragEnd}
        onAddPage={() => setIsAddPageModalOpen(true)}
      />

      {/* Add page modal */}
      <AddPageModal
        open={isAddPageModalOpen}
        onSubmit={handleAddPage}
        onOpenChange={setIsAddPageModalOpen}
      />

      {/* Export dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        pages={pages}
        projectTitle={title}
        currentPageIndex={currentPageIndex}
        getCurrentPageDataUrl={getCurrentPageDataUrl}
      />

      {/* Generation progress overlay */}
      {generationState.isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <GenerationProgress
            progress={generationState.progress}
            currentStep={generationState.currentStep}
            currentStepId={generationState.currentStepId}
            completedSteps={generationState.completedSteps}
          />
        </div>
      )}
    </div>
  );
}

// Empty state component
function EmptyState({ onAddPage }: { onAddPage: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">ページがありません</h2>
        <p className="text-muted-foreground mb-6">
          最初のページを追加してマンガ制作を始めましょう
        </p>
        <Button onClick={onAddPage} className="gap-2">
          <span>ページを追加</span>
        </Button>
      </div>
    </div>
  );
}
