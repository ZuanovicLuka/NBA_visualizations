"use client";

import { useState, useEffect, useRef } from "react";
import { FaBasketballBall, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { apiCall } from "@/api";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import "../globals.css";

interface JwtPayload {
  exp?: number;
  sub?: string;
}

export default function SetupPage() {
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerDropdown, setPlayerDropdown] = useState(false);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          router.push("/");
          return;
        }

        const [data, status] = await apiCall("/users/info", { method: "GET" });

        if (status === 200 && data) {
          const { favourite_team_name, favourite_player_name } = data;
          if (favourite_team_name && favourite_player_name) {
            router.push("/home");
            return;
          }
        } else {
          router.push("/");
          return;
        }
      } catch {
        localStorage.removeItem("token");
        router.push("/");
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuthAndSetup();
  }, [router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !player) return;

    const [data, status] = await apiCall("/setup-team-and-player", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        favourite_team_name: team,
        favourite_player_name: player,
        favourite_player_id: playerId,
      }),
    });

    if (status === 200) {
      console.log("Profile updated:", data);
      router.push("/home");
    } else {
      console.error("Failed to update profile:", data);
      alert("Error updating profile. Try again!");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 text-white">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

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

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {/* --- Team search --- */}
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
                          setTeam(t.full_name);
                          setSearchTerm(t.full_name);
                          setShowDropdown(false);
                        }}
                        className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-2"
                      >
                        <img
                          src={t.logo_url}
                          alt={t.full_name}
                          className="w-12 h-12"
                        />
                        <span className="text-lg font-semibold">
                          {t.full_name}
                        </span>
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
              <p className="text-white text-md italic">
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
                        key={p.player_id}
                        onClick={() => {
                          setPlayer(p.name);
                          setPlayerId(p.player_id);
                          setPlayerSearchTerm(p.name);
                          setPlayerDropdown(false);
                        }}
                        className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-3"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                            className="w-14 h-14 object-cover rounded-full border border-gray-300 shadow-sm"
                          />
                        ) : null}

                        <FaUserCircle
                          className={`w-14 h-14 text-gray-400 ${p.image_url ? "hidden" : ""}`}
                        />

                        <span className="text-lg font-semibold flex items-center">
                          {p.name}
                          {p.jersey != null && (
                            <span className="text-gray-500 text-md ml-2">
                              #{p.jersey}
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-800">
                      No players found...
                    </div>
                  )}
                </div>
              )}
            </div>

            {player && (
              <p className="text-white text-md italic">
                Selected player: <span className="font-bold">{player}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded-lg transition"
            >
              Submit
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
