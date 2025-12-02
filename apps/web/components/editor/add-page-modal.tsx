"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X } from "lucide-react";

interface AddPageModalProps {
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export function AddPageModal({ onSubmit, onClose }: AddPageModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 paper-card rounded-lg p-6 shadow-dramatic">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">新規ページを追加</h2>
          <p className="text-sm text-muted-foreground mt-1">
            このページで起こるシーンやストーリーを説明してください
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Textarea
            placeholder="例: 主人公が夕日を背に立ち上がり、決意の表情で前を見据える..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px] resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            セリフは「」で囲むと吹き出しとして配置されます
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            生成する
          </Button>
        </div>
      </div>
    </div>
  );
}
