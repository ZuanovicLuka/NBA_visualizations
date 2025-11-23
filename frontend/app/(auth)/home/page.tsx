"use client";

import Link from "next/link";
import { BarChart3, LineChart, Flame } from "lucide-react";
import { FavoriteHighlight } from "@/app/components/FavoriteHighlight";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 text-white min-h-[70vh] px-6">
      <FavoriteHighlight />

      <h1 className="text-4xl font-bold drop-shadow-lg text-center">
        Choose Visualization Type
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <Link
          href="/graphs/team-stats"
          className="
            group
            bg-white/10 backdrop-blur-md border border-white/20 
            hover:border-white/40 transition-all p-8 rounded-2xl 
            shadow-xl flex flex-col items-center gap-4 cursor-pointer 
            hover:scale-105
          "
        >
          <div className="flex items-center gap-3 text-2xl font-semibold">
            <LineChart
              className="
                w-8 h-8 text-white 
                transition-all duration-300 
                group-hover:scale-110 
                group-hover:-rotate-3 
                group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]
              "
            />
            <span>Team Stats Trend</span>
          </div>
          <p className="text-sm opacity-80 text-center">
            Visualize and compare statistics of selected teams.
          </p>
        </Link>

        <Link
          href="/graphs/player-stats"
          className="
            group
            bg-white/10 backdrop-blur-md border border-white/20 
            hover:border-white/40 transition-all p-8 rounded-2xl 
            shadow-xl flex flex-col items-center gap-4 cursor-pointer 
            hover:scale-105
          "
        >
          <div className="flex items-center gap-3 text-2xl font-semibold">
            <BarChart3
              className="
                w-8 h-8 text-white 
                transition-all duration-300 
                group-hover:scale-110 
                group-hover:-rotate-3
                group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]
              "
            />
            <span>Player Statistics</span>
          </div>
          <p className="text-sm opacity-80 text-center">
            Compare detailed performance metrics for two individual players.
          </p>
        </Link>

        <Link
          href="/graphs/clutch-factor"
          className="
            group
            bg-white/10 backdrop-blur-md border border-white/20 
            hover:border-white/40 transition-all p-8 rounded-2xl 
            shadow-xl flex flex-col items-center gap-4 cursor-pointer 
            hover:scale-105
          "
        >
          <div className="flex items-center gap-3 text-2xl font-semibold">
            <Flame
              className="
                w-8 h-8 text-white 
                transition-all duration-300 
                group-hover:scale-125 
                group-hover:-rotate-3
                group-hover:drop-shadow-[0_0_12px_rgba(255,140,0,0.8)]
              "
            />
            <span>Clutch Factor</span>
          </div>
          <p className="text-sm opacity-80 text-center">
            Analyze player performance in high-pressure moments.
          </p>
        </Link>
      </div>
    </div>
  );
}
