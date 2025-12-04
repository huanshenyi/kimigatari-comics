"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface AddPageModalProps {
  open: boolean;
  onSubmit: (prompt: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function AddPageModal({ open, onSubmit, onOpenChange }: AddPageModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPrompt("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新規ページを追加</DialogTitle>
          <DialogDescription>
            このページで起こるシーンやストーリーを説明してください
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
