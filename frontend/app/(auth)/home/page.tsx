"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 text-white min-h-[70vh] px-6">
      {/* ADD FAVOURITE PLAYER + TEAM*/}
      <h1 className="text-4xl font-bold drop-shadow-lg text-center">
        Choose Visualization Type
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link
          href="/graphs/team-stats"
          className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 cursor-pointer hover:scale-105"
        >
          <p className="text-2xl font-semibold">📈 Team Stats Trend</p>
          <p className="text-sm opacity-80 text-center">
            Visualize and compare statistics of selected teams.
          </p>
        </Link>

        <Link
          href="/graphs/player-stats"
          className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 cursor-pointer hover:scale-105"
        >
          <p className="text-2xl font-semibold">📊 Player Statistics</p>
          <p className="text-sm opacity-80 text-center">
            Compare detailed performance metrics for two individual players.
          </p>
        </Link>

        <Link
          href="/graphs/clutch-factor"
          className="bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 cursor-pointer hover:scale-105"
        >
          <p className="text-2xl font-semibold">🔥 Clutch Factor</p>
          <p className="text-sm opacity-80 text-center">
            Analyze player performance in high-pressure moments.
          </p>
        </Link>
      </div>
    </div>
  );
}
