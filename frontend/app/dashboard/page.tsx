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

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_30%)] py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-10 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Dashboard</p>
              <h1 className="mt-4 text-4xl font-semibold text-white">Tournament snapshot</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Explore the current PSL dataset with top teams, winners, and recent match performance.
              </p>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-slate-100">
              Go to Matches
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(14,165,233,0.65)] backdrop-blur-xl">
              <p className="text-sm text-slate-400">Loaded matches</p>
              <p className="mt-4 text-4xl font-semibold text-white">{count}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(34,197,94,0.55)] backdrop-blur-xl">
              <p className="text-sm text-slate-400">Teams represented</p>
              <p className="mt-4 text-4xl font-semibold text-white">{Object.keys(teamCounts).length}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(236,72,153,0.4)] backdrop-blur-xl">
              <p className="text-sm text-slate-400">Top venue</p>
              <p className="mt-4 text-4xl font-semibold text-white">{leadingVenue?.venue || "N/A"}</p>
              {leadingVenue ? (
                <p className="mt-2 text-sm text-slate-400">{leadingVenue.matches} matches</p>
              ) : null}
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-3">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-50px_rgba(14,165,233,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Top teams</h2>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Sample</span>
              </div>
              <div className="mt-6 space-y-4">
                {topTeams.map(([team, count], index) => (
                  <div key={team} className="flex items-center justify-between rounded-3xl border border-white/5 bg-zinc-950/75 px-4 py-4 text-sm text-zinc-200 shadow-sm shadow-black/10">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-200">{index + 1}</span>
                      <span>{team}</span>
                    </div>
                    <span className="font-semibold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-50px_rgba(34,197,94,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Top winners</h2>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">Most frequent</span>
              </div>
              <div className="mt-6 space-y-4">
                {topWinners.map((item: WinnerItem, index: number) => (
                  <div key={item.team} className="flex items-center justify-between rounded-3xl border border-white/5 bg-zinc-950/75 px-4 py-4 text-sm text-zinc-200 shadow-sm shadow-black/10">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-200">{index + 1}</span>
                      <span>{item.team}</span>
                    </div>
                    <span className="font-semibold text-white">{item.wins}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-50px_rgba(236,72,153,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Top venues</h2>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">By matches</span>
              </div>
              <div className="mt-6 space-y-4">
                {topVenues.map((item: TopVenueItem, index: number) => (
                  <div key={item.venue} className="flex items-center justify-between rounded-3xl border border-white/5 bg-zinc-950/75 px-4 py-4 text-sm text-zinc-200 shadow-sm shadow-black/10">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-200">{index + 1}</span>
                      <span>{item.venue}</span>
                    </div>
                    <span className="font-semibold text-white">{item.matches}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-10 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent sample matches</h2>
                <p className="mt-2 text-sm text-slate-400">A quick view of the latest loaded matches from the dataset.</p>
              </div>
              <Link href="/matches" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
                Explore more →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {matches.slice(0, 6).map((match: MatchItem) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 transition hover:border-sky-400/30 hover:bg-zinc-900"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{match.match_type || "PSL"}</p>
                  <p className="mt-3 text-lg font-semibold text-white">{match.team_1} vs {match.team_2}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>{match.date}</span>
                    <span>Winner: {match.winner || "Unknown"}</span>
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
