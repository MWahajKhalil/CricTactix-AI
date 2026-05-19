"use client";

import { useState } from "react";
import Link from "next/link";
import { sendChatMessage } from "@/lib/api";

const suggestedPrompts = [
  "Which team has the most wins in the current dataset?",
  "Show recent match winners and venues.",
  "How many matches were played at the Gaddafi Stadium?",
  "Who won the match between Karachi Kings and Lahore Qalandars?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content:
        "Hi! I am your AI Cricket Analyst. I have access to the PSL match database. Ask me anything about teams, results, venues, or tactical performance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "ai", content: response.answer }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-white">
      <header className="sticky top-0 z-10 border-b border-zinc-800/70 bg-zinc-950/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-full border border-zinc-800/70 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              ← Dashboard
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">AI Tactical Chat</p>
              <h1 className="text-2xl font-semibold text-white">Ask the cricket analyst</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-emerald-400">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/30" />
            Agent connected
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/95 p-6 shadow-xl shadow-black/20">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Interactive analysis</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Explore match data with natural language.</h2>
              </div>
              <p className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-300">Available on your local backend</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/90 px-4 py-3 text-left text-sm text-zinc-200 transition hover:border-sky-400/50 hover:bg-zinc-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800/80 bg-gradient-to-br from-blue-500/15 via-transparent to-emerald-500/10 p-6 shadow-xl shadow-sky-500/10">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Tips</p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
              <li>• Ask about match winners, venues, or tactical advantage.</li>
              <li>• Use team names or specific match IDs for precise results.</li>
              <li>• Explore the dataset faster than manual CSV inspection.</li>
            </ul>
          </div>
        </div>

        <section className="flex-1 rounded-[2rem] border border-zinc-800/80 bg-zinc-900/95 p-6 shadow-xl shadow-black/20">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded-3xl px-6 py-5 shadow-sm transition ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-zinc-950/90 border border-zinc-800 text-zinc-100 rounded-bl-none"
                  }`}
                >
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.25em] ${msg.role === "user" ? "text-blue-200" : "text-emerald-300"}`}>
                    {msg.role === "user" ? "You" : "AI Analyst"}
                  </div>
                  <div className="whitespace-pre-wrap leading-7 text-sm">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-3xl border border-zinc-800/80 bg-zinc-950/80 px-5 py-4">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/70 bg-zinc-950/95 py-4 text-center text-sm text-zinc-500">
        <p>AI chat is connected to your local backend. Ask anything about the loaded match dataset.</p>
      </footer>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
