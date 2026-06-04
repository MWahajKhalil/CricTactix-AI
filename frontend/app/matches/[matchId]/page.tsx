import Link from "next/link";
import { getMatchById } from "@/lib/api";

export const dynamic = "force-dynamic";

type BattingStat = {
  player: string;
  runs: number;
  balls: number;
  strike_rate: number;
};

type BowlingStat = {
  player: string;
  overs: string;
  runs_conceded: number;
  wickets: number;
  economy: number;
};

type Innings = {
  innings_number: number;
  batting_team: string;
  bowling_team: string;
  batting: BattingStat[];
  bowling: BowlingStat[];
  total_runs: number;
  wickets: number;
  extras: number;
  overs: string;
};

type MatchDetailPageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const resolvedParams = await params;
  const match = await getMatchById(resolvedParams.matchId).catch(() => null);

  if (!match) {
    return (
      <div className="min-h-screen py-16 px-6 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl premium-sports-card p-10 text-center rounded-lg">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">DATABASE_LOOKUP_ERR</p>
          <h1 className="sports-heading text-2xl font-bold text-white mt-4">Match Record Not Found</h1>
          <p className="mt-4 text-xs text-zinc-400 font-mono">
            SQLite query returned empty set. Confirm database is seeded and online.
          </p>
          <Link href="/matches" className="mt-8 inline-flex rounded border border-zinc-800 bg-zinc-950 px-5 py-3 text-xs font-bold text-zinc-300 hover:text-white transition">
            Back to Match Index
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-8">
        
        {/* PREMIUM BANNER HEADER */}
        <div className="premium-sports-card p-6 md:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b-2 border-b-turf-emerald">
          <div>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
              Match Report
            </span>
            <h1 className="sports-heading text-2xl md:text-3xl font-bold text-white mt-2 leading-none">
              {match.team_1} <span className="text-zinc-600 font-normal">vs</span> {match.team_2}
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-1.5 uppercase">
              ID: {match.cricsheet_id} &bull; DATE: {match.date}
            </p>
          </div>
          <Link href="/matches" className="inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition duration-150">
            Back to Index
          </Link>
        </div>

        {/* TOUR DETAILS BOXES */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="premium-sports-card p-5">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2 mb-4">MATCH LOCATION</p>
            <div className="grid gap-3 sm:grid-cols-3 text-xs font-mono">
              <div className="rounded bg-zinc-950/60 border border-zinc-900 p-3">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">City</span>
                <span className="mt-1 font-bold text-white block">{match.city || "Unknown"}</span>
              </div>
              <div className="rounded bg-zinc-950/60 border border-zinc-900 p-3 sm:col-span-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block">Venue</span>
                <span className="mt-1 font-bold text-white block truncate" title={match.venue}>{match.venue || "Unknown"}</span>
              </div>
            </div>
          </div>

          <div className="premium-sports-card p-5 border-l-2 border-l-ball-crimson md:col-span-2">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2 mb-4">MATCH RESULT</p>
            <div className="rounded bg-zinc-950/60 border border-zinc-900 p-3">
              <span className="text-[9px] text-zinc-500 font-bold uppercase block font-mono">WINNER</span>
              <span className="mt-1 font-display text-base font-bold text-metric-amber block truncate uppercase" title={match.winner}>
                {match.winner || "TBD"}
              </span>
            </div>
          </div>
        </div>

        {/* INNINGS SCORECARDS */}
        {match.scorecard ? (
          <div className="space-y-8">
            {match.scorecard.innings.map((innings: Innings) => (
              <section key={innings.innings_number} className="premium-sports-card p-6">
                
                {/* INNINGS LED HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
                      INNINGS_{innings.innings_number}
                    </span>
                    <h2 className="sports-heading text-xl text-white mt-2">{innings.batting_team}</h2>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 uppercase">BOWLED BY: {innings.bowling_team}</p>
                  </div>
                  
                  {/* Scoreboard display */}
                  <div className="flex items-center gap-4 bg-zinc-950/90 border border-zinc-900 px-4 py-3 rounded-lg font-mono">
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">SCORE</p>
                      <p className="text-xl font-bold text-white">{innings.total_runs}/{innings.wickets}</p>
                    </div>
                    <div className="h-6 w-px bg-zinc-900" />
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">OVERS</p>
                      <p className="text-xl font-bold text-accent-cyan">{innings.overs}</p>
                    </div>
                    <div className="h-6 w-px bg-zinc-900" />
                    <div className="text-center">
                      <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">EXTRAS</p>
                      <p className="text-base font-bold text-metric-amber">{innings.extras}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  
                  {/* BATTING SCORECARD */}
                  <div className="rounded border border-zinc-900 bg-zinc-950/30 p-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Batting</h3>
                        <p className="text-[8px] text-zinc-500 font-mono uppercase mt-0.5">{innings.batting_team}</p>
                      </div>
                      <span className="text-[9px] uppercase font-mono text-zinc-500">R &bull; B &bull; SR</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="premium-table">
                        <thead>
                          <tr className="text-zinc-500 font-mono text-[10px]">
                            <th className="pb-2 text-left font-semibold">BATTER</th>
                            <th className="pb-2 text-right font-semibold">RUNS</th>
                            <th className="pb-2 text-right font-semibold">BALLS</th>
                            <th className="pb-2 text-right font-semibold">S/R</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/40 font-sans">
                          {innings.batting.map((bat: BattingStat) => {
                            const isHighSR = bat.strike_rate >= 165 && bat.balls > 5;
                            const isHighScore = bat.runs >= 40;
                            return (
                              <tr key={`${innings.innings_number}-${bat.player}`}>
                                <td className="py-2 text-left font-medium text-white">{bat.player}</td>
                                <td className={`py-2 text-right font-mono font-bold ${isHighScore ? "text-metric-amber" : ""}`}>{bat.runs}</td>
                                <td className="py-2 text-right text-zinc-500 font-mono">{bat.balls}</td>
                                <td className={`py-2 text-right font-mono font-semibold ${isHighSR ? "text-turf-emerald" : "text-zinc-400"}`}>
                                  {bat.strike_rate.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BOWLING SCORECARD */}
                  <div className="rounded border border-zinc-900 bg-zinc-950/30 p-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bowling</h3>
                        <p className="text-[8px] text-zinc-500 font-mono uppercase mt-0.5">{innings.bowling_team}</p>
                      </div>
                      <span className="text-[9px] uppercase font-mono text-zinc-500">O &bull; R &bull; W &bull; Econ</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="premium-table">
                        <thead>
                          <tr className="text-zinc-500 font-mono text-[10px]">
                            <th className="pb-2 text-left font-semibold">BOWLER</th>
                            <th className="pb-2 text-right font-semibold">OVERS</th>
                            <th className="pb-2 text-right font-semibold">RUNS</th>
                            <th className="pb-2 text-right font-semibold">WKTS</th>
                            <th className="pb-2 text-right font-semibold">ECON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/40 font-sans">
                          {innings.bowling.map((bowl: BowlingStat) => {
                            const isLowEcon = bowl.economy <= 6.5 && bowl.overs !== "0.0";
                            const isHighWkts = bowl.wickets >= 3;
                            return (
                              <tr key={`${innings.innings_number}-${bowl.player}`}>
                                <td className="py-2 text-left font-medium text-white">{bowl.player}</td>
                                <td className="py-2 text-right text-zinc-500 font-mono">{bowl.overs}</td>
                                <td className="py-2 text-right text-zinc-500 font-mono">{bowl.runs_conceded}</td>
                                <td className={`py-2 text-right font-mono font-bold ${isHighWkts ? "text-ball-crimson" : "text-white"}`}>
                                  {bowl.wickets}
                                </td>
                                <td className={`py-2 text-right font-mono font-semibold ${isLowEcon ? "text-turf-emerald" : "text-zinc-400"}`}>
                                  {bowl.economy.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="premium-sports-card p-10 text-center rounded-lg">
            <p className="font-mono text-xs text-zinc-500">BALL_BY_BALL_RECORDING_UNAVAILABLE</p>
          </div>
        )}

      </div>
    </div>
  );
}
