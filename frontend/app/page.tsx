import { checkBackendHealth, getMatches } from "@/lib/api";

export default async function Home() {
  let backendData = null;
  let error = null;
  let matchData = { count: 0, matches: [] };

  try {
    backendData = await checkBackendHealth();
    matchData = await getMatches();
  } catch (e: any) {
    error = e.message || "Failed to connect to backend.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans dark:bg-black text-black dark:text-white">
      <main className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto p-8 pt-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
            AI Cricket Tactical Analyst
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Your personal AI coach powered by real match data. Ask questions, analyze matchups, and uncover tactical insights.
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            System Status:
          </span>
          {backendData ? (
            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full font-medium flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Backend Online
            </div>
          ) : (
            <div className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full font-medium flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Offline
            </div>
          )}
        </div>

        {/* Database Overview */}
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Matches in Database</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-semibold">
              {matchData.count} Matches Loaded
            </span>
          </div>

          {matchData.matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchData.matches.map((match: any) => (
                <div key={match.id} className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute top-4 right-4 text-xs font-semibold text-zinc-400">
                    {match.date}
                  </div>
                  <h3 className="text-sm font-medium text-blue-500 mb-4">{match.cricsheet_id}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${match.winner === match.team_1 ? 'text-emerald-500' : ''}`}>
                        {match.team_1}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold px-2">VS</span>
                      <span className={`font-bold text-right ${match.winner === match.team_2 ? 'text-emerald-500' : ''}`}>
                        {match.team_2}
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Winner: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{match.winner}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
              <p className="text-zinc-500 dark:text-zinc-400">No matches found in the database. Run the load script first.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
