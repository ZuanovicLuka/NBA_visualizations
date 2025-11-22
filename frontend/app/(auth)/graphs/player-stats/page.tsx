"use client";

import { useState, useEffect, useRef } from "react";
import { apiCall } from "@/api";
import { MirrorChart } from "@/app/components/MirrorChart";
import { BarChart3 } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/airbnb.css";
import { Calendar } from "lucide-react";

export default function PlayerStatsPage() {
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [player1Image, setPlayer1Image] = useState<string | null>(null);
  const [player2Image, setPlayer2Image] = useState<string | null>(null);

  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const [dropdown1, setDropdown1] = useState(false);
  const [dropdown2, setDropdown2] = useState(false);

  const [results1, setResults1] = useState([]);
  const [results2, setResults2] = useState([]);

  const ref1 = useRef(null);
  const ref2 = useRef(null);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const datepickerRef = useRef<any>(null);

  // Mock stats — kasnije API
  const metrics = [
    { key: "games", label: "Number of games", p1: 17, p2: 14 },
    { key: "points", label: "Points", p1: 28, p2: 23 },
    { key: "assists", label: "Assists", p1: 6, p2: 4 },
    { key: "rebounds", label: "Rebounds", p1: 9, p2: 11 },
    { key: "fg", label: "FG %", p1: 52, p2: 48 },
    { key: "threept", label: "3PT %", p1: 40, p2: 36 },
    { key: "ft", label: "FT %", p1: 87, p2: 75 },
  ];

  const [activeMetrics, setActiveMetrics] = useState(metrics.map((m) => m.key));

  const toggleMetric = (key: string) => {
    if (activeMetrics.includes(key)) {
      setActiveMetrics(activeMetrics.filter((x) => x !== key));
    } else {
      setActiveMetrics([...activeMetrics, key]);
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (ref1.current && !ref1.current.contains(e.target)) {
        setDropdown1(false);
      }
      if (ref2.current && !ref2.current.contains(e.target)) {
        setDropdown2(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (search1.trim().length === 0) {
      setResults1([]);
      return;
    }

    const fetchPlayers = async () => {
      const [data, status] = await apiCall(
        `/players?search=${encodeURIComponent(search1)}`
      );
      if (status === 200) setResults1(data);
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [search1]);

  useEffect(() => {
    if (search2.trim().length === 0) {
      setResults2([]);
      return;
    }

    const fetchPlayers = async () => {
      const [data, status] = await apiCall(
        `/players?search=${encodeURIComponent(search2)}`
      );
      if (status === 200) setResults2(data);
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [search2]);

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-10 text-center flex items-center justify-center gap-3">
          <BarChart3 className="w-10 h-10 text-white" />
          Player Statistics Comparison
        </h1>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div ref={ref1} className="relative">
            <input
              className="w-full p-3 rounded-3xl bg-white/20 border border-white/30 text-white placeholder-white/60"
              placeholder="Search Player 1..."
              value={search1}
              onFocus={() => setDropdown1(true)}
              onChange={(e) => {
                setSearch1(e.target.value);
                setDropdown1(true);
              }}
            />

            {dropdown1 && (
              <div className="absolute bg-white/95 text-black rounded-lg mt-1 w-full shadow-xl max-h-48 overflow-y-auto scrollbar-yellow animate-dropdownFade z-20">
                {results1.length === 0 ? (
                  <div className="p-3 text-gray-600">Start typing...</div>
                ) : (
                  results1.map((p: any) => (
                    <div
                      key={p.player_id}
                      className="p-2 hover:bg-yellow-200 cursor-pointer flex items-center gap-2"
                      onClick={() => {
                        setPlayer1(p.name);
                        setPlayer1Image(p.image_url || null);
                        setSearch1(p.name);
                        setDropdown1(false);
                      }}
                    >
                      <img
                        src={p.image_url}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span>{p.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div ref={ref2} className="relative">
            <input
              className="w-full p-3 rounded-3xl bg-white/20 border border-white/30 text-white placeholder-white/60"
              placeholder="Search Player 2..."
              value={search2}
              onFocus={() => setDropdown2(true)}
              onChange={(e) => {
                setSearch2(e.target.value);
                setDropdown2(true);
              }}
            />

            {dropdown2 && (
              <div className="absolute bg-white/95 text-black rounded-lg mt-1 w-full shadow-xl max-h-48 overflow-y-auto scrollbar-yellow animate-dropdownFade z-20">
                {results2.length === 0 ? (
                  <div className="p-3 text-gray-600">Start typing...</div>
                ) : (
                  results2.map((p: any) => (
                    <div
                      key={p.player_id}
                      className="p-2 hover:bg-yellow-200 cursor-pointer flex items-center gap-2"
                      onClick={() => {
                        setPlayer2(p.name);
                        setPlayer2Image(p.image_url || null);
                        setSearch2(p.name);
                        setDropdown2(false);
                      }}
                    >
                      <img
                        src={p.image_url}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span>{p.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="relative w-80">
            <Flatpickr
              placeholder="Select date range..."
              ref={datepickerRef}
              value={dateRange}
              options={{
                mode: "range",
                dateFormat: "d.m.Y",
                locale: {
                  rangeSeparator: " - ",
                } as any,
              }}
              onChange={(dates) => {
                setDateRange([dates[0] || null, dates[1] || null]);
              }}
              className="
        bg-white/20 border border-white/30 text-white
        rounded-3xl px-6 py-3 text-center
        placeholder-white/60 w-full
      "
            />

            <Calendar
              className="
        absolute left-8 top-1/2 -translate-y-1/2
        text-white/70 w-7 h-7 pointer-events-none
      "
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-10 justify-center">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={`
        px-5 py-2.5 rounded-full text-[15px] font-semibold transition-all
        border backdrop-blur-md

        ${
          activeMetrics.includes(m.key)
            ? "bg-blue-500/85 border-blue-300 text-white shadow-[0_0_12px_rgba(56,189,248,0.7)] scale-[1.04]"
            : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white"
        }
      `}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/20 bg-blue-500/10 shadow-lg p-6">
          <div className="flex items-center justify-center gap-10 mb-6">
            <div className="flex flex-col items-center">
              {player1Image ? (
                <img
                  src={player1Image}
                  className="w-28 h-28 rounded-full object-cover border-2 border-[#2755A8] shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 border border-white/30"></div>
              )}
              <p className="text-white mt-2 font-semibold text-center text-xl w-56 break-words leading-tight">
                {player1 || "Player 1"}
              </p>
            </div>

            <p className="text-white font-bold text-2xl mx-4">VS</p>

            <div className="flex flex-col items-center">
              {player2Image ? (
                <img
                  src={player2Image}
                  className="w-28 h-28 rounded-full object-cover border-2 border-yellow-300 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 border border-white/30"></div>
              )}
              <p className="text-white mt-2 font-semibold text-center text-xl w-56 break-words leading-tight">
                {player2 || "Player 2"}
              </p>
            </div>
          </div>

          <MirrorChart
            metrics={metrics}
            activeMetrics={activeMetrics}
            player1={player1}
            player2={player2}
          />
        </div>
      </div>
    </div>
  );
}
