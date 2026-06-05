import Link from "next/link";
import { checkBackendHealth, getMatches } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type MatchSummary = {
  id: number;
  cricsheet_id: string;
  date: string;
  team_1: string;
  team_2: string;
  winner: string;
  venue: string;
  city?: string;
  player_of_match?: string | null;
  toss_winner?: string | null;
  toss_decision?: string | null;
  win_by_runs?: number | null;
  win_by_wickets?: number | null;
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
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 sm:px-8 lg:px-12 relative">
        
        {/* HERO SECTION + PITCH SVG */}
        <section className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] items-center">
          
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-turf-emerald uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                PSL Database Engine Active
              </span>
              <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-header-text tracking-tight leading-none">
                Cricket Insights <br />
                From the <span className="text-turf-emerald">Crease</span>.
              </h1>
              <p className="max-w-md text-xs sm:text-sm leading-relaxed text-text-muted">
                Analyze ball-by-ball datasets, explore scorecard statistics, and converse with an AI analyst trained on historical PSL match records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/matches" className="px-5 py-3 text-xs font-semibold bg-header-text text-background rounded hover:opacity-90 transition duration-150">
                Browse Scorecards
              </Link>
              <Link href="/chat" className="px-5 py-3 text-xs font-semibold border border-border-color bg-bg-secondary text-foreground rounded hover:bg-hover-bg transition duration-150">
                Open AI Analyst
              </Link>
            </div>

            {/* Micro status feed */}
            <div className="border-t border-border-color pt-6 flex gap-8 text-[10px] font-mono text-text-muted uppercase tracking-wider">
              <div>
                <p>System Engine Status</p>
                <p className={`font-bold mt-1.5 ${isOnline ? "text-turf-emerald" : "text-ball-crimson"}`}>
                  {isOnline ? "OPERATIONAL" : "API OFFLINE"}
                </p>
              </div>
              <div className="h-8 w-px bg-border-color" />
              <div>
                <p>Ingested Matches</p>
                <p className="font-bold mt-1.5 text-header-text">{matchData.count}</p>
              </div>
            </div>
          </div>

          {/* HIGH-FIDELITY SVG PITCH DIAGRAM */}
          <div className="premium-sports-card p-6 flex flex-col items-center justify-center relative overflow-hidden bg-bg-secondary/10">
            <div className="absolute top-3 left-3 text-[8px] font-mono text-text-muted tracking-widest">TACTICAL_SCHEMATIC_2D</div>
            
            {/* SVG Cricviz Plotter */}
            <svg viewBox="0 0 200 200" className="w-full max-w-[240px] aspect-ratio mt-4">
              {/* Outfield ring */}
              <circle cx="100" cy="100" r="95" fill="none" stroke="var(--border-color)" strokeWidth="1.5" />
              
              {/* 30-yard fielding ring */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--turf-emerald)" strokeDasharray="3,3" strokeWidth="1" className="opacity-40" />
              
              {/* Pitch */}
              <rect x="91" y="65" width="18" height="70" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" rx="1" />
              
              {/* Crease lines */}
              <line x1="91" y1="73" x2="109" y2="73" stroke="var(--foreground)" strokeWidth="0.8" className="opacity-30" />
              <line x1="91" y1="127" x2="109" y2="127" stroke="var(--foreground)" strokeWidth="0.8" className="opacity-30" />
              
              {/* Stumps */}
              <circle cx="97" cy="70" r="1" fill="var(--ball-crimson)" />
              <circle cx="100" cy="70" r="1" fill="var(--ball-crimson)" />
              <circle cx="103" cy="70" r="1" fill="var(--ball-crimson)" />
              
              <circle cx="97" cy="130" r="1" fill="var(--ball-crimson)" />
              <circle cx="100" cy="130" r="1" fill="var(--ball-crimson)" />
              <circle cx="103" cy="130" r="1" fill="var(--ball-crimson)" />

              {/* Fielding nodes */}
              {/* Wicketkeeper (WK) */}
              <circle cx="100" cy="50" r="4" fill="var(--background)" stroke="var(--border-color)" strokeWidth="0.8" />
              <text x="100" y="52" fill="var(--header-text)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">WK</text>

              {/* Bowler (BO) */}
              <circle cx="100" cy="150" r="4" fill="var(--background)" stroke="var(--border-color)" strokeWidth="0.8" />
              <text x="100" y="152" fill="var(--header-text)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">BO</text>

              {/* Point (PT) */}
              <circle cx="50" cy="100" r="4" fill="var(--background)" stroke="var(--turf-emerald)" strokeWidth="0.8" />
              <text x="50" y="102" fill="var(--turf-emerald)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">PT</text>

              {/* Mid-Wicket (MW) */}
              <circle cx="150" cy="100" r="4" fill="var(--background)" stroke="var(--turf-emerald)" strokeWidth="0.8" />
              <text x="150" y="102" fill="var(--turf-emerald)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">MW</text>

              {/* Slip (SL) */}
              <circle cx="78" cy="58" r="4" fill="var(--background)" stroke="var(--turf-emerald)" strokeWidth="0.8" />
              <text x="78" y="60" fill="var(--turf-emerald)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SL</text>

              {/* Cover (CV) */}
              <circle cx="122" cy="58" r="4" fill="var(--background)" stroke="var(--turf-emerald)" strokeWidth="0.8" />
              <text x="122" y="60" fill="var(--turf-emerald)" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">CV</text>
            </svg>

            <div className="mt-4 text-center">
              <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-muted">Fielding Coordinates (30y Ring)</p>
            </div>
          </div>

        </section>

        {/* RECENT MATCHES LOGGER */}
        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border-color pb-4">
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Analytics Feed</span>
              <h2 className="font-display text-xl font-bold text-header-text mt-1">Recent PSL Scoreboards</h2>
            </div>
            <Link href="/matches" className="text-xs font-bold text-turf-emerald hover:underline">
              Browse Full Archive &rarr;
            </Link>
          </div>
          {matchData.matches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchData.matches.map((match: MatchSummary) => (
                <div
                  key={match.id}
                  className="sports-match-card"
                >
                  <div className="flex items-center justify-between text-[9px] text-text-muted font-mono border-b border-border-color pb-2 mb-3.5">
                    <span>{formatDate(match.date)}</span>
                    {match.player_of_match && (
                      <span className="font-bold text-turf-emerald uppercase tracking-wider" title="Player of the Match">
                        ★ {match.player_of_match}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2.5 py-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-xs font-bold uppercase tracking-tight ${match.winner === match.team_1 ? 'text-header-text font-extrabold' : 'text-text-muted/80 font-medium'}`}>
                        {match.team_1}
                      </span>
                      {match.winner === match.team_1 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-turf-emerald" />
                          <span className="text-[8px] font-mono font-bold text-turf-emerald uppercase tracking-wider">WINNER</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-display text-xs font-bold uppercase tracking-tight ${match.winner === match.team_2 ? 'text-header-text font-extrabold' : 'text-text-muted/80 font-medium'}`}>
                        {match.team_2}
                      </span>
                      {match.winner === match.team_2 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-turf-emerald" />
                          <span className="text-[8px] font-mono font-bold text-turf-emerald uppercase tracking-wider">WINNER</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Match Details */}
                  <details className="group mt-4 border-t border-border-color/50 pt-2 text-[10px] font-mono">
                    <summary className="flex items-center justify-between py-1 text-text-muted cursor-pointer hover:text-header-text select-none transition">
                      <span className="text-[8px] font-bold uppercase tracking-wider">Match Info</span>
                      <span className="transition-transform duration-200 group-open:rotate-180 text-[10px]">&darr;</span>
                    </summary>
                    <div className="mt-2 space-y-1.5 pb-2 text-foreground/90">
                      {match.venue && (
                        <div className="flex justify-between py-0.5 border-b border-border-color/30">
                          <span className="text-text-muted">Venue</span>
                          <span className="text-right truncate max-w-[150px]" title={match.venue}>{match.venue}</span>
                        </div>
                      )}
                      {match.city && (
                        <div className="flex justify-between py-0.5 border-b border-border-color/30">
                          <span className="text-text-muted">City</span>
                          <span>{match.city}</span>
                        </div>
                      )}
                      {match.toss_winner && (
                        <div className="flex justify-between py-0.5 border-b border-border-color/30">
                          <span className="text-text-muted">Toss</span>
                          <span className="text-right truncate max-w-[150px]" title={match.toss_winner}>
                            {match.toss_winner} ({match.toss_decision === 'field' ? 'Bowl' : 'Bat'})
                          </span>
                        </div>
                      )}
                      {(match.win_by_runs || match.win_by_wickets) ? (
                        <div className="flex justify-between py-0.5">
                          <span className="text-text-muted">Margin</span>
                          <span className="font-semibold text-header-text">
                            {match.win_by_runs ? `Won by ${match.win_by_runs} runs` : `Won by ${match.win_by_wickets} wickets`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between py-0.5">
                          <span className="text-text-muted">Margin</span>
                          <span className="font-semibold text-header-text">Draw/No Result</span>
                        </div>
                      )}
                    </div>
                  </details>

                  <Link
                    href={`/matches/${match.id}`}
                    className="sports-btn mt-3 text-center"
                  >
                    View Scorecard
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-color bg-bg-secondary/40 p-8 text-center text-text-muted text-xs font-mono">
              Database contains no matches. Ingest PSL matches to begin.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
