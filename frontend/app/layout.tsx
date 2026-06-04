import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CricTactix AI | Premium Cricket Tactical Analyst",
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
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 font-sans selection:bg-turf-emerald/20 selection:text-white">
        <div className="min-h-full flex flex-col">
          
          {/* PREMIUM BROADCAST TELEMETRY NAVBAR */}
          <header className="sticky top-0 z-50 broadcast-header-ticker backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
              
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 text-sm font-display font-bold tracking-wider text-white">
                  <span className="h-2 w-2 rounded-full bg-turf-emerald animate-pulse" />
                  CRICTACTIX <span className="text-zinc-500 font-normal">AI</span>
                </Link>
                <div className="hidden sm:block h-3 w-px bg-zinc-800" />
                <span className="hidden sm:inline-flex text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  Match Analyst Deck
                </span>
              </div>

              <nav className="flex items-center gap-2 text-xs font-display font-medium uppercase tracking-wider text-zinc-400">
                <Link href="/" className="px-3 py-1.5 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/matches" className="px-3 py-1.5 hover:text-white transition-colors">
                  Matches
                </Link>
                <Link href="/chat" className="ml-2 px-3.5 py-1.5 border border-turf-emerald/30 bg-turf-emerald/10 text-turf-emerald rounded-md transition hover:bg-turf-emerald hover:text-zinc-950 shadow shadow-turf-emerald/10 font-bold">
                  AI Analyst
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
