"use client";

import { useState } from "react";
import Link from "next/link";
import { sendChatMessage } from "@/lib/api";

type Message = {
  role: "user" | "ai";
  content: string;
};

const suggestedPrompts = [
  "Which team has the most wins in the current dataset?",
  "Show recent match winners and venues.",
  "How many matches were played at the Gaddafi Stadium?",
  "Who won the match between Karachi Kings and Lahore Qalandars?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Tactical database telemetry active. Submit query scripts below to request aggregates regarding players, teams, match venues, run counts, or bowler wickets.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Telemetry: Operational & Awaiting Query Sequence...");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStatusMessage("Telemetry: Compiling query, executing SQLite statements...");

    try {
      const response = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "ai", content: response.answer }]);
      setStatusMessage("Telemetry: Done. Awaiting next command sequence.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection failed.";
      setMessages((prev) => [...prev, { role: "ai", content: `ERR: ${message}` }]);
      setStatusMessage("Telemetry: SQL Execution error. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col bg-zinc-950/20 relative py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 sm:px-6">
        
        {/* PREMIUM GLASS CHAT WORKSPACE */}
        <div className="premium-sports-card p-6 flex-1 flex flex-col justify-between">
          
          {/* Header toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded border border-zinc-800 bg-zinc-950/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition duration-150"
              >
                &larr; Scoreboard
              </Link>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Query Terminal</p>
                <h1 className="sports-heading text-lg font-bold text-white">AI Analyst Board</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-turf-emerald bg-zinc-950 px-3 py-1.5 rounded border border-zinc-900">
              <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald animate-pulse" />
              SQL CORE ONLINE
            </div>
          </div>

          {/* PLAYBOOK PANEL */}
          <div className="mb-6 rounded-lg bg-zinc-950/40 border border-zinc-900 p-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2 mb-3">Pre-defined Query Playbooks</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded border border-zinc-900 bg-zinc-950/60 px-4 py-2.5 text-left text-xs font-sans text-zinc-400 hover:border-zinc-800 hover:text-white transition duration-150 leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGES FEED AREA */}
          <div className="flex-1 flex flex-col justify-between min-h-[300px]">
            
            {/* Telemetry bar */}
            <div className="rounded border border-zinc-900 bg-zinc-950/90 px-4 py-2.5 text-[10px] font-mono text-zinc-500">
              {statusMessage}
            </div>

            {/* Chat feed */}
            <div className="flex-1 my-6 space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl p-4.5 font-sans text-xs ${
                      msg.role === "user"
                        ? "bg-zinc-900 border border-zinc-800 text-white rounded-tr-none"
                        : "bg-zinc-950/90 border-l-2 border-l-turf-emerald border-y border-r border-y-zinc-900 border-r-zinc-900 text-zinc-300 rounded-tl-none"
                    }`}
                  >
                    <div className={`mb-1.5 text-[8px] font-mono font-bold uppercase tracking-widest ${msg.role === "user" ? "text-accent-cyan" : "text-turf-emerald"}`}>
                      {msg.role === "user" ? "TACTICAL_PROMPT" : "AI_OUTPUT"}
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap text-xs">{msg.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded border border-zinc-900 bg-zinc-950/70 px-4 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-turf-emerald" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-turf-emerald [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-turf-emerald [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Execution form */}
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-900/60 pt-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Query database (e.g., 'Matches won by Multan in Multan')..."
                className="flex-1 rounded premium-input px-4 py-3.5 text-xs text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded bg-turf-emerald px-5 py-3.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition uppercase font-mono"
              >
                {isLoading ? "EXEC..." : "EXECUTE"}
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
