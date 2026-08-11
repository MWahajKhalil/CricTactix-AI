import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body 
        className="min-h-full bg-background text-foreground font-sans selection:bg-turf-emerald/20 selection:text-white transition-colors duration-300"
        suppressHydrationWarning
      >
        <div className="min-h-full flex flex-col justify-between">
          
          {/* PREMIUM BRANDED NAVBAR */}
          <header className="sticky top-0 z-50 broadcast-header-ticker backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 text-xs font-display font-extrabold tracking-wider text-header-text">
                  <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                  CRICTACTIX <span className="text-zinc-500 font-normal">PRO</span>
                </Link>
                <div className="hidden sm:block h-3.5 w-px bg-border-color" />
                <span className="hidden sm:inline-flex text-[9px] font-mono text-text-muted uppercase tracking-widest">
                  TACTICAL INTELLIGENCE
                </span>
              </div>

              <nav className="flex items-center gap-2 text-[10px] font-display font-semibold uppercase tracking-wider text-text-muted">
                <Link href="/" className="px-2.5 py-1.5 hover:text-header-text transition-colors">
                  Home
                </Link>
                <Link href="/dashboard" className="px-2.5 py-1.5 hover:text-header-text transition-colors">
                  Dashboard
                </Link>
                <Link href="/matches" className="px-2.5 py-1.5 hover:text-header-text transition-colors">
                  Matches
                </Link>
                <Link href="/matchups" className="px-2.5 py-1.5 hover:text-header-text transition-colors">
                  Simulator
                </Link>
                <Link href="/chat" className="ml-1 px-3 py-1.5 border border-turf-emerald/20 bg-turf-emerald/5 text-turf-emerald rounded transition hover:bg-turf-emerald hover:text-zinc-950 dark:hover:text-zinc-950 font-bold">
                  AI Analyst
                </Link>
                
                {/* Theme Toggle Button */}
                <div className="ml-1 flex items-center">
                  <ThemeToggle />
                </div>
              </nav>

            </div>
          </header>

          <main className="flex-1">{children}</main>

          {/* PREMIUM ENTERPRISE FOOTER */}
          <footer className="border-t border-border-color bg-background/30 backdrop-blur-sm py-8 text-[10px] font-mono text-text-muted">
            <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-header-text">CRICTACTIX PRO</span>
                <span>•</span>
                <span>Professional Cricket Tactical Intelligence Deck</span>
              </div>
              <div className="flex items-center gap-4">
                <span>ENGINE: V1.2.0</span>
                <span>•</span>
                <span>CORE: SQLITE_PSL</span>
                <span>•</span>
                <span>STATUS: OPERATIONAL</span>
              </div>
            </div>
          </footer>
        </div>
      </body>

    </html>
  );
}
