"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMatchupPlayers, getMatchupAnalysis } from "@/lib/api";

type DuelStats = {
  runs: number;
  balls: number;
  dismissals: number;
  strike_rate: number;
  dot_ball_pct: number;
  fours: number;
  sixes: number;
};

type BatterBaseline = {
  runs: number;
  balls: number;
  dismissals: number;
  strike_rate: number;
  dot_ball_pct: number;
  average: number;
  fours: number;
  sixes: number;
};

type BowlerBaseline = {
  runs_conceded: number;
  balls: number;
  wickets: number;
  economy: number;
  strike_rate: number;
  dot_ball_pct: number;
  fours: number;
  sixes: number;
};

type PhaseStat = {
  runs?: number;
  runs_conceded?: number;
  balls: number;
  dismissals?: number;
  wickets?: number;
  strike_rate?: number;
  economy?: number;
};

type MatchupData = {
  batter: string;
  bowler: string;
  h2h: DuelStats;
  batter_baseline: BatterBaseline;
  bowler_baseline: BowlerBaseline;
  splits: {
    h2h: Record<string, PhaseStat>;
    batter: Record<string, PhaseStat>;
    bowler: Record<string, PhaseStat>;
  };
  commentary: string;
};

const phases = ["Powerplay", "Middle", "Death"];

export default function MatchupsPage() {
  // Autocomplete lists
  const [allBatters, setAllBatters] = useState<string[]>([]);
  const [allBowlers, setAllBowlers] = useState<string[]>([]);

  // Search input values
  const [batterSearch, setBatterSearch] = useState("");
  const [bowlerSearch, setBowlerSearch] = useState("");

  // Selected player values
  const [selectedBatter, setSelectedBatter] = useState<string | null>(null);
  const [selectedBowler, setSelectedBowler] = useState<string | null>(null);

  // Dropdown open states
  const [isBatterOpen, setIsBatterOpen] = useState(false);
  const [isBowlerOpen, setIsBowlerOpen] = useState(false);

  // Stats data
  const [data, setData] = useState<MatchupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batterRef = useRef<HTMLDivElement>(null);
  const bowlerRef = useRef<HTMLDivElement>(null);

  // Load player lists on mount
  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await getMatchupPlayers();
        setAllBatters(res.batters || []);
        setAllBowlers(res.bowlers || []);
      } catch (err) {
        console.error("Failed to load players list", err);
      }
    }
    loadPlayers();
  }, []);

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (batterRef.current && !batterRef.current.contains(e.target as Node)) {
        setIsBatterOpen(false);
      }
      if (bowlerRef.current && !bowlerRef.current.contains(e.target as Node)) {
        setIsBowlerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBatters = allBatters.filter((p) =>
    p.toLowerCase().includes(batterSearch.toLowerCase())
  );

  const filteredBowlers = allBowlers.filter((p) =>
    p.toLowerCase().includes(bowlerSearch.toLowerCase())
  );

  const handleSimulate = async () => {
    if (!selectedBatter || !selectedBowler) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await getMatchupAnalysis(selectedBatter, selectedBowler);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col bg-background/10 py-8 relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
        
        {/* Page Title & Intro */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[8px] sm:text-[9px] uppercase tracking-widest text-text-muted font-bold">
            Tactical Analysis Dashboard
          </p>
          <h1 className="sports-heading text-2xl font-bold text-header-text">
            Batter vs Bowler Matchup Simulator
          </h1>
          <p className="text-xs text-text-muted leading-relaxed max-w-2xl">
            Estimate direct matchups, compare historical career profiles, and read AI-generated briefings detailing bowler setups and risk mitigation patterns.
          </p>
        </div>

        {/* SELECTORS ROW */}
        <div className="grid gap-4 md:grid-cols-5 items-end">
          
          {/* Batter Selector */}
          <div ref={batterRef} className="md:col-span-2 relative flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase font-bold tracking-wider text-text-muted">
              Select Batter
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedBatter || batterSearch}
                onChange={(e) => {
                  setSelectedBatter(null);
                  setBatterSearch(e.target.value);
                  setIsBatterOpen(true);
                }}
                onFocus={() => setIsBatterOpen(true)}
                placeholder="Search Batter (e.g. Babar Azam)..."
                className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
              />
              {(selectedBatter || batterSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatter(null);
                    setBatterSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-header-text text-sm cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
            
            {isBatterOpen && filteredBatters.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-40 max-h-48 overflow-y-auto rounded-lg border border-border-color bg-background p-1 shadow-lg scrollbar-thin">
                {filteredBatters.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedBatter(p);
                      setBatterSearch("");
                      setIsBatterOpen(false);
                    }}
                    className="w-full text-left rounded px-3 py-2 text-xs text-header-text hover:bg-bg-secondary/60 transition cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="hidden md:flex justify-center items-center h-11 text-xs font-mono font-extrabold text-text-muted/50">
            VS
          </div>

          {/* Bowler Selector */}
          <div ref={bowlerRef} className="md:col-span-2 relative flex flex-col gap-1.5">
            <label className="font-mono text-[9px] uppercase font-bold tracking-wider text-text-muted">
              Select Bowler
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedBowler || bowlerSearch}
                onChange={(e) => {
                  setSelectedBowler(null);
                  setBowlerSearch(e.target.value);
                  setIsBowlerOpen(true);
                }}
                onFocus={() => setIsBowlerOpen(true)}
                placeholder="Search Bowler (e.g. Shaheen Shah Afridi)..."
                className="w-full rounded premium-input px-4 py-3 text-xs text-header-text"
              />
              {(selectedBowler || bowlerSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBowler(null);
                    setBowlerSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-header-text text-sm cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            {isBowlerOpen && filteredBowlers.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-40 max-h-48 overflow-y-auto rounded-lg border border-border-color bg-background p-1 shadow-lg scrollbar-thin">
                {filteredBowlers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSelectedBowler(p);
                      setBowlerSearch("");
                      setIsBowlerOpen(false);
                    }}
                    className="w-full text-left rounded px-3 py-2 text-xs text-header-text hover:bg-bg-secondary/60 transition cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simulate Button */}
          <div className="md:col-span-5 md:flex md:justify-center mt-2">
            <button
              type="button"
              disabled={loading || !selectedBatter || !selectedBowler}
              onClick={handleSimulate}
              className="w-full md:w-auto rounded bg-turf-emerald px-8 py-3 text-xs font-bold text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono uppercase tracking-wider cursor-pointer"
            >
              {loading ? "Simulating Duel..." : "Simulate Matchup"}
            </button>
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="premium-sports-card p-8 flex flex-col items-center justify-center min-h-[400px] bg-bg-secondary/5 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-border-color border-t-turf-emerald" />
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest animate-pulse">
              Analyzing historical metrics & compiling tactical report...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="premium-sports-card p-6 border-ball-crimson/30 bg-ball-crimson/5 text-center">
            <p className="text-xs text-ball-crimson font-medium">Error: {error}</p>
          </div>
        )}

        {/* SIMULATION RESULTS */}
        {data && (
          <div className="space-y-6">
            
            {/* 1. DUEL METRICS CARD */}
            <div className="premium-sports-card p-6 bg-bg-secondary/5">
              <div className="text-center border-b border-border-color pb-4 mb-6">
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted font-bold">Matchup Summary</p>
                <h2 className="sports-heading text-lg font-extrabold text-header-text mt-1">
                  {data.batter} <span className="text-text-muted font-light px-2">vs</span> {data.bowler}
                </h2>
              </div>

              {data.h2h.balls === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted font-mono uppercase tracking-wider">
                  No historical head-to-head records found. Matchup will rely purely on career baseline styles.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className="text-lg font-bold text-header-text">{data.h2h.runs}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">H2H Runs</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className="text-lg font-bold text-header-text">{data.h2h.balls}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">Balls Faced</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className={`text-lg font-bold ${data.h2h.dismissals > 0 ? "text-ball-crimson" : "text-header-text"}`}>
                      {data.h2h.dismissals}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">Dismissals</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className="text-lg font-bold text-turf-emerald">{data.h2h.strike_rate.toFixed(1)}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">Strike Rate</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className="text-lg font-bold text-accent-cyan">{data.h2h.dot_ball_pct.toFixed(1)}%</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">Dot ball %</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded bg-background border border-border-color/60 text-center">
                    <span className="text-lg font-bold text-header-text">{data.h2h.fours} / {data.h2h.sixes}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-text-muted mt-1 font-bold">4s / 6s</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CAREER BASELINE COMPARISON */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Batter Column */}
              <div className="premium-sports-card p-6 bg-bg-secondary/5">
                <div className="border-b border-border-color pb-3 mb-4">
                  <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted font-bold">Batter Profile</p>
                  <h3 className="sports-heading text-sm font-bold text-header-text mt-0.5">{data.batter}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Total Runs</span>
                    <span className="font-bold text-header-text">{data.batter_baseline.runs}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Balls Faced</span>
                    <span className="font-bold text-header-text">{data.batter_baseline.balls}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Batting Average</span>
                    <span className="font-bold text-header-text">
                      {data.batter_baseline.dismissals > 0 ? data.batter_baseline.average.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Career Strike Rate</span>
                    <span className="font-bold text-turf-emerald">{data.batter_baseline.strike_rate.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Dot Ball Percentage</span>
                    <span className="font-bold text-header-text">{data.batter_baseline.dot_ball_pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Boundaries Hit</span>
                    <span className="font-bold text-header-text">
                      {data.batter_baseline.fours} Fours / {data.batter_baseline.sixes} Sixes
                    </span>
                  </div>
                </div>
              </div>

              {/* Bowler Column */}
              <div className="premium-sports-card p-6 bg-bg-secondary/5">
                <div className="border-b border-border-color pb-3 mb-4">
                  <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted font-bold">Bowler Profile</p>
                  <h3 className="sports-heading text-sm font-bold text-header-text mt-0.5">{data.bowler}</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Total Balls Bowled</span>
                    <span className="font-bold text-header-text">{data.bowler_baseline.balls}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Runs Conceded</span>
                    <span className="font-bold text-header-text">{data.bowler_baseline.runs_conceded}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Wickets Taken</span>
                    <span className="font-bold text-header-text">{data.bowler_baseline.wickets}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Economy Rate</span>
                    <span className="font-bold text-ball-crimson">{data.bowler_baseline.economy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Dot Ball Percentage</span>
                    <span className="font-bold text-header-text">{data.bowler_baseline.dot_ball_pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border-color/30">
                    <span className="text-text-muted">Bowler Strike Rate</span>
                    <span className="font-bold text-header-text">
                      {data.bowler_baseline.wickets > 0 ? data.bowler_baseline.strike_rate.toFixed(1) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. TACTICAL REPORT (AI BRIEFING) */}
            <div className="premium-sports-card p-6 border-turf-emerald/30 bg-turf-emerald/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-12 -translate-y-12 bg-turf-emerald/10 blur-xl rounded-full" />
              
              <div className="border-b border-border-color pb-3 mb-4">
                <div className="flex items-center gap-1.5 text-[8px] font-mono font-bold uppercase tracking-widest text-turf-emerald">
                  <span className="h-1.5 w-1.5 rounded-full bg-turf-emerald animate-ping" />
                  AI TACTICAL BRIEFING
                </div>
                <h3 className="sports-heading text-sm font-bold text-header-text mt-0.5">Analyst Directives</h3>
              </div>

              <div className="leading-relaxed text-xs text-header-text font-sans max-h-96 overflow-y-auto pr-2 scrollbar-thin space-y-1">
                {renderFormattedText(data.commentary)}
              </div>
            </div>

            {/* 4. PHASE SPLITS TABLE */}
            <div className="premium-sports-card p-6 bg-bg-secondary/5 overflow-hidden">
              <div className="border-b border-border-color pb-3 mb-4">
                <p className="font-mono text-[8px] uppercase tracking-widest text-text-muted font-bold">Telemetry Breakdown</p>
                <h3 className="sports-heading text-sm font-bold text-header-text mt-0.5">Match Phase Metrics</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th className="text-left">Phase</th>
                      <th className="text-center">H2H runs (balls)</th>
                      <th className="text-center">H2H Wickets</th>
                      <th className="text-center">H2H Strike Rate</th>
                      <th className="text-center">Batter Baseline SR</th>
                      <th className="text-center">Bowler Baseline Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phases.map((phase) => {
                      const h2h = data.splits.h2h[phase];
                      const bat = data.splits.batter[phase];
                      const bowl = data.splits.bowler[phase];

                      return (
                        <tr key={phase}>
                          <td className="font-bold text-header-text text-left">{phase}</td>
                          <td className="font-mono text-center">
                            {h2h ? `${h2h.runs} (${h2h.balls})` : "0 (0)"}
                          </td>
                          <td className="text-center font-bold text-ball-crimson">
                            {h2h ? h2h.dismissals : 0}
                          </td>
                          <td className="font-mono text-center text-turf-emerald font-semibold">
                            {h2h && h2h.balls > 0 ? h2h.strike_rate?.toFixed(1) : "-"}
                          </td>
                          <td className="font-mono text-center">
                            {bat ? bat.strike_rate?.toFixed(1) : "-"}
                          </td>
                          <td className="font-mono text-center text-ball-crimson/95">
                            {bowl ? bowl.economy?.toFixed(2) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function renderFormattedText(text: string) {
  if (!text) return null;
  
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Check for headings (e.g. ### Heading)
    if (line.startsWith("### ")) {
      const headingText = line.replace("### ", "");
      return (
        <h4 key={idx} className="font-display font-bold text-turf-emerald text-[11px] tracking-wider uppercase mt-4 mb-2">
          {parseBoldText(headingText)}
        </h4>
      );
    }
    
    // Check for list items (e.g. - list item)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const bulletText = line.substring(2);
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-header-text/90 mb-1.5 leading-relaxed">
          {parseBoldText(bulletText)}
        </li>
      );
    }
    
    // Empty paragraph lines
    if (line.trim() === "") {
      return <div key={idx} className="h-1.5" />;
    }
    
    // Regular paragraph lines
    return (
      <p key={idx} className="text-xs text-header-text/90 mb-2 leading-relaxed">
        {parseBoldText(line)}
      </p>
    );
  });
}

function parseBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-extrabold text-header-text">{part}</strong>;
    }
    return part;
  });
}
