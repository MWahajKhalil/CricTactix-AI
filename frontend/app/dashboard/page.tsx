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
  const leadingVenue = topVenues[0];

  // Helper to find max wins to compute progress percentages
  const maxWins = topWinners.length > 0 ? Math.max(...topWinners.map(w => w.wins)) : 1;
  const maxMatchesVenue = topVenues.length > 0 ? Math.max(...topVenues.map(v => v.matches)) : 1;
  const maxTeamAppearances = topTeams.length > 0 ? Math.max(...topTeams.map(([, c]) => c)) : 1;

  return (
    <div className="relative overflow-hidden py-12">
      {/* Decorative radial glows */}
      <div className="absolute top-1/4 left-10 w-[300px] h-[300px] bg-accent-green/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[350px] h-[350px] bg-accent-cyan/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          
          {/* HEADER SECTION */}
          <div className="glass-sports-card p-6 md:p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-accent-green">Analytics Console</p>
              <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-white tracking-tight">Tournament Snapshot</h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm text-zinc-400">
                Aggregated insights compiled from the loaded Cricsheet match deliveries database.
              </p>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded-xl bg-accent-green px-5 py-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition shadow-md shadow-accent-green/20">
              Browse Match Cards
            </Link>
          </div>

          {/* METRIC SCOREBOARDS */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-sports-card p-6 border-l-4 border-l-accent-green">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Total Matches Loaded</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-white tracking-tight">{count}</p>
              <div className="mt-2 h-1 w-12 bg-accent-green rounded-full" />
            </div>

            <div className="glass-sports-card p-6 border-l-4 border-l-accent-cyan">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Teams Represented</p>
              <p className="mt-4 font-display text-4xl font-extrabold text-white tracking-tight">{Object.keys(teamCounts).length}</p>
              <div className="mt-2 h-1 w-12 bg-accent-cyan rounded-full" />
            </div>

            <div className="glass-sports-card p-6 border-l-4 border-l-accent-yellow">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Top Match Venue</p>
              <p className="mt-4 font-display text-xl font-bold text-white truncate leading-tight" title={leadingVenue?.venue || "N/A"}>
                {leadingVenue?.venue || "N/A"}
              </p>
              <p className="mt-2 text-xs text-accent-yellow font-semibold">{leadingVenue?.matches || 0} matches</p>
            </div>
          </div>

          {/* DETAILED STATISTICS TABLES */}
          <div className="grid gap-6 xl:grid-cols-3">
            
            {/* TOP TEAMS */}
            <section className="glass-sports-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">Top Teams by Matches</h2>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">Roster Count</span>
                </div>
                <div className="mt-6 space-y-5">
                  {topTeams.map(([team, val], index) => (
                    <div key={team} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-950 text-accent-green font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[150px]" title={team}>{team}</span>
                        </span>
                        <span className="font-bold text-white">{val}</span>
                      </div>
                      {/* Meter bar */}
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-green to-emerald-500 rounded-full" 
                          style={{ width: `${(val / maxTeamAppearances) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TOP WINNERS */}
            <section className="glass-sports-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">Top Winning Teams</h2>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">Win count</span>
                </div>
                <div className="mt-6 space-y-5">
                  {topWinners.map((item: WinnerItem, index: number) => (
                    <div key={item.team} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-cyan-950 text-accent-cyan font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[150px]" title={item.team}>{item.team}</span>
                        </span>
                        <span className="font-bold text-white">{item.wins}</span>
                      </div>
                      {/* Meter bar */}
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-cyan to-cyan-500 rounded-full" 
                          style={{ width: `${(item.wins / maxWins) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TOP VENUES */}
            <section className="glass-sports-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">Frequently Used Venues</h2>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded">Venue count</span>
                </div>
                <div className="mt-6 space-y-5">
                  {topVenues.map((item: TopVenueItem, index: number) => (
                    <div key={item.venue} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-950 text-accent-yellow font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[150px]" title={item.venue}>{item.venue}</span>
                        </span>
                        <span className="font-bold text-white">{item.matches}</span>
                      </div>
                      {/* Meter bar */}
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-yellow to-amber-500 rounded-full" 
                          style={{ width: `${(item.matches / maxMatchesVenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RECENT MATCHES LOG */}
          <section className="glass-sports-card p-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
              <div>
                <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">Recent Match Results</h2>
                <p className="text-zinc-500 text-[11px] mt-1">Direct link to innings scorecard and aggregated match reviews.</p>
              </div>
              <Link href="/matches" className="text-xs font-bold text-accent-cyan hover:underline">
                View Match Archive &rarr;
              </Link>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {matches.slice(0, 6).map((match: MatchItem) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="group block rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 hover:border-emerald-500/20 hover:bg-zinc-900/40 transition"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{match.match_type || "T20"}</p>
                  <p className="mt-2 font-display text-sm font-bold text-white group-hover:text-accent-green transition leading-snug">
                    {match.team_1} <br />
                    <span className="text-zinc-600 font-normal text-xs">vs</span> {match.team_2}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                    <span>{match.date}</span>
                    <span className="font-semibold text-white bg-zinc-900 px-2 py-0.5 rounded truncate max-w-[100px]">{match.winner || "TBD"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
