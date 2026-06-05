"use client";

import dynamicImport from "next/dynamic";

const WormChart = dynamicImport(() => import("./WormChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] md:h-[380px] w-full bg-bg-secondary/5 rounded-lg border border-border-color/40 flex items-center justify-center">
      <span className="font-mono text-xs text-text-muted animate-pulse">Loading Tactical Progression Chart...</span>
    </div>
  ),
});

type OverProgressItem = {
  over: number;
  runs: number;
  wickets: number;
};

type WormChartWrapperProps = {
  innings1Progress: OverProgressItem[];
  innings2Progress: OverProgressItem[];
  team1Name: string;
  team2Name: string;
};

export default function WormChartWrapper(props: WormChartWrapperProps) {
  return <WormChart {...props} />;
}
