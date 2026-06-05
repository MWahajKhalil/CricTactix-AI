"use client";

import { useState } from "react";

type BattingStat = {
  player: string;
  runs: number;
  balls: number;
  strike_rate: number;
};

type BowlingStat = {
  player: string;
  overs: string;
  runs_conceded: number;
  wickets: number;
  economy: number;
};

type FallOfWicket = {
  wicket_number: number;
  score: number;
  player: string;
  over: string;
};

type Innings = {
  innings_number: number;
  batting_team: string;
  bowling_team: string;
  batting: BattingStat[];
  bowling: BowlingStat[];
  total_runs: number;
  wickets: number;
  extras: number;
  overs: string;
  yet_to_bat?: string[];
  fall_of_wickets?: FallOfWicket[];
};

type Scorecard = {
  innings: Innings[];
};

type MatchScorecardProps = {
  scorecard: Scorecard;
};

export default function MatchScorecard({ scorecard }: MatchScorecardProps) {
  const inningsList = scorecard.innings;
  const [activeInningsNumber, setActiveInningsNumber] = useState<number>(
    inningsList[0]?.innings_number || 1
  );

  if (inningsList.length === 0) {
    return (
      <div className="premium-sports-card p-12 text-center bg-bg-secondary/10">
        <p className="font-mono text-xs text-text-muted tracking-widest">
          BALL_BY_BALL_RECORDING_UNAVAILABLE
        </p>
      </div>
    );
  }

  const currentInnings =
    inningsList.find((inn) => inn.innings_number === activeInningsNumber) ||
    inningsList[0];

  return (
    <div className="space-y-6">
      {/* INNINGS TABS */}
      <div className="flex flex-wrap gap-3 border-b border-border-color pb-4">
        {inningsList.map((inn) => {
          const isActive = inn.innings_number === activeInningsNumber;
          return (
            <button
              key={inn.innings_number}
              onClick={() => setActiveInningsNumber(inn.innings_number)}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg border text-xs font-bold transition duration-200 cursor-pointer ${
                isActive
                  ? "border-turf-emerald bg-turf-emerald/5 text-header-text"
                  : "border-border-color bg-bg-secondary/40 text-text-muted hover:text-header-text hover:border-border-color/80"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-turf-emerald animate-pulse" : "bg-text-muted"
                }`}
              />
              <span className="font-display font-bold uppercase tracking-wider">
                {inn.batting_team}
              </span>
              <span className="font-mono bg-bg-secondary/60 px-2 py-0.5 rounded text-[10px] text-header-text">
                {inn.total_runs}/{inn.wickets}
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE INNINGS CONTENT */}
      <section className="space-y-4">
        {/* INNINGS SUMMARY HEADER */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-widest text-accent-cyan uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
              INNINGS {currentInnings.innings_number}
            </span>
            <h3 className="sports-heading text-lg text-header-text mt-0.5">
              {currentInnings.batting_team} Scorecard
            </h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold text-header-text">
              {currentInnings.total_runs}/{currentInnings.wickets}
            </span>
            <span className="text-text-muted text-xs font-mono ml-2">
              ({currentInnings.overs} ov)
            </span>
          </div>
        </div>

        {/* UNIFIED CARD CONTAINER */}
        <div className="premium-sports-card p-6 bg-bg-secondary/5 space-y-6">
          {/* BATTING TABLE */}
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr className="text-text-muted font-mono text-[9px] border-b border-border-color/50">
                    <th className="pb-2 text-left font-semibold">BATTING</th>
                    <th className="pb-2 text-right font-semibold">RUNS</th>
                    <th className="pb-2 text-right font-semibold">BALLS</th>
                    <th className="pb-2 text-right font-semibold">S/R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/40 font-sans">
                  {currentInnings.batting.map((bat: BattingStat) => {
                    const isHighSR = bat.strike_rate >= 165 && bat.balls > 5;
                    const isHighScore = bat.runs >= 40;
                    return (
                      <tr
                        key={`${currentInnings.innings_number}-${bat.player}`}
                        className="hover:bg-bg-secondary/20"
                      >
                        <td className="py-2.5 text-left font-medium text-header-text">
                          {bat.player}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-bold text-header-text ${
                            isHighScore ? "text-metric-amber" : ""
                          }`}
                        >
                          {bat.runs}
                        </td>
                        <td className="py-2.5 text-right text-text-muted font-mono">
                          {bat.balls}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-semibold ${
                            isHighSR ? "text-turf-emerald" : "text-text-muted"
                          }`}
                        >
                          {bat.strike_rate.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* EXTRAS ROW */}
                  <tr className="bg-bg-secondary/5">
                    <td className="py-2 text-left font-medium text-text-muted text-[10px] uppercase tracking-wider font-mono">
                      Extras
                    </td>
                    <td
                      className="py-2 text-right font-mono font-bold text-header-text"
                      colSpan={3}
                    >
                      {currentInnings.extras}
                    </td>
                  </tr>

                  {/* TOTAL ROW */}
                  <tr className="border-t border-border-color font-semibold">
                    <td className="py-2.5 text-left font-bold text-header-text text-[11px] uppercase tracking-wider font-mono">
                      Total
                    </td>
                    <td
                      className="py-2.5 text-right font-mono font-extrabold text-header-text"
                      colSpan={3}
                    >
                      {currentInnings.total_runs}/{currentInnings.wickets}{" "}
                      <span className="text-text-muted font-normal text-xs ml-1.5">
                        ({currentInnings.overs} overs)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* NEXT TO BAT & FALL OF WICKETS DETAILS */}
            {((currentInnings.yet_to_bat &&
              currentInnings.yet_to_bat.length > 0) ||
              (currentInnings.fall_of_wickets &&
                currentInnings.fall_of_wickets.length > 0)) && (
              <div className="pt-2 space-y-2.5">
                {/* NEXT TO BAT */}
                {currentInnings.yet_to_bat &&
                  currentInnings.yet_to_bat.length > 0 && (
                    <div className="text-[11px] flex flex-col sm:flex-row sm:items-baseline gap-1">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-muted min-w-[90px] block">
                        Did not bat:
                      </span>
                      <span className="text-text-muted font-medium font-sans">
                        {currentInnings.yet_to_bat.join(", ")}
                      </span>
                    </div>
                  )}

                {/* FALL OF WICKETS */}
                {currentInnings.fall_of_wickets &&
                  currentInnings.fall_of_wickets.length > 0 && (
                    <div className="text-[11px] flex flex-col sm:flex-row sm:items-baseline gap-1">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-muted min-w-[90px] block">
                        Fall of Wickets:
                      </span>
                      <span className="font-mono text-[9px] text-text-muted flex flex-wrap gap-x-2 gap-y-1">
                        {currentInnings.fall_of_wickets.map((fow, idx) => (
                          <span
                            key={fow.wicket_number}
                            className="inline-flex items-center"
                          >
                            <span className="font-bold text-header-text">
                              {fow.wicket_number}-{fow.score}
                            </span>
                            <span className="ml-0.5 text-[8px] text-text-muted">
                              ({fow.player}, {fow.over} ov)
                            </span>
                            {idx <
                              (currentInnings.fall_of_wickets?.length ?? 0) -
                                1 && (
                              <span className="ml-2 text-border-color font-bold">
                                &bull;
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* BOWLING TABLE */}
          <div className="space-y-4 pt-5 border-t border-border-color">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr className="text-text-muted font-mono text-[9px] border-b border-border-color/50">
                    <th className="pb-2 text-left font-semibold">BOWLING</th>
                    <th className="pb-2 text-right font-semibold">OVERS</th>
                    <th className="pb-2 text-right font-semibold">RUNS</th>
                    <th className="pb-2 text-right font-semibold">WKTS</th>
                    <th className="pb-2 text-right font-semibold">ECON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/40 font-sans">
                  {currentInnings.bowling.map((bowl: BowlingStat) => {
                    const isLowEcon =
                      bowl.economy <= 6.5 && bowl.overs !== "0.0";
                    const isHighWkts = bowl.wickets >= 3;
                    return (
                      <tr
                        key={`${currentInnings.innings_number}-${bowl.player}`}
                        className="hover:bg-bg-secondary/20"
                      >
                        <td className="py-2.5 text-left font-medium text-header-text">
                          {bowl.player}
                        </td>
                        <td className="py-2.5 text-right text-text-muted font-mono">
                          {bowl.overs}
                        </td>
                        <td className="py-2.5 text-right text-text-muted font-mono">
                          {bowl.runs_conceded}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-bold ${
                            isHighWkts ? "text-ball-crimson" : "text-header-text"
                          }`}
                        >
                          {bowl.wickets}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-semibold ${
                            isLowEcon ? "text-turf-emerald" : "text-text-muted"
                          }`}
                        >
                          {bowl.economy.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
