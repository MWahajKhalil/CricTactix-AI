import { checkBackendHealth } from "@/lib/api";

export default async function Home() {
  let backendData = null;
  let error = null;

  try {
    backendData = await checkBackendHealth();
  } catch (e: any) {
    error = e.message || "Failed to connect to backend.";
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black text-black dark:text-white">
      <main className="flex flex-col items-center gap-8 max-w-2xl text-center p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight">
          AI Cricket Tactical Analyst
        </h1>
        
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400">
            Backend Connection Status
          </h2>
          
          {backendData ? (
            <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Connected
              <span className="text-sm opacity-80 ml-2">({backendData.status || backendData.message})</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Disconnected
              <span className="text-sm opacity-80 ml-2">({error})</span>
            </div>
          )}
        </div>
        
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
          This page is rendered as a Server Component. The backend check happens on the Next.js server before the HTML is sent to your browser.
        </p>
      </main>
    </div>
  );
}
