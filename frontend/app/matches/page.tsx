import Link from "next/link";
import { getMatches } from "@/lib/api";

export const dynamic = "force-dynamic";

type MatchesPageProps = {
  searchParams?: {
    page?: string;
  };
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const page = Math.max(1, Number(searchParams?.page || "1"));
  const perPage = 12;
  const { count, matches } = await getMatches(page, perPage);
  const totalPages = Math.max(1, Math.ceil(count / perPage));

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),transparent_30%)] py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Match archive</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Browse PSL matches</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Explore loaded match results, filter by page, and navigate to match details powered by your local backend.
              </p>
            </div>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-slate-100">
              View Dashboard
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-zinc-900/80 p-4 text-sm text-zinc-300">
            <span>Showing page {page} of {totalPages}</span>
            <span className="mx-1">•</span>
            <span>{count} matches total</span>
            <span className="mx-1">•</span>
            <span>Loaded from backend endpoint</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match: any) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
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
                <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
                  <span>Venue: {match.venue || "Unknown"}</span>
                  <span className="font-semibold text-white">Winner: {match.winner || "N/A"}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-zinc-950/80 p-10 text-center text-zinc-400">
              No matches found for this page.
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
              href={`/matches?page=${Math.max(1, page - 1)}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page === 1 ? "cursor-not-allowed bg-zinc-800 text-zinc-500" : "bg-white text-zinc-950 hover:bg-slate-200"}`}
            >
              Previous
            </Link>
            <Link
              href={`/matches?page=${Math.min(totalPages, page + 1)}`}
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
