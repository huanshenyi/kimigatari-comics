"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  BookOpen,
  Users,
  Image as ImageIcon,
  Check,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";

type TabType = "stories" | "characters" | "assets";

interface Story {
  id: string;
  title: string;
  description: string;
  episodeCount: number;
  thumbnail?: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  hasThreeView: boolean;
  thumbnail?: string;
}

interface Asset {
  id: string;
  name: string;
  type: "background" | "effect" | "prop";
  thumbnail?: string;
}

interface KimigatariImportProps {
  onClose: () => void;
  onImportStory?: (story: Story) => void;
  onImportCharacter?: (character: Character) => void;
  onImportAsset?: (asset: Asset) => void;
}

// Demo data
const demoStories: Story[] = [
  {
    id: "1",
    title: "桜の約束",
    description: "高校最後の春、幼なじみとの別れと再会の物語",
    episodeCount: 12,
  },
  {
    id: "2",
    title: "電車の出会い",
    description: "毎朝同じ電車で見かける人との偶然の出会い",
    episodeCount: 8,
  },
  {
    id: "3",
    title: "夏の終わり",
    description: "海辺の町で過ごした、忘れられない夏休み",
    episodeCount: 6,
  },
  {
    id: "4",
    title: "図書館の秘密",
    description: "古い図書館で見つけた、不思議な本の物語",
    episodeCount: 10,
  },
];

const demoCharacters: Character[] = [
  {
    id: "1",
    name: "高橋 ユウタ",
    description: "主人公。高校3年生。バスケ部所属。",
    hasThreeView: true,
  },
  {
    id: "2",
    name: "佐藤 アオイ",
    description: "ヒロイン。ユウタの幼なじみ。留学を控えている。",
    hasThreeView: true,
  },
  {
    id: "3",
    name: "田中 ミカ",
    description: "アオイの親友。明るくおせっかいな性格。",
    hasThreeView: true,
  },
  {
    id: "4",
    name: "山本 ケンジ",
    description: "ユウタの親友。バスケ部のキャプテン。",
    hasThreeView: false,
  },
];

const demoAssets: Asset[] = [
  { id: "1", name: "学校 - 教室", type: "background" },
  { id: "2", name: "学校 - 屋上", type: "background" },
  { id: "3", name: "街 - 駅前", type: "background" },
  { id: "4", name: "公園 - ベンチ", type: "background" },
  { id: "5", name: "集中線", type: "effect" },
  { id: "6", name: "ショック効果", type: "effect" },
];

export function KimigatariImport({
  onClose,
  onImportStory,
  onImportCharacter,
  onImportAsset,
}: KimigatariImportProps) {
  const [activeTab, setActiveTab] = useState<TabType>("stories");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const tabs: Array<{ id: TabType; label: string; icon: typeof BookOpen }> = [
    { id: "stories", label: "ストーリー", icon: BookOpen },
    { id: "characters", label: "キャラクター", icon: Users },
    { id: "assets", label: "素材", icon: ImageIcon },
  ];

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleImport = async () => {
    setIsImporting(true);
    // Simulate import delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsImporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium">キミガタリからインポート</h3>
              <p className="text-xs text-muted-foreground">
                MCP経由で素材を取得
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedItems(new Set());
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Stories Tab */}
          {activeTab === "stories" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {demoStories.map((story) => {
                const isSelected = selectedItems.has(story.id);
                return (
                  <button
                    key={story.id}
                    onClick={() => toggleSelection(story.id)}
                    className={`relative text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{story.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {story.description}
                        </p>
                        <p className="text-xs text-primary mt-2">
                          {story.episodeCount}話
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Characters Tab */}
          {activeTab === "characters" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {demoCharacters.map((character) => {
                const isSelected = selectedItems.has(character.id);
                return (
                  <button
                    key={character.id}
                    onClick={() => toggleSelection(character.id)}
                    className={`relative text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-20 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{character.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {character.description}
                        </p>
                        {character.hasThreeView && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded bg-[hsl(var(--ai))]/20 text-[hsl(var(--ai))] mt-2">
                            三面図あり
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === "assets" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {demoAssets.map((asset) => {
                const isSelected = selectedItems.has(asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => toggleSelection(asset.id)}
                    className={`relative aspect-square rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-center font-medium truncate w-full">
                        {asset.name}
                      </p>
                      <span
                        className={`text-xs mt-1 ${
                          asset.type === "background"
                            ? "text-blue-500"
                            : asset.type === "effect"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {asset.type === "background"
                          ? "背景"
                          : asset.type === "effect"
                          ? "効果"
                          : "小物"}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedItems.size > 0
              ? `${selectedItems.size}件選択中`
              : "インポートするアイテムを選択"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedItems.size === 0 || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              インポート
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
