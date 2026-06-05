"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { sendChatMessage } from "@/lib/api";

type Message = {
  role: "user" | "ai";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
};

const suggestedPrompts = [
  "Which team has the most wins in the current dataset?",
  "Show recent match winners and venues.",
  "How many matches were played at the Gaddafi Stadium?",
  "Who won the match between Karachi Kings and Lahore Qalandars?",
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Status: Ready for analytical inquiry");

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("crictactix_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const savedActive = localStorage.getItem("crictactix_active_session_id");
          if (savedActive && parsed.some((s: ChatSession) => s.id === savedActive)) {
            setActiveSessionId(savedActive);
          } else {
            setActiveSessionId(parsed[0].id);
          }
          return;
        }
      } catch (e) {
        console.error("Error parsing saved sessions", e);
      }
    }

    // Default session
    const defaultSession: ChatSession = {
      id: "session_" + Date.now(),
      title: "New Tactical Analysis",
      messages: [
        {
          role: "ai",
          content: "Database online. You can ask questions about PSL match histories, player runs, wickets, stadium frequencies, or team head-to-head records.",
        },
      ],
      lastModified: Date.now(),
    };
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("crictactix_chat_sessions", JSON.stringify(sessions));
    localStorage.setItem("crictactix_active_session_id", activeSessionId);
  }, [sessions, activeSessionId, isMounted]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCreateSession = () => {
    const newSession: ChatSession = {
      id: "session_" + Date.now(),
      title: `Analysis #${sessions.length + 1}`,
      messages: [
        {
          role: "ai",
          content: "Database online. You can ask questions about PSL match histories, player runs, wickets, stadium frequencies, or team head-to-head records.",
        },
      ],
      lastModified: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const defaultSession: ChatSession = {
        id: "session_" + Date.now(),
        title: "New Tactical Analysis",
        messages: [
          {
            role: "ai",
            content: "Database online. You can ask questions about PSL match histories, player runs, wickets, stadium frequencies, or team head-to-head records.",
          },
        ],
        lastModified: Date.now(),
      };
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (!editingTitle.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editingTitle.trim() } : s))
    );
    setEditingSessionId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSessionId) return;

    const userMessage = input.trim();
    setInput("");

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: [...session.messages, { role: "user", content: userMessage }],
            lastModified: Date.now(),
          };
        }
        return session;
      })
    );

    setIsLoading(true);
    setStatusMessage("Searching: Querying PSL database records...");

    try {
      const response = await sendChatMessage(userMessage);

      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === activeSessionId) {
            // Auto-rename if title is default
            const isDefaultTitle =
              session.title === "New Tactical Analysis" ||
              session.title.startsWith("Analysis #");
            const newTitle = isDefaultTitle
              ? (userMessage.length > 28 ? userMessage.substring(0, 28) + "..." : userMessage)
              : session.title;

            return {
              ...session,
              title: newTitle,
              messages: [...session.messages, { role: "ai", content: response.answer }],
              lastModified: Date.now(),
            };
          }
          return session;
        })
      );
      setStatusMessage("Status: Ready for next inquiry");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection failed.";
      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: [...session.messages, { role: "ai", content: `Error: ${message}` }],
              lastModified: Date.now(),
            };
          }
          return session;
        })
      );
      setStatusMessage("Status: Query failed. Verify backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] flex-col bg-background/10 relative py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 sm:px-6">
          <div className="premium-sports-card flex flex-col md:flex-row overflow-hidden h-[680px] bg-bg-secondary/5 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-border-color border-t-turf-emerald" />
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                Initializing Tactical Deck...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col bg-background/10 relative py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 sm:px-6">
        
        {/* UNIFIED CONTAINER */}
        <div className="premium-sports-card flex flex-col md:flex-row overflow-hidden h-[680px] bg-bg-secondary/5 relative">
          
          {/* LEFT SIDEBAR */}
          <div
            className={`
              absolute md:relative top-0 bottom-0 left-0 z-30 md:z-auto
              w-64 h-full border-r border-border-color bg-background/95 md:bg-background/15
              flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <div className="flex-1 flex flex-col min-h-0">
              {/* Sidebar Header */}
              <div className="border-b border-border-color pb-4 mb-4">
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted font-bold">Session Manager</p>
                <h3 className="sports-heading text-sm font-bold text-header-text mt-1">Tactical Analysis</h3>
              </div>

              {/* Create Thread Button */}
              <button
                type="button"
                onClick={handleCreateSession}
                className="w-full flex items-center justify-center gap-2 rounded border border-turf-emerald/30 bg-turf-emerald/5 hover:bg-turf-emerald hover:text-zinc-950 px-4 py-2.5 text-xs font-bold text-turf-emerald transition duration-150 font-mono uppercase tracking-wider mb-4 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Analysis
              </button>

              {/* Sessions list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isEditing = session.id === editingSessionId;

                  return (
                    <div
                      key={session.id}
                      className={`
                        group relative flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition duration-150
                        ${isActive
                          ? "bg-bg-secondary/80 border-turf-emerald/40 text-header-text"
                          : "bg-transparent border-transparent text-text-muted hover:bg-bg-secondary/40 hover:text-header-text"
                        }
                      `}
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleSaveRename(session.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(session.id);
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                            className="w-full bg-background border border-border-color rounded px-2 py-1 text-xs text-header-text focus:border-turf-emerald outline-none font-sans"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRename(session.id);
                            }}
                            className="p-1 rounded text-turf-emerald hover:bg-bg-secondary transition cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="flex-1 min-w-0 pr-2"
                            onClick={() => {
                              setActiveSessionId(session.id);
                              setIsSidebarOpen(false);
                            }}
                          >
                            <p className="text-xs font-semibold truncate leading-snug">{session.title}</p>
                            <p className="text-[9px] font-mono text-text-muted/70 mt-0.5">
                              {session.messages.length} {session.messages.length === 1 ? "message" : "messages"}
                            </p>
                          </div>

                          {/* Quick controls */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(session.id, session.title, e)}
                              className="p-1 rounded text-text-muted hover:text-header-text hover:bg-background/60 transition cursor-pointer"
                              title="Rename Session"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="p-1 rounded text-text-muted hover:text-ball-crimson hover:bg-background/60 transition cursor-pointer"
                              title="Delete Session"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-border-color pt-3 mt-4 text-[9px] font-mono text-text-muted/65 flex items-center justify-between">
              <span>SESSIONS: {sessions.length}</span>
              <span className="text-turf-emerald uppercase">Sync Live</span>
            </div>
          </div>

          {/* MOBILE SIDEBAR OVERLAY */}
          {isSidebarOpen && (
            <div
              className="absolute inset-0 bg-background/65 backdrop-blur-sm z-20 md:hidden transition-opacity duration-200"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* RIGHT WORKSPACE */}
          <div className="flex-1 flex flex-col justify-between p-6 h-full min-w-0">
            
            {/* Toolbar Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-color pb-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-1.5 rounded border border-border-color bg-bg-secondary/40 text-text-muted hover:text-header-text transition cursor-pointer"
                  title="Open Sidebar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <Link
                  href="/dashboard"
                  className="rounded border border-border-color bg-bg-secondary/40 px-2.5 py-1 text-[9px] font-semibold text-text-muted hover:text-header-text transition duration-150 uppercase tracking-wider"
                >
                  &larr; Scoreboard
                </Link>
                <div className="min-w-0">
                  <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted">Research Desk</p>
                  <h1 className="sports-heading text-sm font-bold text-header-text truncate max-w-[150px] sm:max-w-[280px]">
                    {activeSession ? activeSession.title : "AI Tactical Assistant"}
                  </h1>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono font-bold text-turf-emerald bg-bg-secondary/40 px-3 py-1.5 rounded border border-border-color">
                <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
                DATABASE ONLINE
              </div>
            </div>

            {/* Suggested inquiries (only shown when thread is blank/new) */}
            {messages.length <= 1 && (
              <div className="mb-4 rounded-lg bg-bg-secondary/20 border border-border-color p-4">
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted border-b border-border-color pb-2 mb-3 font-bold">Suggested Inquiries</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="rounded border border-border-color/60 bg-background/50 px-4 py-2.5 text-left text-xs font-sans text-text-muted hover:border-turf-emerald/30 hover:text-header-text transition duration-150 leading-snug cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages feed area */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
              
              {/* Status bar */}
              <div className="rounded border border-border-color bg-bg-secondary/60 px-4 py-1.5 text-[9px] font-mono text-text-muted tracking-wide">
                {statusMessage}
              </div>

              {/* Chat Feed */}
              <div className="flex-1 my-4 space-y-4 overflow-y-auto pr-2 scrollbar-thin">
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
                            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
                            <span className="text-accent-cyan">YOU</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald" />
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
                <div ref={messagesEndRef} />
              </div>

              {/* Execution Form */}
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
                  className="rounded bg-turf-emerald px-5 py-3 text-xs font-bold text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono uppercase tracking-wider cursor-pointer"
                >
                  {isLoading ? "Sending..." : "Send Query"}
                </button>
              </form>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
