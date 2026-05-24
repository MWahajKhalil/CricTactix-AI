// CricTactix-AI Tactical Analyst Home Page
import Link from "next/link";
import { checkBackendHealth, getMatches } from "@/lib/api";

type MatchSummary = {
  id: number;
  cricsheet_id: string;
  date: string;
  team_1: string;
  team_2: string;
  winner: string;
  match_type: string;
  venue: string;
};

type MatchResponse = {
  count: number;
  matches: MatchSummary[];
};

type BackendStatus = {
  message: string;
} | null;

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendData: BackendStatus = null;
  let matchData: MatchResponse = { count: 0, matches: [] };

  try {
    backendData = await checkBackendHealth();
    matchData = await getMatches(1, 6);
  } catch (e: unknown) {
    console.error(e);
  }

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_30%)] py-10">
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 sm:px-8 lg:px-12">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <p className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
                Powered by PSL data
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Cricket insights built for tactical decisions.
              </h1>
              <p className="max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
                Explore PSL match results, navigate match details, and ask the AI analyst tactical questions from a real match database.
              </p>
            </div>

            <div className="grid gap-4 sm:max-w-md">
              <Link href="/matches" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-zinc-950 shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-100">
                Browse Matches
              </Link>
              <Link href="/chat" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 px-6 py-3 text-base font-semibold text-white transition hover:bg-zinc-800">
                Open AI Chat
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-blue-300">Quick overview</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-zinc-950/80 p-5">
                <p className="text-sm text-zinc-400">Backend status</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {backendData ? "Online" : "Offline"}
                </p>
              </div>
              <div className="rounded-3xl bg-zinc-950/80 p-5">
                <p className="text-sm text-zinc-400">Matches loaded</p>
                <p className="mt-3 text-3xl font-semibold text-white">{matchData.count}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Match exploration</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Fast access to results</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Browse the latest PSL matches, review winners and venues, and jump to tactical details with a single click.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">AI support</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Ask the analyst</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Get tactical insights from your PSL database using natural language, with team, match, and performance context.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-violet-300">Connected data</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Real match results</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              The UI is directly connected to your backend API and current database, so you can explore actual loaded matches and details.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent matches</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Latest PSL results</h2>
            </div>
            <Link href="/matches" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
              View all matches
            </Link>
          </div>

          {matchData.matches.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {matchData.matches.map((match: MatchSummary) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="group block rounded-3xl border border-white/10 bg-zinc-950/80 p-6 transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">{match.match_type || "PSL"}</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{match.team_1} vs {match.team_2}</h3>
                    </div>
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-300">{match.date}</span>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-zinc-400">Winner: <span className="font-semibold text-white">{match.winner || "TBD"}</span></p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-zinc-700/60 bg-zinc-950/70 p-10 text-center text-zinc-500">
              No recent matches available. Ensure the backend and database are connected.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
