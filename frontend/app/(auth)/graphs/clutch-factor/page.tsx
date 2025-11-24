"use client";

import { useState, useEffect, useRef } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/airbnb.css";
import { Calendar, Plus } from "lucide-react";
import { apiCall } from "@/api";
import { BubbleChart } from "@/app/components/BubbleChart";
import { Flame } from "lucide-react";

export default function ClutchFactorPage() {
  const [search, setSearch] = useState("");
  const [dropdown, setDropdown] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  const MAX_PLAYERS = 10;
  const ref = useRef(null);

  const [dateRange, setDateRange] = useState([null, null]);
  const datepickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (search.trim().length === 0) {
      setResults([]);
      return;
    }

    const fetchPlayers = async () => {
      const [data, status] = await apiCall(
        `/players?search=${encodeURIComponent(search)}`
      );
      if (status === 200) setResults(data);
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  function generateColor(index) {
    const goldenAngle = 137.508;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }

  const addPlayer = (p) => {
    if (selectedPlayers.length >= MAX_PLAYERS) return;
    if (selectedPlayers.some((x) => x.player_id === p.player_id)) return;

    const color = generateColor(selectedPlayers.length);

    setSelectedPlayers([...selectedPlayers, { ...p, color }]);
    setSearch("");
    setDropdown(false);
  };

  useEffect(() => {
    const loadStats = async () => {
      if (selectedPlayers.length === 0) return;
      if (!dateRange[0] || !dateRange[1]) return;

      const start = dateRange[0].toISOString().split("T")[0];
      const end = dateRange[1].toISOString().split("T")[0];

      const allStats = [];

      for (const p of selectedPlayers) {
        const [data, status] = await apiCall("/get_clutch_factor", {
          method: "POST",
          body: JSON.stringify({
            player_id: p.player_id,
            start_date: start,
            end_date: end,
          }),
        });
        console.log(data);

        if (status === 200 && data?.player?.clutch_stats) {
          allStats.push({
            player_id: p.player_id,
            name: p.name,
            jersey: p.jersey,
            image_url: p.image_url,
            ppg: data.player.clutch_stats.average_points,
            win_pct: data.player.clutch_stats.win_percentage,
            fg_pct: data.player.clutch_stats.field_goal_percentage,
            color: p.color || null,
          });
        }
      }

      setPlayerStats(allStats);
    };

    loadStats();
  }, [selectedPlayers, dateRange]);

  return (
    <div className="flex justify-center py-6 px-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-7xl">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Flame className="w-10 h-10 text-white" />
          <h1 className="text-3xl font-bold text-white">Clutch Factor</h1>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 mb-4 w-full">
          <div ref={ref} className="relative w-full md:w-1/2">
            <div
              className="flex items-center bg-white/20 border border-white/30 rounded-3xl px-4 py-3 cursor-text"
              onClick={() => setDropdown(true)}
            >
              <Plus className="text-white mr-2" />
              <input
                className="bg-transparent w-full text-white placeholder-white/60 focus:outline-none"
                placeholder="Add player..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setDropdown(true)}
              />
            </div>

            {dropdown && (
              <div className="absolute bg-white/95 text-black rounded-lg mt-1 w-full shadow-xl max-h-48 overflow-y-auto scrollbar-yellow animate-dropdownFade z-20">
                {results.length === 0 ? (
                  <div className="p-3 text-gray-600">Start typing...</div>
                ) : (
                  results.map((p) => {
                    const isSelected = selectedPlayers.some(
                      (x) => x.player_id === p.player_id
                    );

                    return (
                      <div
                        key={p.player_id}
                        onClick={() => {
                          if (!isSelected) addPlayer(p);
                        }}
                        className={`p-2 flex items-center gap-2 transition
                          ${
                            isSelected
                              ? "bg-red-100 cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:bg-yellow-200"
                          }`}
                      >
                        <img
                          src={p.image_url}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span>{p.name}</span>

                        {isSelected && (
                          <span className="ml-auto text-red-500 text-xs font-semibold">
                            Already added
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="relative w-full md:w-1/2 clutch-calendar">
            <Flatpickr
              placeholder="Select date range..."
              ref={datepickerRef}
              value={dateRange}
              options={{
                mode: "range",
                dateFormat: "d.m.Y",
                minDate: "01.01.2006",
                maxDate: "31.12.2022",
                locale: { rangeSeparator: " - " },
                clickOpens: true,
                closeOnSelect: false,
                onChange: (selectedDates) => {
                  if (selectedDates.length === 2) setDateRange(selectedDates);
                },
                onClose: (selectedDates) => {
                  if (selectedDates.length < 2) {
                    setDateRange([null, null]);
                    datepickerRef.current?.flatpickr.clear();
                  }
                },
              }}
              onReady={(_, __, instance) => {
                instance.calendarContainer.classList.add(
                  "clutch-calendar-popup"
                );
              }}
              className="bg-white/20 border border-white/30 text-white rounded-3xl px-6 py-3 text-center placeholder-white/60 w-full"
            />

            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 w-6 h-6 pointer-events-none" />
          </div>
        </div>

        {selectedPlayers.length >= MAX_PLAYERS && (
          <p className="text-red-700 font-semibold mb-4">
            Maximum of 10 players reached!!!
          </p>
        )}

        {selectedPlayers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl text-white font-semibold mb-4">
              Selected Players:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-56 pr-2 overflow-y-auto scrollbar-yellow animate-dropdownFade">
              {selectedPlayers.map((p) => (
                <div
                  key={p.player_id}
                  className="bg-white/10 border border-white/20 rounded-2xl p-3 flex items-center gap-4 shadow-md"
                >
                  <img
                    src={p.image_url}
                    className="w-16 h-16 rounded-full object-cover"
                  />

                  <div className="flex flex-col">
                    <span className="text-white font-semibold text-lg leading-tight">
                      {p.name}
                    </span>
                    <span className="text-white/70 text-sm">#{p.jersey}</span>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedPlayers(
                        selectedPlayers.filter(
                          (x) => x.player_id !== p.player_id
                        )
                      )
                    }
                    className="ml-auto text-red-700 hover:text-red-500 text-base font-semibold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPlayers.length > 0 && dateRange[0] && dateRange[1] && (
          <>
            <div className="flex justify-center mb-8 gap-4 mt-8">
              <p className="inline-block border border-white/40 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                <strong>Clutch games</strong> are games decided by{" "}
                <strong>5 points or less</strong>.
              </p>

              <p className="inline-block border border-white/40 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-md">
                Bigger bubbles indicate a <strong>higher FG%</strong> in those
                games.
              </p>
            </div>

            <div
              className="rounded-xl backdrop-blur-md border border-white/10 shadow-xl p-6"
              style={{ background: "rgba(30, 41, 59, 0.25)" }}
            >
              <BubbleChart data={playerStats} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
