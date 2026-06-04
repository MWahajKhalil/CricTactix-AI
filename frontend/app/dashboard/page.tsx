import Link from "next/link";
import { getMatches, getTopVenues, getTopWinners } from "@/lib/api";

export const dynamic = "force-dynamic";

type MatchItem = {
  id: number;
  team_1: string;
  team_2: string;
  match_type: string;
  date: string;
  winner: string;
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
        <div className="flex flex-col gap-8">
          
          {/* PREMIUM BANNER HEADER */}
          <div className="premium-sports-card p-6 md:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                Tournament Statistics
              </span>
              <h1 className="sports-heading text-2xl md:text-3xl font-bold text-white mt-1">Analytics Dashboard</h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">Data Index: SQLite &bull; PSL_T20</p>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded bg-turf-emerald px-4 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition">
              Browse Matches
            </Link>
          </div>

          {/* TELEMETRY METRIC WIDGETS */}
          <div className="grid gap-4 sm:grid-cols-3">
            
            <div className="premium-sports-card p-6 border-l-2 border-l-turf-emerald">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Matches Loaded</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-white tracking-tight">{count}</p>
              <span className="mt-2 inline-block text-[9px] font-mono text-zinc-600">DB Cumulative</span>
            </div>

            <div className="premium-sports-card p-6 border-l-2 border-l-accent-cyan">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Franchises Active</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-white tracking-tight">{Object.keys(teamCounts).length}</p>
              <span className="mt-2 inline-block text-[9px] font-mono text-zinc-600">Represented in Matches</span>
            </div>

            <div className="premium-sports-card p-6 border-l-2 border-l-metric-amber">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Primary Match Venue</p>
              <p className="mt-4 font-display text-base font-bold text-white truncate leading-tight uppercase" title={topVenues[0]?.venue}>
                {topVenues[0]?.venue || "N/A"}
              </p>
              <span className="mt-2 inline-block text-[10px] font-mono font-bold text-metric-amber">
                {topVenues[0]?.matches || 0} Matches Played
              </span>
            </div>

          </div>

          {/* LEADERBOARDS GRID */}
          <div className="grid gap-6 xl:grid-cols-3">
            
            {/* PARTICIPATING TEAMS */}
            <div className="premium-sports-card p-5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 text-[10px]">
                <span className="font-display font-bold text-white uppercase tracking-wider">TEAM PARTICIPATION</span>
                <span className="font-mono text-zinc-500">MATCHES</span>
              </div>
              <div className="space-y-4">
                {topTeams.map(([team, val], index) => (
                  <div key={team} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-white uppercase truncate max-w-[150px]">{team}</span>
                      </span>
                      <span className="font-bold text-accent-cyan">{val}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
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
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 text-[10px]">
                <span className="font-display font-bold text-white uppercase tracking-wider">WIN LEADERS</span>
                <span className="font-mono text-zinc-500">WINS</span>
              </div>
              <div className="space-y-4">
                {topWinners.map((item: WinnerItem, index: number) => (
                  <div key={item.team} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-white uppercase truncate max-w-[150px]">{item.team}</span>
                      </span>
                      <span className="font-bold text-turf-emerald">{item.wins}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
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
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 text-[10px]">
                <span className="font-display font-bold text-white uppercase tracking-wider">VENUE FREQUENCY</span>
                <span className="font-mono text-zinc-500">COUNT</span>
              </div>
              <div className="space-y-4">
                {topVenues.map((item: TopVenueItem, index: number) => (
                  <div key={item.venue} className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-600 font-bold">[{index + 1}]</span>
                        <span className="font-sans font-semibold text-white uppercase truncate max-w-[150px]">{item.venue}</span>
                      </span>
                      <span className="font-bold text-metric-amber">{item.matches}</span>
                    </div>
                    {/* Meter bar */}
                    <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
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
          <div className="premium-sports-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6">
              <div>
                <h2 className="sports-heading text-base text-white">Telemetry Match Log</h2>
                <p className="text-zinc-500 text-[10px] font-mono mt-0.5">Index of recent matches</p>
              </div>
              <Link href="/matches" className="text-xs font-bold text-accent-cyan hover:underline">
                Full Index &rarr;
              </Link>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matches.slice(0, 6).map((match: MatchItem) => (
                <div
                  key={match.id}
                  className="rounded border border-zinc-900 bg-zinc-950/60 p-4.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mb-3">
                    <span>{match.date}</span>
                    <span className="font-bold uppercase text-accent-cyan">{match.match_type || "T20"}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-white leading-tight uppercase">
                    {match.team_1} <br />
                    <span className="text-zinc-600 font-normal text-xs">vs</span> {match.team_2}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-900/50">
                    <span className="text-zinc-500">Winner:</span>
                    <span className="font-bold text-white uppercase tracking-tight">{match.winner || "TBD"}</span>
                  </div>
                  <Link
                    href={`/matches/${match.id}`}
                    className="mt-3 block text-center rounded border border-zinc-800 bg-zinc-950/80 py-1.5 text-[10px] font-bold text-zinc-300 hover:text-white transition duration-150"
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
