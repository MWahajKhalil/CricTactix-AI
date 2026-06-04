import Link from "next/link";
import { getMatches, getTopVenues, getTopWinners } from "@/lib/api";

export const dynamic = "force-dynamic";

const TEAM_ALIAS_OPTIONS = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Rawalpindi",
  "Hyderabad",
];

type MatchItem = {
  id: number;
  team_1: string;
  team_2: string;
  match_type: string;
  date: string;
  venue: string;
  city: string;
  winner: string;
  has_scorecard?: boolean;
};

type WinnerItem = {
  team: string;
  wins: number;
};

type TopVenueItem = {
  venue: string;
  matches: number;
};

type MatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams?.page || "1"));
  const perPage = 12;
  const filters = {
    team: Array.isArray(resolvedSearchParams?.team)
      ? resolvedSearchParams.team[0]
      : resolvedSearchParams?.team,
    team_2: Array.isArray(resolvedSearchParams?.team_2)
      ? resolvedSearchParams.team_2[0]
      : resolvedSearchParams?.team_2,
    winner: Array.isArray(resolvedSearchParams?.winner)
      ? resolvedSearchParams.winner[0]
      : resolvedSearchParams?.winner,
    city: Array.isArray(resolvedSearchParams?.city)
      ? resolvedSearchParams.city[0]
      : resolvedSearchParams?.city,
    venue: Array.isArray(resolvedSearchParams?.venue)
      ? resolvedSearchParams.venue[0]
      : resolvedSearchParams?.venue,
    year: Array.isArray(resolvedSearchParams?.year)
      ? resolvedSearchParams.year[0]
      : resolvedSearchParams?.year,
    year_from: Array.isArray(resolvedSearchParams?.year_from)
      ? resolvedSearchParams.year_from[0]
      : resolvedSearchParams?.year_from,
    year_to: Array.isArray(resolvedSearchParams?.year_to)
      ? resolvedSearchParams.year_to[0]
      : resolvedSearchParams?.year_to,
  };

  const { count, matches } = await getMatches(page, perPage, filters);
  const totalPages = Math.max(1, Math.ceil(count / perPage));
  const topWinnersData = await getTopWinners(5);
  const topWinners = (topWinnersData.top_winners || []) as WinnerItem[];
  const topVenuesData = await getTopVenues(5);
  const topVenues = (topVenuesData.top_venues || []) as TopVenueItem[];

  const buildMatchPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    params.set("page", String(pageNumber));
    if (filters.team) params.set("team", filters.team);
    if (filters.team_2) params.set("team_2", filters.team_2);
    if (filters.winner) params.set("winner", filters.winner);
    if (filters.city) params.set("city", filters.city);
    if (filters.venue) params.set("venue", filters.venue);
    if (filters.year) {
      params.set("year", filters.year);
    } else {
      if (filters.year_from) params.set("year_from", filters.year_from);
      if (filters.year_to) params.set("year_to", filters.year_to);
    }
    return `/matches?${params.toString()}`;
  };

  return (
    <div className="relative overflow-hidden py-12">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          
          {/* HEADER BANNER */}
          <div className="premium-sports-card p-6 md:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                Data Archives
              </span>
              <h1 className="sports-heading text-2xl font-bold text-white mt-1">Match Index</h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">Total count: {count} matches active</p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition duration-150">
              Tournament Stats
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            
            {/* SEARCH CONSOLE (PREMIUM GLASS STYLE) */}
            <div className="premium-sports-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6">
                <div>
                  <h2 className="sports-heading text-base text-white">Refine Matches</h2>
                  <p className="text-zinc-500 text-[10px] font-mono mt-0.5">Filter matching database entities</p>
                </div>
                <button
                  type="submit"
                  form="match-filters"
                  className="inline-flex items-center justify-center rounded bg-turf-emerald px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition"
                >
                  Apply Filters
                </button>
              </div>

              <form id="match-filters" action="/matches" method="get" className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Query / Team</label>
                  <input
                    name="team"
                    list="team-aliases"
                    defaultValue={filters.team ?? ""}
                    placeholder="Search teams, venue, city, winner..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Opponent</label>
                  <input
                    name="team_2"
                    list="team-aliases"
                    defaultValue={filters.team_2 ?? ""}
                    placeholder="Opponent team..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Venue</label>
                  <input
                    name="venue"
                    defaultValue={filters.venue ?? ""}
                    placeholder="Stadium name..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">City</label>
                  <input
                    name="city"
                    defaultValue={filters.city ?? ""}
                    placeholder="City name..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Winner</label>
                  <input
                    name="winner"
                    defaultValue={filters.winner ?? ""}
                    placeholder="Winning team..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Exact Year</label>
                  <input
                    name="year"
                    defaultValue={filters.year ?? ""}
                    placeholder="E.g., 2024"
                    className="w-full rounded premium-input px-4 py-3 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Year Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="year_from"
                      defaultValue={filters.year_from ?? ""}
                      placeholder="From"
                      className="w-full rounded premium-input px-3 py-3 text-xs text-center text-white"
                    />
                    <input
                      name="year_to"
                      defaultValue={filters.year_to ?? ""}
                      placeholder="To"
                      className="w-full rounded premium-input px-3 py-3 text-xs text-center text-white"
                    />
                  </div>
                </div>
              </form>
              <datalist id="team-aliases">
                {TEAM_ALIAS_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            {/* SIDEBAR telemetry widgets */}
            <div className="flex flex-col gap-6">
              
              {/* TOP WINNERS */}
              <div className="premium-sports-card p-5">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2.5">Top Winners</p>
                <div className="mt-4 grid gap-2">
                  {topWinners.map((item: WinnerItem) => (
                    <Link
                      key={item.team}
                      href={`/matches?winner=${encodeURIComponent(item.team)}`}
                      className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 hover:border-turf-emerald/20 hover:text-white transition duration-150"
                    >
                      <span className="truncate max-w-[170px]" title={item.team}>{item.team}</span>
                      <span className="rounded bg-emerald-950/50 px-2 py-0.5 text-[9px] font-bold text-turf-emerald">{item.wins} wins</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* TOP VENUES */}
              <div className="premium-sports-card p-5">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2.5">Top Venues</p>
                <div className="mt-4 grid gap-2">
                  {topVenues.map((item: TopVenueItem) => (
                    <Link
                      key={item.venue}
                      href={`/matches?venue=${encodeURIComponent(item.venue)}&venue_fuzzy=true`}
                      className="flex items-center justify-between rounded border border-zinc-900 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 hover:border-turf-emerald/20 hover:text-white transition duration-150"
                    >
                      <span className="truncate max-w-[170px]" title={item.venue}>{item.venue}</span>
                      <span className="rounded bg-cyan-950/50 px-2 py-0.5 text-[9px] font-bold text-accent-cyan">{item.matches} matches</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* TELEMETRY RESULTS PAGINATION HEADER */}
          <div className="premium-sports-card p-4 rounded text-xs text-zinc-400 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-zinc-950 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-accent-cyan border border-zinc-900">Page {page} of {totalPages}</span>
                <span className="rounded bg-zinc-950 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-turf-emerald border border-zinc-900">{count} matches matched</span>
              </div>
              <div>Showing {Math.min(count, perPage)} results on this page</div>
            </div>
          </div>

          {/* BROADCAST TICKET MATCH CARDS */}
          <div className="grid gap-6 md:grid-cols-2">
            {matches.length > 0 ? (
              matches.map((match: MatchItem) => (
                <div
                  key={match.id}
                  className="group premium-sports-card flex flex-col justify-between"
                >
                  {/* Match ticker header */}
                  <div className="bg-zinc-950/40 p-5 border-b border-zinc-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-accent-cyan px-2 py-0.5 bg-accent-cyan/10 rounded">
                          {match.match_type || "T20"}
                        </span>
                        <h2 className="mt-2 font-display text-lg font-bold text-white leading-tight uppercase group-hover:text-turf-emerald transition duration-150">
                          {match.team_1} <br />
                          <span className="text-zinc-600 font-normal text-sm">vs</span> {match.team_2}
                        </h2>
                      </div>
                      <span className="rounded border border-zinc-900 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono text-zinc-500 self-start">
                        {match.date}
                      </span>
                    </div>
                  </div>
                  
                  {/* Match stats info */}
                  <div className="p-5 space-y-4">
                    <div className="grid gap-2 grid-cols-3 text-[11px] font-mono">
                      <div className="rounded bg-zinc-950/60 border border-zinc-900/50 p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Venue</p>
                        <p className="mt-1 font-bold text-white truncate" title={match.venue}>{match.venue || "Unknown"}</p>
                      </div>
                      <div className="rounded bg-zinc-950/60 border border-zinc-900/50 p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">City</p>
                        <p className="mt-1 font-bold text-white truncate" title={match.city}>{match.city || "Unknown"}</p>
                      </div>
                      <div className="rounded bg-zinc-950/60 border border-zinc-900/50 p-2.5">
                        <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Winner</p>
                        <p className="mt-1 font-bold text-accent-yellow truncate" title={match.winner}>{match.winner || "TBD"}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900/50">
                      <Link
                        href={`/matches/${match.id}`}
                        className="inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition duration-150"
                      >
                        View Scorecard &rarr;
                      </Link>
                      
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className={`h-1.5 w-1.5 rounded-full ${match.has_scorecard ? "bg-turf-emerald animate-pulse" : "bg-zinc-700"}`} />
                        <span>
                          {match.has_scorecard ? "DELIVERIES_OK" : "NO_BALL_DATA"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded border border-dashed border-zinc-900 bg-zinc-950/40 p-12 text-center text-zinc-500 text-xs font-mono">
                NO MATCHES FOUND FOR SPECIFIED FILTERS.
              </div>
            )}
          </div>

          {/* PAGINATION PANEL */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-zinc-900 bg-zinc-950/60 p-4 text-xs font-mono text-zinc-500">
            <div>
              <span>PAGE CONTROL OVERLAY</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildMatchPageUrl(Math.max(1, page - 1))}
                className={`rounded border border-zinc-900 px-3 py-1.5 text-xs font-bold transition ${page === 1 ? "pointer-events-none bg-zinc-900 text-zinc-700" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
              >
                Prev
              </Link>
              <Link
                href={buildMatchPageUrl(Math.min(totalPages, page + 1))}
                className={`rounded border border-zinc-900 px-3 py-1.5 text-xs font-bold transition ${page >= totalPages ? "pointer-events-none bg-zinc-900 text-zinc-700" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
              >
                Next
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
