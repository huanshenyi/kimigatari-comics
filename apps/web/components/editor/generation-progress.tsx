"use client";

import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react";

interface GenerationProgressProps {
  progress: number;
  currentStep: string;
  currentStepId?: string | null;
  completedSteps: string[];
}

const steps = [
  {
    id: "analyze-story",
    label: "プロット解析",
    description: "物語を分析中...",
    icon: BookOpen,
  },
  {
    id: "generate-layouts",
    label: "レイアウト生成",
    description: "コマ割りを設計中...",
    icon: Layers,
  },
  {
    id: "generate-images",
    label: "画像生成",
    description: "イラストを描画中...",
    icon: ImageIcon,
  },
  {
    id: "place-text",
    label: "テキスト配置",
    description: "吹き出しを配置中...",
    icon: MessageSquare,
  },
];

export function GenerationProgress({
  progress,
  currentStep,
  currentStepId,
  completedSteps,
}: GenerationProgressProps) {
  const getStepState = (stepId: string) => {
    if (completedSteps.includes(stepId)) return "completed";
    if (currentStepId === stepId) return "current";
    return "pending";
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="paper-card rounded-lg overflow-hidden">
        {/* Header with animated background */}
        <div className="relative p-8 text-center overflow-hidden">
          {/* Animated ink splash background */}
          <div className="absolute inset-0 diagonal-grid opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Brush stroke logo */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          <h2 className="headline-editorial text-2xl mb-2 relative">
            マンガを生成中
          </h2>
          <p className="text-sm text-muted-foreground relative">
            AIがあなたの物語をマンガに変換しています
          </p>
        </div>

        {/* Progress section */}
        <div className="p-6 border-t border-border/50 space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentStep}</span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <Progress
                value={progress}
                className="h-full transition-all duration-500"
              />
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: "shimmer 2s infinite",
                  transform: `translateX(${progress - 100}%)`,
                }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const state = getStepState(step.id);
              const isCompleted = state === "completed";
              const isCurrent = state === "current";
              const isPending = state === "pending";

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/30"
                      : isCompleted
                      ? "bg-muted/50"
                      : "opacity-50"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p
                      className={`font-medium text-sm ${
                        isPending ? "text-muted-foreground" : ""
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCurrent ? step.description : isCompleted ? "完了" : "待機中"}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className="text-xs">
                    {isCompleted && (
                      <span className="text-primary font-medium">完了</span>
                    )}
                    {isCurrent && (
                      <span className="text-[hsl(var(--gold))] font-medium animate-pulse">
                        処理中
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            生成中はページを離れないでください
          </p>
        </div>
      </div>

      {/* Style for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
