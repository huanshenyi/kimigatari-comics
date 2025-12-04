import { BookOpen } from "lucide-react";
import { getProjectsByUser, type ProjectRow } from "@kimigatari/db";
import { HomeClient } from "./page.client";

export default async function Home() {
  // TODO: 認証実装後にユーザーIDを取得
  const userId = "00000000-0000-0000-0000-000000000000";

  let projects: ProjectRow[] = [];
  try {
    projects = await getProjectsByUser(userId);
  } catch (error) {
    // DBが接続できない場合は空配列で続行
    console.error("Failed to fetch projects:", error);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Editorial Header */}
      <header className="border-b border-border/50 flex-shrink-0">
        <div className="container mx-auto py-4">
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
            {/* Navigation is handled by HomeClient */}
          </div>
        </div>
      </header>

      {/* Client Component for interactive parts */}
      <div className="flex-1 overflow-hidden">
        <HomeClient projects={projects} />
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 flex-shrink-0">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Powered by Mastra AI</p>
            <p>キミガタリコミックス © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
