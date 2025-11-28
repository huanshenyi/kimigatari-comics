"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssetPicker } from "@/components/assets/asset-picker";
import { SelectedAssets } from "@/components/assets/selected-assets";
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Users,
  Zap,
  Mountain,
} from "lucide-react";

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

interface PlotInputProps {
  plot: string;
  title: string;
  projectType: "single" | "story";
  selectedAssets: SelectedAssetsState;
  onPlotChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onAssetsChange: (assets: SelectedAssetsState) => void;
  onGenerate: () => void;
  onBack: () => void;
}

export function PlotInput({
  plot,
  title,
  projectType,
  selectedAssets,
  onPlotChange,
  onTitleChange,
  onAssetsChange,
  onGenerate,
  onBack,
}: PlotInputProps) {
  const [pickerType, setPickerType] = useState<"character" | "background" | null>(null);

  const handleAddCharacter = (asset: Asset) => {
    if (!selectedAssets.characters.find((a) => a.key === asset.key)) {
      onAssetsChange({
        ...selectedAssets,
        characters: [...selectedAssets.characters, asset],
      });
    }
    setPickerType(null);
  };

  const handleRemoveCharacter = (key: string) => {
    onAssetsChange({
      ...selectedAssets,
      characters: selectedAssets.characters.filter((a) => a.key !== key),
    });
  };

  const handleAddBackground = (asset: Asset) => {
    if (!selectedAssets.backgrounds.find((a) => a.key === asset.key)) {
      onAssetsChange({
        ...selectedAssets,
        backgrounds: [...selectedAssets.backgrounds, asset],
      });
    }
    setPickerType(null);
  };

  const handleRemoveBackground = (key: string) => {
    onAssetsChange({
      ...selectedAssets,
      backgrounds: selectedAssets.backgrounds.filter((a) => a.key !== key),
    });
  };
  const samplePlotSingle = `雨の降る夜、窓際で一人。
少女は古いオルゴールを握りしめていた。

「...約束、守れなかった」

涙が頬を伝う。
窓の向こうに、誰かのシルエットが見えた気がした。`;

  const samplePlotStory = `桜の花びらが舞う校舎の屋上。
高校3年生のユウタは、幼なじみのアオイに呼び出されていた。

「ユウタ、話があるの」
アオイは真剣な表情で振り返った。

「実は私、来月から海外に留学することになったの」

ユウタは驚きで言葉を失った。ずっと一緒だと思っていた幼なじみが、突然遠くへ行ってしまう。

「どうして...今まで黙ってたんだよ」

「言えなかったの。だって、言ったらユウタが悲しむと思って...」

アオイの目には涙が光っていた。

「バカ...悲しいに決まってるだろ」

ユウタは彼女の手を握りしめた。

「でも、応援するよ。お前の夢だったもんな、海外で勉強するの」

二人の間に、桜の花びらが静かに舞い落ちた。`;

  const tips = [
    {
      icon: MessageSquare,
      title: "セリフは「」で",
      description: "吹き出しとして認識",
    },
    {
      icon: Users,
      title: "キャラクター描写",
      description: "感情・表情を具体的に",
    },
    {
      icon: Zap,
      title: "場面転換",
      description: "改行で区切ると効果的",
    },
    {
      icon: Lightbulb,
      title: "アクション",
      description: "動きは具体的に表現",
    },
  ];

  const recommendedLength = projectType === "single" ? "100〜500" : "500〜3000";
  const samplePlot = projectType === "single" ? samplePlotSingle : samplePlotStory;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        戻る
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="headline-editorial text-2xl">
                  {projectType === "single" ? "一枚マンガ" : "ストーリーマンガ"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {projectType === "single"
                    ? "1ページ完結のイラスト風マンガ"
                    : "複数ページの本格的なマンガ"}
                </p>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              タイトル
              <span className="text-xs text-muted-foreground font-normal">
                （任意）
              </span>
            </label>
            <Input
              placeholder="マンガのタイトルを入力..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>

          {/* Plot Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">プロット</label>
              <button
                onClick={() => onPlotChange(samplePlot)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                サンプルを使用
              </button>
            </div>
            <div className="relative">
              <Textarea
                placeholder="物語のあらすじを入力してください。セリフや情景描写を含めると、より良いマンガが生成されます..."
                className="min-h-[350px] resize-none bg-card border-border focus:border-primary focus:ring-primary/20 text-base leading-relaxed"
                value={plot}
                onChange={(e) => onPlotChange(e.target.value)}
              />
              {/* Character counter */}
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                <span className={plot.length > 0 ? "text-foreground" : ""}>
                  {plot.length}
                </span>{" "}
                / 推奨 {recommendedLength}文字
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={onGenerate}
            disabled={!plot.trim()}
            size="lg"
            className="w-full h-14 text-base glow-accent hover:animate-pulse-glow disabled:opacity-50 disabled:glow-none"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            マンガを生成する
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips Card */}
          <div className="paper-card rounded p-5 space-y-4">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[hsl(var(--gold))]" />
              プロット作成のコツ
            </h3>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <tip.icon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Type Info */}
          <div className="paper-card rounded p-5 space-y-3">
            <h3 className="font-medium text-sm">生成設定</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">タイプ</span>
                <span>
                  {projectType === "single" ? "一枚マンガ" : "ストーリーマンガ"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">推定ページ数</span>
                <span>{projectType === "single" ? "1" : "4〜8"} ページ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">推定生成時間</span>
                <span>{projectType === "single" ? "約2分" : "約5〜10分"}</span>
              </div>
            </div>
          </div>

          {/* Character Assets */}
          <div className="paper-card rounded p-5 space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              キャラクター素材
            </h3>
            <p className="text-xs text-muted-foreground">
              登場人物の参照画像を追加
            </p>
            <SelectedAssets
              assets={selectedAssets.characters}
              onRemove={handleRemoveCharacter}
              onAdd={() => setPickerType("character")}
            />
          </div>

          {/* Background Assets */}
          <div className="paper-card rounded p-5 space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Mountain className="w-4 h-4 text-[hsl(var(--ai))]" />
              背景素材
            </h3>
            <p className="text-xs text-muted-foreground">
              シーン背景の参照画像を追加
            </p>
            <SelectedAssets
              assets={selectedAssets.backgrounds}
              onRemove={handleRemoveBackground}
              onAdd={() => setPickerType("background")}
            />
          </div>

          {/* Preview placeholder */}
          <div className="aspect-[3/4] rounded border-2 border-dashed border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">プレビュー</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {pickerType === "character" && (
        <AssetPicker
          type="character"
          title="キャラクター素材を選択"
          onSelect={handleAddCharacter}
          onClose={() => setPickerType(null)}
          selectedKeys={selectedAssets.characters.map((a) => a.key)}
        />
      )}
      {pickerType === "background" && (
        <AssetPicker
          type="background"
          title="背景素材を選択"
          onSelect={handleAddBackground}
          onClose={() => setPickerType(null)}
          selectedKeys={selectedAssets.backgrounds.map((a) => a.key)}
        />
      )}
    </div>
  );
}
