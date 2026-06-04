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
  title: "CricTactix AI | Cricket Tactical Analyst",
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
      <body className="min-h-full bg-zinc-950 text-zinc-100 font-sans selection:bg-accent-green/20 selection:text-white">
        <div className="min-h-full flex flex-col">
          <header className="sticky top-0 z-50 border-b border-emerald-950/40 bg-zinc-950/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
              <Link href="/" className="inline-flex items-center gap-3 text-lg font-display font-bold tracking-tight text-white hover:opacity-90 transition">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-green text-sm font-bold text-zinc-950 shadow-md shadow-accent-green/30">
                  CT
                </span>
                CricTactix <span className="text-accent-green font-normal">AI</span>
              </Link>
              <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium text-zinc-300">
                <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-emerald-900/10 hover:text-accent-green">
                  Home
                </Link>
                <Link href="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-emerald-900/10 hover:text-accent-green">
                  Dashboard
                </Link>
                <Link href="/matches" className="rounded-full px-4 py-2 transition hover:bg-emerald-900/10 hover:text-accent-green">
                  Matches
                </Link>
                <Link href="/chat" className="rounded-full ml-2 px-5 py-2.5 bg-accent-green text-zinc-950 font-semibold tracking-wide transition hover:scale-[1.02] hover:bg-emerald-400 active:scale-[0.98] shadow-md shadow-accent-green/25">
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
