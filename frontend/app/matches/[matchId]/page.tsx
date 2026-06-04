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
        <div className="mx-auto max-w-3xl glass-sports-card p-10 text-center">
          <p className="font-display text-xs uppercase tracking-widest text-zinc-500">Telemetry Error</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Match Details Unavailable</h1>
          <p className="mt-4 text-xs sm:text-sm text-zinc-400">
            This match is either missing from the SQLite database or the backend service is currently offline.
          </p>
          <Link href="/matches" className="mt-8 inline-flex rounded-xl bg-accent-green px-5 py-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition">
            Back to Match Archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl flex flex-col gap-8">
        
        {/* HEADER BLOCK */}
        <div className="glass-sports-card p-6 md:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan px-2.5 py-0.5 bg-accent-cyan/10 rounded">
              Scorecard Analysis
            </span>
            <h1 className="mt-3 font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {match.team_1} <span className="text-zinc-600 font-normal">vs</span> {match.team_2}
            </h1>
            <p className="mt-2 text-xs text-zinc-500 font-medium">
              ID: {match.cricsheet_id} &bull; Match Date: {match.date}
            </p>
          </div>
          <Link href="/matches" className="inline-flex items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 px-5 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-900 transition">
            Back to Matches
          </Link>
        </div>

        {/* DETAILS SUMMARIES */}
        <div className="grid gap-6 md:grid-cols-3">
          
          <div className="glass-sports-card p-5 md:col-span-2">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900/60 pb-2.5 mb-4">Venue & City</p>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl bg-zinc-950/60 border border-zinc-900/50 p-4">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">City</span>
                <span className="mt-2 font-display text-sm font-bold text-white block">{match.city || "Unknown"}</span>
              </div>
              <div className="rounded-xl bg-zinc-950/60 border border-zinc-900/50 p-4 sm:col-span-2">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Venue</span>
                <span className="mt-2 font-display text-sm font-bold text-white block truncate" title={match.venue}>{match.venue || "Unknown"}</span>
              </div>
            </div>
          </div>

          <div className="glass-sports-card p-5 border-l-4 border-l-accent-green">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900/60 pb-2.5 mb-4">Result Summary</p>
            <div className="rounded-xl bg-zinc-950/60 border border-zinc-900/50 p-4">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Winner</span>
              <span className="mt-2 font-display text-lg font-bold text-accent-green neon-glow-green block truncate" title={match.winner}>
                {match.winner || "TBD"}
              </span>
            </div>
          </div>

        </div>

        {/* SCORECARD INNINGS BLOCKS */}
        {match.scorecard ? (
          <div className="space-y-10">
            {match.scorecard.innings.map((innings: Innings) => (
              <section key={innings.innings_number} className="glass-sports-card p-6 relative overflow-hidden">
                
                {/* INNINGS HEADER METRICS */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-5 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan px-2.5 py-0.5 bg-accent-cyan/10 rounded">
                      Innings {innings.innings_number}
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold text-white">{innings.batting_team}</h2>
                    <p className="text-xs text-zinc-500 mt-1">Bowling Side: {innings.bowling_team}</p>
                  </div>
                  
                  {/* Gigantic Scoreboard Metrics */}
                  <div className="flex items-center gap-4 bg-zinc-950/90 border border-zinc-900 px-5 py-3.5 rounded-xl font-display">
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Innings Runs</p>
                      <p className="text-2xl font-extrabold text-white">{innings.total_runs}/{innings.wickets}</p>
                    </div>
                    <div className="h-8 w-px bg-zinc-900" />
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Overs</p>
                      <p className="text-2xl font-extrabold text-accent-cyan">{innings.overs}</p>
                    </div>
                    <div className="h-8 w-px bg-zinc-900" />
                    <div className="text-center">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Extras</p>
                      <p className="text-lg font-bold text-accent-yellow">{innings.extras}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  
                  {/* BATTING CARD */}
                  <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/30 p-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Batting Roster</h3>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">{innings.batting_team}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">R &bull; B &bull; SR</span>
                    </div>
                    
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-900 text-xs text-left text-zinc-300">
                        <thead>
                          <tr className="text-zinc-500">
                            <th className="pb-3 font-semibold">Batter</th>
                            <th className="pb-3 text-right font-semibold">Runs</th>
                            <th className="pb-3 text-right font-semibold">Balls</th>
                            <th className="pb-3 text-right font-semibold">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60">
                          {innings.batting.map((bat: BattingStat) => {
                            const isHighSR = bat.strike_rate >= 160 && bat.balls > 5;
                            const isHighScore = bat.runs >= 40;
                            return (
                              <tr key={`${innings.innings_number}-${bat.player}`} className="hover:bg-zinc-950/40">
                                <td className="py-2.5 font-medium text-white">{bat.player}</td>
                                <td className={`py-2.5 text-right font-bold ${isHighScore ? "text-accent-yellow neon-glow-yellow" : ""}`}>{bat.runs}</td>
                                <td className="py-2.5 text-right text-zinc-400">{bat.balls}</td>
                                <td className={`py-2.5 text-right font-semibold ${isHighSR ? "text-accent-green neon-glow-green" : "text-zinc-300"}`}>
                                  {bat.strike_rate.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BOWLING CARD */}
                  <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/30 p-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bowling Arsenal</h3>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">{innings.bowling_team}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">O &bull; R &bull; W &bull; Econ</span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-900 text-xs text-left text-zinc-300">
                        <thead>
                          <tr className="text-zinc-500">
                            <th className="pb-3 font-semibold">Bowler</th>
                            <th className="pb-3 text-right font-semibold">Overs</th>
                            <th className="pb-3 text-right font-semibold">Runs</th>
                            <th className="pb-3 text-right font-semibold">Wkts</th>
                            <th className="pb-3 text-right font-semibold">Econ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60">
                          {innings.bowling.map((bowl: BowlingStat) => {
                            const isLowEcon = bowl.economy <= 6.5 && bowl.overs !== "0.0";
                            const isHighWkts = bowl.wickets >= 3;
                            return (
                              <tr key={`${innings.innings_number}-${bowl.player}`} className="hover:bg-zinc-950/40">
                                <td className="py-2.5 font-medium text-white">{bowl.player}</td>
                                <td className="py-2.5 text-right text-zinc-400">{bowl.overs}</td>
                                <td className="py-2.5 text-right text-zinc-400">{bowl.runs_conceded}</td>
                                <td className={`py-2.5 text-right font-bold ${isHighWkts ? "text-accent-yellow neon-glow-yellow" : "text-white"}`}>
                                  {bowl.wickets}
                                </td>
                                <td className={`py-2.5 text-right font-semibold ${isLowEcon ? "text-accent-green neon-glow-green" : "text-zinc-300"}`}>
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
          <div className="glass-sports-card p-10 text-center">
            <p className="font-display text-lg font-bold text-white">Ball Ingestion Data Unavailable</p>
            <p className="mt-2 text-xs text-zinc-500">This match is loaded as a result-only card and lacks delivery-level data in SQLite.</p>
          </div>
        )}

      </div>
    </div>
  );
}
