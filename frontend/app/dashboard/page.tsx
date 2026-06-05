import Link from "next/link";
import { getMatches, getTopVenues, getTopWinners } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MatchItem = {
  id: number;
  team_1: string;
  team_2: string;
  date: string;
  winner: string;
  venue?: string;
  city?: string;
  player_of_match?: string | null;
  toss_winner?: string | null;
  toss_decision?: string | null;
  win_by_runs?: number | null;
  win_by_wickets?: number | null;
};

type WinnerItem = {
  team: string;
  wins: number;
};

type TopVenueItem = {
  venue: string;
  matches: number;
};

export default async function DashboardPage() {
  const { count, matches } = await getMatches(1, 50);
  const topWinnerResponse = await getTopWinners(5);
  const topVenueResponse = await getTopVenues(5);

  const teamCounts: Record<string, number> = {};

  matches.forEach((match: MatchItem) => {
    teamCounts[match.team_1] = (teamCounts[match.team_1] || 0) + 1;
    teamCounts[match.team_2] = (teamCounts[match.team_2] || 0) + 1;
  });

  const topTeams = Object.entries(teamCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const topWinners = (topWinnerResponse.top_winners || []) as WinnerItem[];
  const topVenues = (topVenueResponse.top_venues || []) as TopVenueItem[];

  // Compute maximum values for progress widths
  const maxWins = topWinners.length > 0 ? Math.max(...topWinners.map(w => w.wins)) : 1;
  const maxMatchesVenue = topVenues.length > 0 ? Math.max(...topVenues.map(v => v.matches)) : 1;
  const maxTeamAppearances = topTeams.length > 0 ? Math.max(...topTeams.map(([, c]) => c)) : 1;

  return (
    <div className="relative overflow-hidden py-12">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10">
          
          {/* BANNER HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-turf-emerald uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                Tournament Stats
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-header-text mt-1.5">Analytics Dashboard</h1>
              <p className="text-xs text-text-muted font-mono mt-1">Data Source: SQLite Database &bull; PSL_T20</p>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded bg-header-text px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition">
              Browse Matches
            </Link>
          </div>

          {/* TELEMETRY METRIC WIDGETS */}
          <div className="grid gap-4 sm:grid-cols-3">
            
            <div className="premium-sports-card p-6 border-l-2 border-l-turf-emerald bg-bg-secondary/10">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">Matches Loaded</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-header-text tracking-tight">{count}</p>
              <span className="mt-2 inline-block text-[9px] font-mono text-text-muted">DB Cumulative</span>
            </div>

            <div className="premium-sports-card p-6 border-l-2 border-l-accent-cyan bg-bg-secondary/10">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">Franchises Active</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-header-text tracking-tight">{Object.keys(teamCounts).length}</p>
              <span className="mt-2 inline-block text-[9px] font-mono text-text-muted">Represented in Matches</span>
            </div>

            <div className="premium-sports-card p-6 border-l-2 border-l-metric-amber bg-bg-secondary/10">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">Primary Match Venue</p>
              <p className="mt-4 font-display text-sm font-bold text-header-text truncate leading-tight uppercase" title={topVenues[0]?.venue}>
                {topVenues[0]?.venue || "N/A"}
              </p>
              <span className="mt-2.5 inline-block text-[10px] font-mono font-bold text-metric-amber">
                {topVenues[0]?.matches || 0} Matches Played
              </span>
            </div>

          </div>

          {/* LEADERBOARDS GRID */}
          <div className="grid gap-6 xl:grid-cols-3">
            
            {/* PARTICIPATING TEAMS */}
            <div className="premium-sports-card p-5">
              <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4 text-[9px]">
                <span className="font-display font-bold text-header-text uppercase tracking-wider">TEAM PARTICIPATION</span>
                <span className="font-mono text-text-muted">MATCHES</span>
              </div>
              <div className="space-y-4">
                {topTeams.map(([team, val], index) => (
                  <div key={team} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <span className="text-text-muted font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-header-text uppercase truncate max-w-[150px]">{team}</span>
                      </span>
                      <span className="font-bold text-accent-cyan">{val}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-cyan rounded-full" 
                        style={{ width: `${(val / maxTeamAppearances) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP WINNERS */}
            <div className="premium-sports-card p-5">
              <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4 text-[9px]">
                <span className="font-display font-bold text-header-text uppercase tracking-wider">WIN LEADERS</span>
                <span className="font-mono text-text-muted">WINS</span>
              </div>
              <div className="space-y-4">
                {topWinners.map((item: WinnerItem, index: number) => (
                  <div key={item.team} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <span className="text-text-muted font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-header-text uppercase truncate max-w-[150px]">{item.team}</span>
                      </span>
                      <span className="font-bold text-turf-emerald">{item.wins}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-turf-emerald rounded-full" 
                        style={{ width: `${(item.wins / maxWins) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP VENUES */}
            <div className="premium-sports-card p-5">
              <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4 text-[9px]">
                <span className="font-display font-bold text-header-text uppercase tracking-wider">VENUE FREQUENCY</span>
                <span className="font-mono text-text-muted">COUNT</span>
              </div>
              <div className="space-y-4">
                {topVenues.map((item: TopVenueItem, index: number) => (
                  <div key={item.venue} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <span className="text-text-muted font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-header-text uppercase truncate max-w-[150px]">{item.venue}</span>
                      </span>
                      <span className="font-bold text-metric-amber">{item.matches}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-metric-amber rounded-full" 
                        style={{ width: `${(item.matches / maxMatchesVenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RECENT MATCH LOG */}
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border-color pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-header-text">Match Telemetry Log</h2>
                <p className="text-text-muted text-[10px] font-mono mt-0.5">Historical index of ingested PSL fixtures</p>
              </div>
              <Link href="/matches" className="text-xs font-bold text-turf-emerald hover:underline">
                Full Matches Index &rarr;
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matches.slice(0, 6).map((match: MatchItem) => (
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
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


