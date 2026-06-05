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
        "Database online. You can ask questions about PSL match histories, player runs, wickets, stadium frequencies, or team head-to-head records.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Status: Ready for analytical inquiry");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStatusMessage("Searching: Querying PSL database records...");

    try {
      const response = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "ai", content: response.answer }]);
      setStatusMessage("Status: Ready for next inquiry");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection failed.";
      setMessages((prev) => [...prev, { role: "ai", content: `Error: ${message}` }]);
      setStatusMessage("Status: Query failed. Verify backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col bg-background/10 relative py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 sm:px-6">
        
        {/* CHAT WORKSPACE */}
        <div className="premium-sports-card p-6 flex-1 flex flex-col justify-between bg-bg-secondary/5">
          
          {/* Header toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded border border-border-color bg-bg-secondary/40 px-3 py-1.5 text-[10px] font-semibold text-text-muted hover:text-header-text transition duration-150 uppercase tracking-wider"
              >
                &larr; Scoreboard
              </Link>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted">Research Desk</p>
                <h1 className="sports-heading text-lg font-bold text-header-text">AI Tactical Assistant</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-turf-emerald bg-bg-secondary/40 px-3 py-1.5 rounded border border-border-color">
              <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
              DATABASE ONLINE
            </div>
          </div>

          {/* PLAYBOOK PANEL */}
          <div className="mb-6 rounded-lg bg-bg-secondary/20 border border-border-color p-4">
            <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted border-b border-border-color pb-2 mb-3 font-bold">Suggested Inquiries</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded border border-border-color/60 bg-background/50 px-4 py-2.5 text-left text-xs font-sans text-text-muted hover:border-turf-emerald/30 hover:text-header-text transition duration-150 leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGES FEED AREA */}
          <div className="flex-1 flex flex-col justify-between min-h-[300px]">
            
            {/* Status bar */}
            <div className="rounded border border-border-color bg-bg-secondary/60 px-4 py-2 text-[9px] font-mono text-text-muted tracking-wide">
              {statusMessage}
            </div>

            {/* Chat feed */}
            <div className="flex-1 my-6 space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl p-4 border border-border-color text-xs ${
                      msg.role === "user"
                        ? "bg-bg-secondary text-header-text rounded-tr-none"
                        : "bg-background text-foreground rounded-tl-none"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 text-[8px] font-mono font-bold uppercase tracking-widest">
                      {msg.role === "user" ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-accent-cyan" />
                          <span className="text-accent-cyan">YOU</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1 w-1 rounded-full bg-turf-emerald" />
                          <span className="text-turf-emerald">AI ANALYST</span>
                        </>
                      )}
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap text-xs text-header-text">{msg.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded border border-border-color bg-bg-secondary/40 px-4 py-2.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-turf-emerald" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-turf-emerald [animation-delay:0.2s]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-turf-emerald [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Execution form */}
            <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-color/60 pt-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Query database (e.g., 'Runs scored by Babar Azam at Gaddafi Stadium')..."
                className="flex-1 rounded premium-input px-4 py-3 text-xs text-header-text"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded bg-turf-emerald px-5 py-3 text-xs font-bold text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono uppercase tracking-wider"
              >
                {isLoading ? "Sending..." : "Send Query"}
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}

