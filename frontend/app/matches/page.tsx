import Link from "next/link";
import { getMatches, getTopVenues, getTopWinners } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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
  date: string;
  venue: string;
  city: string;
  winner: string;
  has_scorecard?: boolean;
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-text-muted uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                Data Archives
              </span>
              <h1 className="sports-heading text-2xl font-bold text-header-text mt-1.5">Match Index</h1>
              <p className="text-xs text-text-muted font-mono mt-1">Total count: {count} matches available</p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded border border-border-color bg-bg-secondary px-4 py-2 text-xs font-semibold text-text-muted hover:text-header-text transition duration-150">
              Tournament Stats
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            
            {/* SEARCH CONSOLE */}
            <div className="premium-sports-card p-6 bg-bg-secondary/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-4 mb-6">
                <div>
                  <h2 className="sports-heading text-base text-header-text">Refine Matches</h2>
                  <p className="text-text-muted text-[10px] font-mono mt-0.5">Filter the PSL database</p>
                </div>
                <button
                  type="submit"
                  form="match-filters"
                  className="inline-flex items-center justify-center rounded bg-turf-emerald px-4 py-2 text-xs font-bold text-white dark:text-zinc-950 hover:opacity-90 transition"
                >
                  Apply Filters
                </button>
              </div>

              <form id="match-filters" action="/matches" method="get" className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Query / Team</label>
                  <input
                    name="team"
                    list="team-aliases"
                    defaultValue={filters.team ?? ""}
                    placeholder="Search teams, venue, city, winner..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Opponent</label>
                  <input
                    name="team_2"
                    list="team-aliases"
                    defaultValue={filters.team_2 ?? ""}
                    placeholder="Opponent team..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Venue</label>
                  <input
                    name="venue"
                    defaultValue={filters.venue ?? ""}
                    placeholder="Stadium name..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">City</label>
                  <input
                    name="city"
                    defaultValue={filters.city ?? ""}
                    placeholder="City name..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Winner</label>
                  <input
                    name="winner"
                    defaultValue={filters.winner ?? ""}
                    placeholder="Winning team..."
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Exact Year</label>
                  <input
                    name="year"
                    defaultValue={filters.year ?? ""}
                    placeholder="E.g., 2024"
                    className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">Year Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="year_from"
                      defaultValue={filters.year_from ?? ""}
                      placeholder="From"
                      className="w-full rounded premium-input px-3 py-3 text-xs text-center text-header-text"
                    />
                    <input
                      name="year_to"
                      defaultValue={filters.year_to ?? ""}
                      placeholder="To"
                      className="w-full rounded premium-input px-3 py-3 text-xs text-center text-header-text"
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

            {/* SIDEBAR */}
            <div className="flex flex-col gap-6">
              
              {/* TOP WINNERS */}
              <div className="premium-sports-card p-5">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-header-text border-b border-border-color pb-2.5">Top Winners</p>
                <div className="mt-4 grid gap-2">
                  {topWinners.map((item: WinnerItem) => (
                    <Link
                      key={item.team}
                      href={`/matches?winner=${encodeURIComponent(item.team)}`}
                      className="flex items-center justify-between rounded border border-border-color bg-bg-secondary/40 px-4 py-2.5 text-xs text-text-muted hover:border-turf-emerald/20 hover:text-header-text transition duration-150"
                    >
                      <span className="truncate max-w-[170px]" title={item.team}>{item.team}</span>
                      <span className="rounded bg-emerald-950/20 px-2 py-0.5 text-[9px] font-bold text-turf-emerald">{item.wins} wins</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* TOP VENUES */}
              <div className="premium-sports-card p-5">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-header-text border-b border-border-color pb-2.5">Top Venues</p>
                <div className="mt-4 grid gap-2">
                  {topVenues.map((item: TopVenueItem) => (
                    <Link
                      key={item.venue}
                      href={`/matches?venue=${encodeURIComponent(item.venue)}&venue_fuzzy=true`}
                      className="flex items-center justify-between rounded border border-border-color bg-bg-secondary/40 px-4 py-2.5 text-xs text-text-muted hover:border-turf-emerald/20 hover:text-header-text transition duration-150"
                    >
                      <span className="truncate max-w-[170px]" title={item.venue}>{item.venue}</span>
                      <span className="rounded bg-cyan-950/20 px-2 py-0.5 text-[9px] font-bold text-accent-cyan">{item.matches} matches</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* RESULTS PAGINATION HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted font-mono border-t border-b border-border-color py-4 my-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-bg-secondary px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-accent-cyan border border-border-color">Page {page} of {totalPages}</span>
              <span className="rounded bg-bg-secondary px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-turf-emerald border border-border-color">{count} matches found</span>
            </div>
            <div>Showing {Math.min(count, perPage)} results on this page</div>
          </div>

          {/* MATCH CARDS GRID */}
          <div className="grid gap-6 md:grid-cols-2">
            {matches.length > 0 ? (
              matches.map((match: MatchItem) => (
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
                    className="sports-btn mt-3 w-full text-center"
                  >
                    View Scorecard
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded border border-dashed border-border-color bg-bg-secondary/40 p-12 text-center text-text-muted text-xs font-mono">
                NO MATCHES FOUND FOR SPECIFIED FILTERS.
              </div>
            )}
          </div>

          {/* PAGINATION PANEL */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-color pt-6 text-xs font-mono text-text-muted">
            <div>
              <span>PAGE NAVIGATION</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={buildMatchPageUrl(Math.max(1, page - 1))}
                className={`rounded border border-border-color px-3.5 py-1.5 text-[10px] font-bold uppercase transition ${page === 1 ? "pointer-events-none bg-bg-secondary text-text-muted/40" : "bg-header-text text-background hover:opacity-90"}`}
              >
                Prev
              </Link>
              <Link
                href={buildMatchPageUrl(Math.min(totalPages, page + 1))}
                className={`rounded border border-border-color px-3.5 py-1.5 text-[10px] font-bold uppercase transition ${page >= totalPages ? "pointer-events-none bg-bg-secondary text-text-muted/40" : "bg-header-text text-background hover:opacity-90"}`}
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
