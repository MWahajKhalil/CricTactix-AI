import Link from "next/link";
import { getMatches, getTopWinners } from "@/lib/api";

export const dynamic = "force-dynamic";

type MatchItem = {
  id: number;
  team_1: string;
  team_2: string;
  match_type: string;
  date: string;
  venue: string;
  winner: string;
};

type WinnerItem = {
  team: string;
  wins: number;
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
    winner: Array.isArray(resolvedSearchParams?.winner)
      ? resolvedSearchParams.winner[0]
      : resolvedSearchParams?.winner,
    match_type: Array.isArray(resolvedSearchParams?.match_type)
      ? resolvedSearchParams.match_type[0]
      : resolvedSearchParams?.match_type,
    year: Array.isArray(resolvedSearchParams?.year)
      ? resolvedSearchParams.year[0]
      : resolvedSearchParams?.year,
    venue: Array.isArray(resolvedSearchParams?.venue)
      ? resolvedSearchParams.venue[0]
      : resolvedSearchParams?.venue,
    venue_fuzzy: resolvedSearchParams?.venue_fuzzy === "true",
  };

  const { count, matches } = await getMatches(page, perPage, filters);
  const totalPages = Math.max(1, Math.ceil(count / perPage));
  const topWinnersData = await getTopWinners(5);
  const topWinners = (topWinnersData.top_winners || []) as WinnerItem[];

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),transparent_30%)] py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Match archive</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Browse PSL matches</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Refine results with team, winner, venue, year, or match-type filters and view match details in one place.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-slate-100">
              View Dashboard
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <form action="/matches" method="get" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <input
                name="team"
                defaultValue={filters.team ?? ""}
                placeholder="Team name"
                className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
              />
              <input
                name="winner"
                defaultValue={filters.winner ?? ""}
                placeholder="Winner name"
                className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
              />
              <input
                name="venue"
                defaultValue={filters.venue ?? ""}
                placeholder="Venue"
                className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
              />
              <input
                name="match_type"
                defaultValue={filters.match_type ?? ""}
                placeholder="Match type (T20/PSL)"
                className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
              />
              <input
                name="year"
                defaultValue={filters.year ?? ""}
                placeholder="Year"
                className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none focus:border-sky-400/80 focus:ring-2 focus:ring-sky-400/20"
              />
              <label className="inline-flex items-center gap-3 rounded-3xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="venue_fuzzy"
                  defaultChecked={filters.venue_fuzzy}
                  value="true"
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-sky-400 focus:ring-sky-400"
                />
                Fuzzy venue match
              </label>
              <button
                type="submit"
                className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Apply filters
              </button>
            </form>

            <div className="rounded-[2rem] border border-white/10 bg-zinc-900/80 p-5 text-sm text-zinc-300">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Quick filters</p>
              <div className="mt-4 space-y-3">
                {topWinners.map((item: WinnerItem) => (
                  <Link
                    key={item.team}
                    href={`/matches?winner=${encodeURIComponent(item.team)}`}
                    className="block rounded-3xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3 text-white transition hover:border-sky-400/30 hover:bg-zinc-900"
                  >
                    {item.team} — {item.wins} wins
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-zinc-900/80 p-4 text-sm text-zinc-300">
            <span>Showing page {page} of {totalPages}</span>
            <span className="mx-1">•</span>
            <span>{count} matches total</span>
            <span className="mx-1">•</span>
            <span>Filtered results</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match: MatchItem) => (
              <div
                key={match.id}
                className="group rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-sky-300">{match.match_type || "PSL"}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{match.team_1} vs {match.team_2}</h2>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                    {match.date}
                  </span>
                </div>
                <div className="mt-6 space-y-3 text-sm text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Venue</span>
                    <span className="font-semibold text-white">{match.venue || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Winner</span>
                    <span className="font-semibold text-white">{match.winner || "TBD"}</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/matches/${match.id}`}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-slate-200"
                  >
                    View details
                  </Link>
                  <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
                    Score data not available
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-zinc-950/80 p-10 text-center text-zinc-400">
              No matches found for this page and filters.
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
              href={`/matches?page=${Math.max(1, page - 1)}${filters.team ? `&team=${encodeURIComponent(filters.team)}` : ""}${filters.winner ? `&winner=${encodeURIComponent(filters.winner)}` : ""}${filters.match_type ? `&match_type=${encodeURIComponent(filters.match_type)}` : ""}${filters.year ? `&year=${encodeURIComponent(filters.year)}` : ""}${filters.venue ? `&venue=${encodeURIComponent(filters.venue)}` : ""}${filters.venue_fuzzy ? `&venue_fuzzy=true` : ""}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page === 1 ? "cursor-not-allowed bg-zinc-800 text-zinc-500" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
            >
              Previous
            </Link>
            <Link
              href={`/matches?page=${Math.min(totalPages, page + 1)}${filters.team ? `&team=${encodeURIComponent(filters.team)}` : ""}${filters.winner ? `&winner=${encodeURIComponent(filters.winner)}` : ""}${filters.match_type ? `&match_type=${encodeURIComponent(filters.match_type)}` : ""}${filters.year ? `&year=${encodeURIComponent(filters.year)}` : ""}${filters.venue ? `&venue=${encodeURIComponent(filters.venue)}` : ""}${filters.venue_fuzzy ? `&venue_fuzzy=true` : ""}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page >= totalPages ? "cursor-not-allowed bg-zinc-800 text-zinc-500" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
