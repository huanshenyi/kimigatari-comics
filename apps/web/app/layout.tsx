import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "キミガタリコミックス | AI Manga Generator",
  description: "AIを活用してプロットからマンガを自動生成するアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
