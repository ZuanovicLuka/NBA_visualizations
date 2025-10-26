"use client";

import { useState, useEffect, useRef } from "react";
import { FaBasketballBall } from "react-icons/fa";
import { motion } from "framer-motion";
import { apiCall } from "@/api";
import "../globals.css";

export default function HomePage() {
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerDropdown, setPlayerDropdown] = useState(false);

  const playerRef = useRef<HTMLDivElement | null>(null);

  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSearchTerm(team || "");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [team]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playerRef.current &&
        !playerRef.current.contains(event.target as Node)
      ) {
        setPlayerDropdown(false);
        setPlayerSearchTerm(player || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [player]);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setTeams([]);
      return;
    }

    const fetchTeams = async () => {
      setLoading(true);
      const [data, status] = await apiCall(
        `/teams?search=${encodeURIComponent(searchTerm)}`
      );
      if (status === 200) setTeams(data);
      setLoading(false);
    };

    const debounce = setTimeout(fetchTeams, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
    if (playerSearchTerm.trim().length === 0) {
      setPlayers([]);
      return;
    }

    const fetchPlayers = async () => {
      setPlayerLoading(true);
      const [data, status] = await apiCall(
        `/players?search=${encodeURIComponent(playerSearchTerm)}`
      );
      if (status === 200) setPlayers(data);
      setPlayerLoading(false);
    };

    const debounce = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(debounce);
  }, [playerSearchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (team && player) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center relative">
          <div className="flex justify-center mb-3">
            <FaBasketballBall className="text-yellow-400 w-12 h-12" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-6">
            What's your NBA vibe?
          </h1>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="relative" ref={searchRef}>
                <input
                  type="text"
                  placeholder="Favourite NBA Team..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white/95 text-black rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto scrollbar-yellow">
                    {loading ? (
                      <div className="p-3 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : teams.length > 0 ? (
                      teams.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setTeam(t.name);
                            setSearchTerm(t.name);
                            setShowDropdown(false);
                          }}
                          className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-2"
                        >
                          <img
                            src={t.logo_url}
                            alt={t.name}
                            className="w-8 h-8"
                          />
                          <span>{t.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-800">
                        No teams found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {team && (
                <p className="text-white text-sm italic">
                  Selected team: <span className="font-bold">{team}</span>
                </p>
              )}

              <div className="relative" ref={playerRef}>
                <input
                  type="text"
                  placeholder="Favorite NBA Player..."
                  value={playerSearchTerm}
                  onChange={(e) => {
                    setPlayerSearchTerm(e.target.value);
                    setPlayerDropdown(true);
                  }}
                  onFocus={() => setPlayerDropdown(true)}
                  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                {playerDropdown && (
                  <div className="absolute z-10 w-full bg-white/95 text-black rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto scrollbar-yellow">
                    {playerLoading ? (
                      <div className="p-3 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : players.length > 0 ? (
                      players.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPlayer(p.name);
                            setPlayerSearchTerm(p.name);
                            setPlayerDropdown(false);
                          }}
                          className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-2"
                        >
                          <span>{p.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-800">
                        No players found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg transition"
              >
                Submit
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-white space-y-2"
            >
              <h2 className="text-xl font-semibold">🔥 Nice choice!</h2>
              <p>
                Your favorite team: <span className="font-bold">{team}</span>
              </p>
              <p>
                Your favorite player:{" "}
                <span className="font-bold">{player}</span>
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 border border-white text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
              >
                Edit
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
