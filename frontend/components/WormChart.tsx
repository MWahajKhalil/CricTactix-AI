"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type OverProgressItem = {
  over: number;
  runs: number;
  wickets: number;
};

type WormChartProps = {
  innings1Progress: OverProgressItem[];
  innings2Progress: OverProgressItem[];
  team1Name: string;
  team2Name: string;
};

export default function WormChart({
  innings1Progress = [],
  innings2Progress = [],
  team1Name,
  team2Name,
}: WormChartProps) {
  // Determine max overs to map (usually 20 for T20, but handles reduced/longer matches)
  const maxOvers = Math.max(
    innings1Progress.length,
    innings2Progress.length,
    20
  );

  // Generate over-by-over chart data
  const data = Array.from({ length: maxOvers }, (_, idx) => {
    const overNum = idx + 1;
    const inn1 = innings1Progress.find((o) => o.over === overNum);
    const inn2 = innings2Progress.find((o) => o.over === overNum);

    const prevInn1 = idx > 0 ? innings1Progress.find((o) => o.over === overNum - 1) : null;
    const prevInn2 = idx > 0 ? innings2Progress.find((o) => o.over === overNum - 1) : null;

    // A wicket fell if the cumulative count increased
    const t1WicketFell = inn1
      ? idx === 0
        ? inn1.wickets > 0
        : inn1.wickets > (prevInn1?.wickets || 0)
      : false;

    const t2WicketFell = inn2
      ? idx === 0
        ? inn2.wickets > 0
        : inn2.wickets > (prevInn2?.wickets || 0)
      : false;

    return {
      over: overNum,
      [team1Name]: inn1 ? inn1.runs : null,
      [team2Name]: inn2 ? inn2.runs : null,
      t1Wickets: inn1 ? inn1.wickets : 0,
      t2Wickets: inn2 ? inn2.wickets : 0,
      t1WicketFell,
      t2WicketFell,
    };
  });

  // Custom marker for Wickets fell (plotted as red dots on the run progression lines)
  const renderWicketDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    const wicketFell = dataKey === team1Name ? payload.t1WicketFell : payload.t2WicketFell;

    if (wicketFell) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#f43f5e" /* ball-crimson */
          stroke="#ffffff"
          strokeWidth={1.5}
          className="filter drop-shadow-sm animate-pulse"
        />
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[320px] md:h-[380px] bg-bg-secondary/5 rounded-lg border border-border-color/40 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="over"
            stroke="rgba(255, 255, 255, 0.4)"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            label={{
              value: "OVERS",
              position: "insideBottom",
              offset: -5,
              fontSize: 8,
              fontFamily: "monospace",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.4)"
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            label={{
              value: "CUMULATIVE RUNS",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              fontSize: 8,
              fontFamily: "monospace",
              fill: "rgba(255, 255, 255, 0.4)",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(18, 20, 28, 0.95)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
            }}
            labelStyle={{
              color: "rgba(255, 255, 255, 0.4)",
              fontFamily: "monospace",
              fontSize: "9px",
              marginBottom: "8px",
            }}
            itemStyle={{
              color: "#f8fafc",
              fontFamily: "sans-serif",
              fontSize: "11px",
              padding: "2px 0",
            }}
            labelFormatter={(label) => `End of Over ${label}`}
            formatter={(value: any, name: any, props: any) => {
              const { payload } = props;
              const wickets = name === team1Name ? payload.t1Wickets : payload.t2Wickets;
              return [
                <span className="font-semibold text-header-text">
                  {value} <span className="text-text-muted font-normal">({wickets} wkts)</span>
                </span>,
                name
              ];
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "rgba(255, 255, 255, 0.8)",
              paddingBottom: "10px",
            }}
          />
          <Line
            type="monotone"
            dataKey={team1Name}
            stroke="#10b981" /* turf-emerald */
            strokeWidth={2.5}
            dot={renderWicketDot}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey={team2Name}
            stroke="#06b6d4" /* accent-cyan */
            strokeWidth={2.5}
            dot={renderWicketDot}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
