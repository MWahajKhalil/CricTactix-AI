import Link from "next/link";
import { getMatchById } from "@/lib/api";
import MatchScorecard from "@/components/MatchScorecard";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
      <div className="min-h-screen py-16 px-6 text-foreground sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl premium-sports-card p-10 text-center rounded-lg">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">DATABASE_LOOKUP_ERR</p>
          <h1 className="sports-heading text-2xl font-bold text-header-text mt-4">Match Record Not Found</h1>
          <p className="mt-4 text-xs text-text-muted font-mono">
            SQLite query returned empty set. Confirm database is seeded and online.
          </p>
          <Link href="/matches" className="mt-8 inline-flex rounded border border-border-color bg-bg-secondary px-5 py-3 text-xs font-bold text-text-muted hover:text-header-text transition">
            Back to Match Index
          </Link>
        </div>
      </div>
    );
  }

  // Extract key performers from scorecard
  let topBatter = { name: "N/A", runs: 0, balls: 0 };
  let topBowler = { name: "N/A", wickets: 0, runs: 999 };

  if (match.scorecard) {
    match.scorecard.innings.forEach((inn: any) => {
      inn.batting.forEach((bat: any) => {
        if (bat.runs > topBatter.runs) {
          topBatter = { name: bat.player, runs: bat.runs, balls: bat.balls };
        }
      });
      inn.bowling.forEach((bowl: any) => {
        if (
          bowl.wickets > topBowler.wickets ||
          (bowl.wickets === topBowler.wickets &&
            bowl.runs_conceded < topBowler.runs &&
            bowl.wickets > 0)
        ) {
          topBowler = {
            name: bowl.player,
            wickets: bowl.wickets,
            runs: bowl.runs_conceded,
          };
        }
      });
    });
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-10">
        
        {/* BANNER HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-turf-emerald uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
              Match Report
            </span>
            <h1 className="sports-heading text-2xl md:text-3xl font-bold text-header-text mt-2 leading-tight">
              {match.team_1} <span className="text-text-muted font-normal">vs</span> {match.team_2}
            </h1>
            <p className="text-[9px] text-text-muted font-mono mt-2 uppercase tracking-wider">
              MATCH_ID: {match.cricsheet_id} &bull; DATE: {formatDate(match.date)}
            </p>
          </div>
          <Link href="/matches" className="inline-flex items-center justify-center rounded border border-border-color bg-bg-secondary px-4 py-2 text-xs font-semibold text-text-muted hover:text-header-text transition duration-150">
            Back to Index
          </Link>
        </div>

        {/* DETAILS GRID */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* VENUE CARD */}
          <div className="premium-sports-card p-5 bg-bg-secondary/10">
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border-color pb-2 mb-4">MATCH VENUE</p>
            <div className="grid gap-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border-color/30">
                <span className="text-[8px] text-text-muted font-bold uppercase block">City</span>
                <span className="font-bold text-header-text">{match.city || "Unknown"}</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-[8px] text-text-muted font-bold uppercase block">Stadium</span>
                <span className="font-bold text-header-text mt-0.5 truncate" title={match.venue}>{match.venue || "Unknown"}</span>
              </div>
            </div>
          </div>

          {/* OUTCOME CARD */}
          <div className="premium-sports-card p-5 bg-bg-secondary/10">
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border-color pb-2 mb-4">MATCH OUTCOME</p>
            <div className="grid gap-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border-color/30">
                <span className="text-[8px] text-text-muted font-bold uppercase block">Winner</span>
                <span className="font-bold text-metric-amber block uppercase tracking-wide truncate max-w-[150px]">{match.winner || "Draw / No Result"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[8px] text-text-muted font-bold uppercase block">Margin</span>
                <span className="font-bold text-header-text">
                  {match.win_by_runs ? `Won by ${match.win_by_runs} runs` : match.win_by_wickets ? `Won by ${match.win_by_wickets} wickets` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* PLAYER OF THE MATCH & KEY DETAILS CARD */}
          <div className="premium-sports-card p-5 bg-bg-secondary/10">
            <p className="font-display text-[10px] font-bold uppercase tracking-widest text-text-muted border-b border-border-color pb-2 mb-4">MATCH AWARDS</p>
            <div className="grid gap-2 text-xs font-mono">
              <div className="flex justify-between items-baseline py-1 border-b border-border-color/30">
                <span className="text-[8px] text-text-muted font-bold uppercase block min-w-[90px]">Man of Match</span>
                <span className="font-bold text-turf-emerald text-right truncate max-w-[150px]" title={match.player_of_match}>
                  {match.player_of_match || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[8px] text-text-muted font-bold uppercase block">Season</span>
                <span className="font-bold text-header-text">{match.season || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ADDITIONAL MATCH DETAILS DROPDOWN */}
        <details className="group premium-sports-card bg-bg-secondary/5 border border-border-color/50 rounded-lg overflow-hidden">
          <summary className="flex items-center justify-between p-4 text-xs font-bold text-text-muted cursor-pointer hover:bg-hover-bg select-none transition">
            <span className="font-display uppercase tracking-widest">Additional Match Information (Toss, Umpires & Officials)</span>
            <span className="transition-transform duration-200 group-open:rotate-180 text-text-muted font-mono font-bold text-[14px]">
              &darr;
            </span>
          </summary>
          <div className="p-5 border-t border-border-color/40 bg-bg-secondary/10 grid gap-6 md:grid-cols-2 text-xs font-mono">
            {/* TOSS DETAILS */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-border-color pb-1.5">Toss Decision</h4>
              <div className="flex justify-between py-1 border-b border-border-color/30">
                <span className="text-text-muted">Toss Winner</span>
                <span className="font-bold text-header-text">{match.toss_winner || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Decision</span>
                <span className="font-bold text-header-text uppercase">{match.toss_decision ? `Elected to ${match.toss_decision}` : "N/A"}</span>
              </div>
            </div>

            {/* MATCH OFFICIALS */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-border-color pb-1.5">Match Officials</h4>
              <div className="flex justify-between py-1 border-b border-border-color/30">
                <span className="text-text-muted">Umpires</span>
                <span className="font-bold text-header-text">{match.umpires && match.umpires.length > 0 ? match.umpires.join(" & ") : "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-color/30">
                <span className="text-text-muted">TV Umpire</span>
                <span className="font-bold text-header-text">{match.tv_umpire || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Match Referee</span>
                <span className="font-bold text-header-text">{match.match_referee || "N/A"}</span>
              </div>
            </div>
          </div>
        </details>

        {/* INNINGS SCORECARDS */}
        {match.scorecard ? (
          <MatchScorecard scorecard={match.scorecard} />
        ) : (
          <div className="premium-sports-card p-12 text-center bg-bg-secondary/10">
            <p className="font-mono text-xs text-text-muted tracking-widest">BALL_BY_BALL_RECORDING_UNAVAILABLE</p>
          </div>
        )}

      </div>
    </div>
  );
}

