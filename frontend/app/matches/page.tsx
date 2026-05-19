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
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),transparent_30%)] py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Match archive</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Browse PSL matches</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Refine results with team, winner, venue, and year filters, then view match details in one place.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-slate-100">
              View Dashboard
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(14,165,233,0.65)] backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-sky-300">Filter matches</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Find the exact match set</h2>
                </div>
                <button
                  type="submit"
                  form="match-filters"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  Apply filters
                </button>
              </div>

              <form id="match-filters" action="/matches" method="get" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Team / search</label>
                  <input
                    name="team"
                    list="team-aliases"
                    defaultValue={filters.team ?? ""}
                    placeholder="Search teams, venue, city, winner, or opponent"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    If Team 2 is set, this finds Team 1. Otherwise it searches broadly across matches.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Opponent</label>
                  <input
                    name="team_2"
                    list="team-aliases"
                    defaultValue={filters.team_2 ?? ""}
                    placeholder="Opponent team name or alias"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Venue</label>
                  <input
                    name="venue"
                    defaultValue={filters.venue ?? ""}
                    placeholder="Venue"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">City</label>
                  <input
                    name="city"
                    defaultValue={filters.city ?? ""}
                    placeholder="City"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Winner</label>
                  <input
                    name="winner"
                    defaultValue={filters.winner ?? ""}
                    placeholder="Winner name"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Exact year</label>
                  <input
                    name="year"
                    defaultValue={filters.year ?? ""}
                    placeholder="2024"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Year from</label>
                  <input
                    name="year_from"
                    defaultValue={filters.year_from ?? ""}
                    placeholder="2022"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Year to</label>
                  <input
                    name="year_to"
                    defaultValue={filters.year_to ?? ""}
                    placeholder="2024"
                    className="w-full rounded-[1.5rem] border border-zinc-800/80 bg-zinc-950/90 px-5 py-4 text-sm text-white outline-none transition focus:border-sky-400/80 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Leave filters empty to show all matches. If Team 2 is specified, the search field will act as Team 1 lookup.
                  </p>
                </div>
              </form>
              <datalist id="team-aliases">
                {TEAM_ALIAS_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 shadow-xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Top winners</p>
                <div className="mt-4 grid gap-3">
                  {topWinners.map((item: WinnerItem) => (
                    <Link
                      key={item.team}
                      href={`/matches?winner=${encodeURIComponent(item.team)}`}
                      className="inline-flex items-center justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/90 px-4 py-3 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-zinc-800"
                    >
                      <span>{item.team}</span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{item.wins}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 shadow-xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Top venues</p>
                <div className="mt-4 grid gap-3">
                  {topVenues.map((item: TopVenueItem) => (
                    <Link
                      key={item.venue}
                      href={`/matches?venue=${encodeURIComponent(item.venue)}&venue_fuzzy=true`}
                      className="inline-flex items-center justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/90 px-4 py-3 text-sm font-medium text-white transition hover:border-sky-400/40 hover:bg-zinc-800"
                    >
                      <span>{item.venue}</span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{item.matches}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/80 p-5 text-sm text-zinc-300 shadow-inner shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">Page {page}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{count} matches</span>
            </div>
            <div className="text-xs text-zinc-400">Showing {Math.min(count, perPage)} results on this page</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match: MatchItem) => (
              <div
                key={match.id}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/95 shadow-[0_30px_80px_-45px_rgba(14,165,233,0.7)] transition duration-300 hover:-translate-y-1 hover:border-sky-400/40"
              >
                <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-zinc-950 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-sky-300">{match.match_type || "PSL"}</p>
                      <h2 className="mt-2 text-3xl font-semibold text-white">{match.team_1} vs {match.team_2}</h2>
                    </div>
                    <span className="rounded-3xl bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                      {match.date}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/5 p-6 text-sm text-zinc-300">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-[0.69rem] uppercase tracking-[0.28em] text-slate-500">Venue</p>
                      <p className="mt-2 font-semibold text-white">{match.venue || "Unknown"}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-[0.69rem] uppercase tracking-[0.28em] text-slate-500">City</p>
                      <p className="mt-2 font-semibold text-white">{match.city || "Unknown"}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-[0.69rem] uppercase tracking-[0.28em] text-slate-500">Winner</p>
                      <p className="mt-2 font-semibold text-white">{match.winner || "TBD"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/matches/${match.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                    >
                      View details
                    </Link>
                    <span className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                      Score data not available
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-[2rem] border border-dashed border-white/10 bg-zinc-950/80 p-14 text-center text-zinc-400">
              <p className="text-lg font-semibold text-white">No matches found</p>
              <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-500">Try broader filters, alias terms, or clear the current selections to see more matches.</p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-zinc-950/90 p-5 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="rounded-full bg-slate-800 px-3 py-1">Page navigation</span>
            <span>{perPage} matches per page</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildMatchPageUrl(Math.max(1, page - 1))}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page === 1 ? "cursor-not-allowed bg-zinc-800 text-zinc-500" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
            >
              Previous
            </Link>
            <Link
              href={buildMatchPageUrl(Math.min(totalPages, page + 1))}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page >= totalPages ? "cursor-not-allowed bg-zinc-800 text-zinc-500" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
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
