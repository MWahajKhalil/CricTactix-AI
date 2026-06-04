// CricTactix-AI Tactical Analyst Home Page
import Link from "next/link";
import { checkBackendHealth, getMatches } from "@/lib/api";

type MatchSummary = {
  id: number;
  cricsheet_id: string;
  date: string;
  team_1: string;
  team_2: string;
  winner: string;
  match_type: string;
  venue: string;
};

type MatchResponse = {
  count: number;
  matches: MatchSummary[];
};

type BackendStatus = {
  message: string;
} | null;

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendData: BackendStatus = null;
  let matchData: MatchResponse = { count: 0, matches: [] };

  try {
    backendData = await checkBackendHealth();
    matchData = await getMatches(1, 3); // Load 3 matches for the quick ticker
  } catch (e: unknown) {
    console.error("Home page data fetch error:", e);
  }

  const isOnline = !!backendData;

  return (
    <div className="relative overflow-hidden py-12 md:py-20">
      {/* Decorative stadium lighting glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-accent-green/10 via-transparent to-transparent blur-[120px] pointer-events-none" />

      <main className="mx-auto flex max-w-6xl flex-col gap-20 px-6 sm:px-8 lg:px-12 relative">
        
        {/* HERO SECTION */}
        <section className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-accent-green">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
                Live PSL Database Connected
              </span>
              <h1 className="text-4xl font-display font-bold tracking-tight text-white sm:text-6xl leading-[1.05]">
                Cricket Tactics, <br />
                Decoded by <span className="text-accent-green neon-glow-green font-extrabold">AI</span>.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Query ball-by-ball datasets, extract detailed match stats, and converse with a RAG analyst chatbot trained directly on tournament scorecards.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/matches" className="inline-flex items-center justify-center rounded-xl bg-accent-green px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-md shadow-accent-green/25 hover:bg-emerald-400 transition hover:scale-[1.02] active:scale-[0.98]">
                Browse Matches
              </Link>
              <Link href="/chat" className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-900 hover:border-zinc-700">
                Open AI Analyst
              </Link>
            </div>
          </div>

          {/* TELEMETRY OVERVIEW PANEL */}
          <div className="glass-sports-card p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-accent-green/5 to-transparent pointer-events-none" />
            <p className="font-display text-xs uppercase tracking-widest text-zinc-500">Database Telemetry</p>
            <div className="mt-6 grid gap-4">
              
              <div className="flex items-center justify-between rounded-xl bg-zinc-950/60 border border-zinc-900 p-4">
                <div>
                  <p className="text-xs text-zinc-500">Analyst Backend Status</p>
                  <p className="mt-1 text-lg font-bold font-display text-white">
                    {isOnline ? "OPERATIONAL" : "DISCONNECTED"}
                  </p>
                </div>
                <span className={`h-3 w-3 rounded-full shadow-lg ${isOnline ? "bg-accent-green shadow-accent-green/45 animate-pulse" : "bg-red-500 shadow-red-500/40"}`} />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-950/60 border border-zinc-900 p-4">
                <div>
                  <p className="text-xs text-zinc-500">Total Matches Loaded</p>
                  <p className="mt-1 text-lg font-bold font-display text-accent-green neon-glow-green">
                    {matchData.count}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-emerald-500/10 text-accent-green border border-emerald-500/10 rounded px-2.5 py-1">
                  Active
                </span>
              </div>
              
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="glass-sports-card p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green text-sm font-bold border border-accent-green/20">
                01
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-white">Scorecard Engine</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Drill down into any match to view professional team scorecards, individual batting strike rates, and bowling statistics.
              </p>
            </div>
            <Link href="/matches" className="mt-6 text-xs font-semibold text-accent-cyan hover:underline inline-flex items-center gap-1.5">
              Explore Matches &rarr;
            </Link>
          </div>

          <div className="glass-sports-card p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan text-sm font-bold border border-accent-cyan/20">
                02
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-white">Natural Language Chat</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Ask queries like *"Which bowler has the lowest economy in the death overs at Karachi?"* and let our agent query the SQL DB directly.
              </p>
            </div>
            <Link href="/chat" className="mt-6 text-xs font-semibold text-accent-cyan hover:underline inline-flex items-center gap-1.5">
              Open Chat Room &rarr;
            </Link>
          </div>

          <div className="glass-sports-card p-6 flex flex-col justify-between">
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-yellow/10 text-accent-yellow text-sm font-bold border border-accent-yellow/20">
                03
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-white">Advanced Matchups</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Analyze player statistics, head-to-head performance records, and matches across multiple seasons in one system.
              </p>
            </div>
            <Link href="/dashboard" className="mt-6 text-xs font-semibold text-accent-cyan hover:underline inline-flex items-center gap-1.5">
              View Stats Dashboard &rarr;
            </Link>
          </div>
        </section>

        {/* LATEST RESULTS SECTION */}
        <section className="glass-sports-card p-6 md:p-8 relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-zinc-500">Live Archives</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">Recent PSL Match Results</h2>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition">
              View All Matches
            </Link>
          </div>

          {matchData.matches.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchData.matches.map((match: MatchSummary) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="group block rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 hover:border-emerald-500/30 hover:bg-zinc-900/40 transition"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-zinc-900 pb-3 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan px-2 py-0.5 bg-accent-cyan/10 rounded">
                      {match.match_type || "T20"}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">{match.date}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-white group-hover:text-accent-green transition leading-tight">
                    {match.team_1} <br />
                    <span className="text-zinc-500 font-normal text-xs">vs</span> {match.team_2}
                  </h3>
                  <p className="mt-4 text-xs text-zinc-400 flex items-center justify-between">
                    <span>Winner:</span>
                    <span className="font-semibold text-white bg-zinc-900 px-2 py-0.5 rounded">{match.winner || "TBD"}</span>
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-zinc-500 text-sm">
              No recent matches loaded. Please ensure the SQLite database is initialized and matches loaded.
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
