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
        "Tactical database connected. Ask me anything about PSL match dates, team rosters, venue statistics, batsman runs, or bowler wickets.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Agent telemetry: Ready. Awaiting query sequence...");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStatusMessage("Agent telemetry: Parsing query & executing SQL statements...");

    try {
      const response = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "ai", content: response.answer }]);
      setStatusMessage("Agent telemetry: Operational. Awaiting next command...");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection failure.";
      setMessages((prev) => [...prev, { role: "ai", content: `ERR: ${message}` }]);
      setStatusMessage("Agent telemetry: Error. SQLite database offline or API key missing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col bg-zinc-950/60 relative">
      {/* Background glow */}
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-accent-green/5 rounded-full blur-[90px] pointer-events-none" />
      
      {/* HEADER SECTION */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition"
            >
              &larr; Dashboard
            </Link>
            <div>
              <p className="font-display text-[10px] uppercase tracking-widest text-accent-cyan">Analyst Workspace</p>
              <h1 className="font-display text-lg font-bold text-white leading-tight">AI Tactical Chat</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-accent-green bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-950/50">
            <span className="h-2 w-2 rounded-full bg-accent-green shadow-md shadow-accent-green/40 animate-pulse" />
            Agent Online
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-6 sm:px-8 lg:px-12">
        
        {/* PLAYBOOK & TIPS PANEL */}
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="glass-sports-card p-5">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2 mb-3">Suggested Playbook Queries</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/60 px-4 py-3 text-left text-xs text-zinc-300 hover:border-accent-green/20 hover:bg-zinc-900 transition leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-sports-card p-5 border-l-4 border-l-accent-cyan flex flex-col justify-between">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-2 mb-3">Syntax Rules</p>
              <ul className="text-[11px] leading-relaxed text-zinc-400 space-y-1.5">
                <li>&bull; Wickets: count catches, bowled, lbws, stumpings, hit-wickets.</li>
                <li>&bull; Runs: calculated strictly on batsman run credits.</li>
                <li>&bull; Stadiums & Players: queries support partial, case-insensitive match terms.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* TERMINAL CHAT SCREEN */}
        <section className="flex-1 glass-sports-card p-5 flex flex-col justify-between bg-zinc-950/30">
          
          {/* Status Bar */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-950/90 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
            {statusMessage}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 my-6 space-y-5 overflow-y-auto max-h-[400px] pr-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-5 shadow-inner transition ${
                    msg.role === "user"
                      ? "bg-accent-green/5 border border-accent-green/20 text-white rounded-tr-none"
                      : "bg-zinc-950/90 border border-zinc-900 text-zinc-300 rounded-tl-none"
                  }`}
                >
                  <div className={`mb-2 text-[9px] font-bold uppercase tracking-widest ${msg.role === "user" ? "text-accent-green" : "text-accent-cyan"}`}>
                    {msg.role === "user" ? "TACTICAL QUERY" : "SYSTEM RESPONSE"}
                  </div>
                  <div className="leading-relaxed text-xs sm:text-sm font-sans whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-950/70 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-green" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-green [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Panel */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-900/60 pt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query database (e.g., 'Who scored the most runs for Lahore in 2024?')..."
              className="flex-1 rounded-xl sports-input px-4 py-3.5 text-xs text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-accent-green px-5 py-3.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "EXEC..." : "EXECUTE"}
            </button>
          </form>

        </section>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950/70 py-3 text-center text-[10px] text-zinc-500 font-mono">
        Telemetry logs generated from SQLite DB app config routes.
      </footer>
    </div>
  );
}
