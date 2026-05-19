import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cricket Tactical Analyst",
  description: "AI-powered cricket match analysis and tactical insights built on PSL match data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <div className="min-h-full flex flex-col">
          <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-zinc-950/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold text-white">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                  C
                </span>
                Cricket Tactical
              </Link>
              <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                  Home
                </Link>
                <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                  Dashboard
                </Link>
                <Link href="/matches" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
                  Matches
                </Link>
                <Link href="/chat" className="rounded-full px-4 py-2 bg-blue-600 text-white transition hover:bg-blue-500">
                  AI Chat
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
