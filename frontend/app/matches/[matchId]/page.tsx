import Link from "next/link";
import { getMatchById } from "@/lib/api";

export const dynamic = "force-dynamic";

type MatchDetailPageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const resolvedParams = await params;
  let match = null;

  try {
    match = await getMatchById(resolvedParams.matchId);
  } catch {
    return (
      <div className="min-h-screen bg-zinc-950 py-16 px-6 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-zinc-900/90 p-10 text-center shadow-2xl shadow-black/40">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Match not found</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Unable to load match details</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">This match may not exist in the current dataset or the backend could not return the record.</p>
          <Link href="/matches" className="mt-8 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),transparent_25%)] py-16 px-6 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Match detail</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{match.team_1} vs {match.team_2}</h1>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{match.cricsheet_id} • {match.date}</p>
          </div>
          <Link href="/matches" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-slate-100">
            Back to Matches
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Match summary</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between rounded-3xl bg-zinc-950/80 px-4 py-3">
                <span>Type</span>
                <span className="font-semibold text-white">{match.match_type || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-zinc-950/80 px-4 py-3">
                <span>Venue</span>
                <span className="font-semibold text-white">{match.venue || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-zinc-950/80 px-4 py-3">
                <span>City</span>
                <span className="font-semibold text-white">{match.city || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-zinc-950/80 px-4 py-3">
                <span>Winner</span>
                <span className="font-semibold text-emerald-300">{match.winner || "TBD"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Teams</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              <div className="rounded-3xl bg-zinc-950/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Team 1</p>
                <p className="mt-2 text-lg font-semibold text-white">{match.team_1}</p>
              </div>
              <div className="rounded-3xl bg-zinc-950/80 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Team 2</p>
                <p className="mt-2 text-lg font-semibold text-white">{match.team_2}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Match overview</h2>
          <div className="mt-6 grid gap-4 text-sm text-zinc-300 md:grid-cols-2">
            <div className="rounded-3xl bg-zinc-950/80 p-4">
              <p className="font-semibold text-white">Identifier</p>
              <p className="mt-2 text-zinc-400">{match.cricsheet_id}</p>
            </div>
            <div className="rounded-3xl bg-zinc-950/80 p-4">
              <p className="font-semibold text-white">Date</p>
              <p className="mt-2 text-zinc-400">{match.date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
