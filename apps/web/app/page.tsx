"use client";

import { useState } from "react";
import { PlotInput } from "@/components/plot/plot-input";
import { MangaEditor } from "@/components/editor/manga-editor";
import { GenerationProgress } from "@/components/editor/generation-progress";
import { AssetManager } from "@/components/assets/asset-manager";
import { KimigatariImport } from "@/components/import/kimigatari-import";
import type { Page } from "@kimigatari/types";
import {
  BookOpen,
  FileText,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  Layers,
  Image as ImageIcon,
  Download,
} from "lucide-react";

type AppState = "home" | "input" | "generating" | "editing" | "assets";
type ProjectType = "single" | "story";

interface Project {
  id: string;
  title: string;
  type: ProjectType;
  pageCount: number;
  updatedAt: Date;
  thumbnail?: string;
}

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  type?: "character" | "background" | "effect" | "reference";
  name?: string;
}

interface SelectedAssetsState {
  characters: Asset[];
  backgrounds: Asset[];
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [projectType, setProjectType] = useState<ProjectType>("single");
  const [plot, setPlot] = useState("");
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAssetsState>({
    characters: [],
    backgrounds: [],
  });
  const [showImportModal, setShowImportModal] = useState(false);

  // Demo projects for display
  const [projects] = useState<Project[]>([
    {
      id: "1",
      title: "桜の約束",
      type: "story",
      pageCount: 8,
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      title: "電車の出会い",
      type: "single",
      pageCount: 1,
      updatedAt: new Date(Date.now() - 172800000),
    },
  ]);

  const handleGenerate = async () => {
    if (!plot.trim()) return;

    setAppState("generating");
    setProgress(0);
    setCurrentStep("プロット解析中...");

    try {
      const response = await fetch("http://localhost:4111/workflow/mangaGeneration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputData: {
            plot,
            title: title || "無題",
            targetPageCount: projectType === "single" ? 1 : 4,
            assets: {
              characters: selectedAssets.characters.map((a) => a.url),
              backgrounds: selectedAssets.backgrounds.map((a) => a.url),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          console.log("Raw text received:", text); // Debug raw response
          const lines = text.split("\n").filter((line) => line.trim());
          console.log("Lines:", lines); // Debug parsed lines

          for (const line of lines) {
            // SSE形式: "data: {...}" から "data: " プレフィックスを除去
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6); // "data: " (6文字) を除去
            if (jsonStr === "[DONE]") continue; // 終了マーカーをスキップ

            try {
              const data = JSON.parse(jsonStr);
              console.log("Received data:", data); // Debug log

              if (data.type === "progress") {
                const { stepId, status, message, progress: stepProgress } = data.data;

                // Track step progress by ID
                if (stepId) {
                  setCurrentStepId(stepId);

                  if (status === "completed") {
                    setCompletedSteps((prev) =>
                      prev.includes(stepId) ? prev : [...prev, stepId]
                    );
                  }
                }

                setProgress(stepProgress || 0);
                setCurrentStep(message || "");
              }
              // Check for step completion with pages
              if (data.type === "data-workflow") {
                const generateImageStep = data.data?.steps?.["generate-image"];
                if (generateImageStep?.status === "success" && generateImageStep?.output?.pages) {
                  console.log("Found pages in workflow output:", generateImageStep.output.pages);
                  setPages(generateImageStep.output.pages);
                  setAppState("editing");
                  return; // 成功したら関数を終了
                }
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      setAppState("input");
    }
  };

  const handleBack = () => {
    setAppState("home");
    setPages([]);
    setPlot("");
    setTitle("");
    setCurrentStepId(null);
    setCompletedSteps([]);
    setSelectedAssets({ characters: [], backgrounds: [] });
  };

  const handleNewProject = (type: ProjectType) => {
    setProjectType(type);
    setAppState("input");
  };

  // Home Screen with Editorial Design
  if (appState === "home") {
    return (
      <main className="min-h-screen bg-background">
        {/* Editorial Header */}
        <header className="border-b border-border/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="headline-editorial text-xl tracking-tight">
                    キミガタリ<span className="text-primary">コミックス</span>
                  </h1>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    AI MANGA GENERATOR
                  </p>
                </div>
              </div>
              {/* Navigation */}
              <nav className="flex items-center gap-4">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-400 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  キミガタリから
                </button>
                <button
                  onClick={() => setAppState("assets")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  素材管理
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 diagonal-grid opacity-30" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--ai))]/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-6 py-16 relative">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-primary tracking-[0.2em] uppercase mb-4">
                物語を、絵に。
              </p>
              <h2 className="headline-editorial text-4xl md:text-5xl mb-6 leading-tight">
                あなたの物語が
                <br />
                <span className="text-gradient-primary">マンガになる</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                プロットを入力するだけで、AIが白黒マンガを自動生成。
                一枚絵からストーリーマンガまで、あなたの創作をサポートします。
              </p>
            </div>

            {/* Project Type Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-3xl">
              {/* Single Page Card */}
              <button
                onClick={() => handleNewProject("single")}
                className="paper-card group text-left p-6 rounded transition-all hover:border-primary/50 hover-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1 flex items-center gap-2">
                      一枚マンガ
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      1ページ完結のイラスト風マンガ。SNS投稿やサムネイルに最適。
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>約2分で生成</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Story Manga Card */}
              <button
                onClick={() => handleNewProject("story")}
                className="paper-card group text-left p-6 rounded transition-all hover:border-primary/50 hover-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded bg-[hsl(var(--ai))]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--ai))]/20 transition-colors">
                    <Layers className="w-6 h-6 text-[hsl(var(--ai))]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1 flex items-center gap-2">
                      ストーリーマンガ
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      複数ページの本格的なマンガ。キャラクターとストーリーを表現。
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>約5-10分で生成</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        <section className="border-t border-border/50">
          <div className="container mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="headline-editorial text-2xl mb-1">最近のプロジェクト</h3>
                <p className="text-sm text-muted-foreground">
                  作成中・完成済みのマンガ
                </p>
              </div>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                すべて表示
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {projects.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="paper-card rounded overflow-hidden hover-lift cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[3/4] bg-muted/50 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${project.type === "story"
                              ? "bg-[hsl(var(--ai))]/20 text-[hsl(var(--ai))]"
                              : "bg-primary/20 text-primary"
                            }`}
                        >
                          {project.type === "story" ? "ストーリー" : "一枚"}
                        </span>
                        <h4 className="font-medium truncate">{project.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {project.pageCount}ページ
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Project Card */}
                <button
                  onClick={() => handleNewProject("single")}
                  className="aspect-[3/4] border-2 border-dashed border-border rounded flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    新規作成
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 paper-card rounded">
                <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  まだプロジェクトがありません
                </p>
                <button
                  onClick={() => handleNewProject("single")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  最初のマンガを作成
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>Powered by Mastra AI</p>
              <p>キミガタリコミックス © 2024</p>
            </div>
          </div>
        </footer>

        {/* Import Modal */}
        {showImportModal && (
          <KimigatariImport onClose={() => setShowImportModal(false)} />
        )}
      </main>
    );
  }

  // Input, Generating, Editing states
  return (
    <main className="min-h-screen bg-background">
      {/* Compact Header for inner pages */}
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <span className="headline-editorial text-lg">
                キミガタリ<span className="text-primary">コミックス</span>
              </span>
            </button>

            <nav className="flex items-center gap-4">
              {appState !== "assets" && (
                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                  {projectType === "story" ? "ストーリーマンガ" : "一枚マンガ"}
                </span>
              )}
              {appState === "assets" && (
                <span className="text-xs px-2 py-1 rounded bg-[hsl(var(--ai))]/20 text-[hsl(var(--ai))]">
                  素材ライブラリ
                </span>
              )}
              {(appState === "editing" || appState === "assets") && (
                <button
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ホームに戻る
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {appState === "input" && (
          <PlotInput
            plot={plot}
            title={title}
            projectType={projectType}
            selectedAssets={selectedAssets}
            onPlotChange={setPlot}
            onTitleChange={setTitle}
            onAssetsChange={setSelectedAssets}
            onGenerate={handleGenerate}
            onBack={handleBack}
          />
        )}

        {appState === "generating" && (
          <GenerationProgress
            progress={progress}
            currentStep={currentStep}
            currentStepId={currentStepId}
            completedSteps={completedSteps}
          />
        )}

        {appState === "editing" && pages.length > 0 && <MangaEditor pages={pages} />}

        {appState === "assets" && (
          <div className="h-[calc(100vh-140px)]">
            <AssetManager />
          </div>
        )}
      </div>
    </main>
  );
}
