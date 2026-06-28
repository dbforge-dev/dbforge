import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "basely — AI-native Postgres in seconds",
  description: "Spin up isolated Postgres databases instantly. Built for AI agents, CLIs, and indie developers.",
  openGraph: {
    title: "basely — AI-native Postgres in seconds",
    description: "Spin up isolated Postgres databases instantly. Built for AI agents, CLIs, and MCP.",
    siteName: "basely",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
