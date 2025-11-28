import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "君語りコミックス | AI Manga Generator",
  description: "AIを活用してプロットから白黒マンガを自動生成するアプリケーション",
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
