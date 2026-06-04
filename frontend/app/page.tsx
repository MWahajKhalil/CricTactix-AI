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
    matchData = await getMatches(1, 3);
  } catch (e: unknown) {
    console.error("Home page data fetch error:", e);
  }

  const isOnline = !!backendData;

  return (
    <div className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 sm:px-8 lg:px-12 relative">
        
        {/* HERO SECTION + PITCH SVG */}
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-turf-emerald uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                Live PSL Database Sync
              </span>
              <h1 className="sports-heading text-4xl sm:text-6xl text-white tracking-tight leading-none">
                Cricket Insights <br />
                From the <span className="text-turf-emerald">Crease</span>.
              </h1>
              <p className="max-w-md text-xs sm:text-sm leading-relaxed text-zinc-400">
                Drill down into ball-by-ball datasets, explore scorecard statistics, and converse with an AI analyst directly trained on PSL match histories.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/matches" className="px-5 py-3 text-xs font-bold bg-white text-zinc-950 rounded hover:bg-slate-200 transition duration-150">
                Browse Scorecards
              </Link>
              <Link href="/chat" className="px-5 py-3 text-xs font-bold border border-zinc-800 bg-zinc-950 text-zinc-300 rounded hover:bg-zinc-900 transition duration-150">
                Open AI Analyst
              </Link>
            </div>

            {/* Micro status feed */}
            <div className="border-t border-zinc-900 pt-4 flex gap-8 text-[11px] font-mono text-zinc-500 uppercase">
              <div>
                <p>Telemetry Status</p>
                <p className={`font-bold mt-1 ${isOnline ? "text-turf-emerald" : "text-ball-crimson"}`}>
                  {isOnline ? "OPERATIONAL" : "API OFFLINE"}
                </p>
              </div>
              <div className="h-6 w-px bg-zinc-900" />
              <div>
                <p>Loaded matches</p>
                <p className="font-bold mt-1 text-white">{matchData.count}</p>
              </div>
            </div>
          </div>

          {/* HIGH-FIDELITY SVG PITCH DIAGRAM */}
          <div className="premium-sports-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-3 left-3 text-[9px] font-mono text-zinc-600">TACTICAL_SCHEMATIC_2D</div>
            
            {/* SVG Cricviz Plotter */}
            <svg viewBox="0 0 200 200" className="w-full max-w-[240px] aspect-ratio mt-4">
              {/* Outfield ring */}
              <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1.5" />
              
              {/* 30-yard fielding ring */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeDasharray="3,3" strokeWidth="1.5" />
              
              {/* Pitch */}
              <rect x="91" y="65" width="18" height="70" fill="rgba(14, 18, 27, 0.9)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" rx="1" />
              
              {/* Crease lines */}
              <line x1="91" y1="73" x2="109" y2="73" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
              <line x1="91" y1="127" x2="109" y2="127" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
              
              {/* Stumps */}
              <circle cx="97" cy="70" r="1" fill="#f43f5e" />
              <circle cx="100" cy="70" r="1" fill="#f43f5e" />
              <circle cx="103" cy="70" r="1" fill="#f43f5e" />
              
              <circle cx="97" cy="130" r="1" fill="#f43f5e" />
              <circle cx="100" cy="130" r="1" fill="#f43f5e" />
              <circle cx="103" cy="130" r="1" fill="#f43f5e" />

              {/* Fielding nodes */}
              {/* Wicketkeeper (WK) */}
              <circle cx="100" cy="50" r="4" fill="#090a0f" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
              <text x="100" y="52" fill="rgba(255, 255, 255, 0.7)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">WK</text>

              {/* Bowler (BO) */}
              <circle cx="100" cy="150" r="4" fill="#090a0f" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
              <text x="100" y="152" fill="rgba(255, 255, 255, 0.7)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">BO</text>

              {/* Point (PT) */}
              <circle cx="50" cy="100" r="4" fill="#090a0f" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" />
              <text x="50" y="102" fill="rgba(16, 185, 129, 0.8)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PT</text>

              {/* Mid-Wicket (MW) */}
              <circle cx="150" cy="100" r="4" fill="#090a0f" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" />
              <text x="150" y="102" fill="rgba(16, 185, 129, 0.8)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MW</text>

              {/* Slip (SL) */}
              <circle cx="78" cy="58" r="4" fill="#090a0f" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" />
              <text x="78" y="60" fill="rgba(16, 185, 129, 0.8)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SL</text>

              {/* Cover (CV) */}
              <circle cx="122" cy="58" r="4" fill="#090a0f" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.8" />
              <text x="122" y="60" fill="rgba(16, 185, 129, 0.8)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">CV</text>
            </svg>

            <div className="mt-4 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Fielding Coordinates (30y Ring)</p>
            </div>
          </div>

        </section>

        {/* RECENT MATCHES LOGGER */}
        <section className="premium-sports-card p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6">
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">Telemetry Feed</span>
              <h2 className="sports-heading text-lg text-white mt-1">Recent Match scoreboards</h2>
            </div>
            <Link href="/matches" className="text-xs font-bold text-accent-cyan hover:underline">
              Full Archive &rarr;
            </Link>
          </div>

          {matchData.matches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchData.matches.map((match: MatchSummary) => (
                <div
                  key={match.id}
                  className="rounded-lg border border-zinc-900 bg-zinc-950/40 p-4.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono border-b border-zinc-900 pb-2 mb-3">
                    <span>{match.date}</span>
                    <span className="font-bold uppercase text-accent-cyan">{match.match_type || "T20"}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-white tracking-tight uppercase leading-tight">
                    {match.team_1} <br />
                    <span className="text-zinc-600 font-normal text-xs">vs</span> {match.team_2}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-xs pt-2.5 border-t border-zinc-900/50">
                    <span className="text-zinc-500">Winner:</span>
                    <span className="font-bold text-white uppercase tracking-tight">{match.winner || "TBD"}</span>
                  </div>
                  <Link
                    href={`/matches/${match.id}`}
                    className="mt-3 block text-center rounded border border-zinc-800 bg-zinc-950/80 py-1.5 text-[10px] font-bold text-zinc-300 hover:text-white transition duration-150"
                  >
                    View scorecards
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-zinc-500 text-xs font-mono">
              Database contains no matches. Run ingestion script.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
