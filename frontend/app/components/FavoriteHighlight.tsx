"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBasketballBall } from "react-icons/fa";
import { apiCall } from "@/api";
import { useGetUser } from "@/hooks/useGetUser";
import { FaShieldAlt } from "react-icons/fa";
import { PiBasketballBold } from "react-icons/pi";

export function FavoriteHighlight() {
  const { data, isLoading } = useGetUser();
  const user = data;

  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [playerImg, setPlayerImg] = useState<string | null>(null);

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [loadingTeamData, setLoadingTeamData] = useState(false);

  const [teamData, setTeamData] = useState<any>(null);

  const [playerData, setPlayerData] = useState<any>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const playerTrivia = playerData?.trivia?.[0];

  const fetchTeamData = async (teamId: number) => {
    setLoadingTeamData(true);
    try {
      const [response, status] = await apiCall("/favourite_team_data", {
        method: "POST",
        body: JSON.stringify({ team_id: teamId }),
      });

      if (status === 200) {
        setTeamData(response);
      }
    } finally {
      setLoadingTeamData(false);
    }
  };

  useEffect(() => {
    if (!user?.favourite_team_name) return;

    const fetchLogo = async () => {
      setLoadingTeam(true);
      try {
        const [response, status] = await apiCall(
          `/teams?search=${encodeURIComponent(user.favourite_team_name)}`,
          { method: "GET" }
        );

        if (status === 200 && Array.isArray(response)) {
          const exact =
            response.find(
              (t: any) =>
                t.full_name?.toLowerCase() ===
                user.favourite_team_name.toLowerCase()
            ) || response[0];

          setTeamLogo(exact.logo_url ?? null);

          fetchTeamData(exact.id);
        }
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchLogo();
  }, [user]);

  const fetchPlayerData = async (playerId: number) => {
    setLoadingPlayerData(true);
    try {
      const [response, status] = await apiCall("/favourite_player_data", {
        method: "POST",
        body: JSON.stringify({ player_id: playerId }),
      });

      if (status === 200) {
        setPlayerData(response);
      }
    } finally {
      setLoadingPlayerData(false);
    }
  };

  useEffect(() => {
    if (!user?.favourite_player_name) return;

    const fetchPlayer = async () => {
      setLoadingPlayer(true);

      try {
        const [response, status] = await apiCall(
          `/player-image?name=${encodeURIComponent(user.favourite_player_name)}`
        );

        if (status === 200 && response?.image_url) {
          setPlayerImg(response.image_url);
        }

        if (status === 200 && response?.player_id) {
          fetchPlayerData(response.player_id);
        }
      } finally {
        setLoadingPlayer(false);
      }
    };

    fetchPlayer();
  }, [user]);

  if (isLoading || !user) return null;

  const trivia = teamData?.trivia?.[0];
  const stats = teamData?.stats;
  const form = teamData?.form;

  const formatDate = (iso: string | undefined) => {
    if (!iso) return "N/A";
    const date = new Date(iso);
    return date.toLocaleDateString("en-GB").replace(/\//g, ".");
  };

  const convertHeight = (height: string | undefined) => {
    if (!height) return "N/A";

    const [feet, inches] = height.split("-").map(Number);
    if (isNaN(feet) || isNaN(inches)) return height;

    const cm = Math.round(feet * 30.48 + inches * 2.54);

    return `${feet}'${inches}" (${cm} cm)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        w-full max-w-6xl mx-auto mb-10 
        bg-white/10 border border-white/20 backdrop-blur-lg 
        rounded-3xl shadow-2xl p-7
      "
    >
      <h1 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
        Your Favorites:
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="
            flex flex-col items-center bg-white/10 backdrop-blur-lg 
            border border-white/20 rounded-2xl p-6 shadow-lg 
            hover:bg-white/20 transition
          "
        >
          <h2 className="text-yellow-400 font-semibold text-2xl mb-3">
            Favorite Team
          </h2>

          {loadingTeam ? (
            <div className="w-[90px] h-[90px] bg-white/20 animate-pulse rounded-lg" />
          ) : teamLogo ? (
            <img
              src={teamLogo}
              alt="Favorite Team Logo"
              className="w-[120px] h-[120px] object-contain"
            />
          ) : (
            <FaBasketballBall className="text-yellow-400 w-[120px] h-[120px]" />
          )}

          <p className="text-xl font-bold text-white mt-3">
            {user.favourite_team_name ?? "—"}
          </p>

          {loadingTeamData ? (
            <div className="mt-3 text-white/60">Loading team stats...</div>
          ) : teamData ? (
            <div className="mt-3 w-full text-center text-white/80 text-base">
              <p className="mb-1">
                <span className="text-yellow-300 font-semibold">City:</span>{" "}
                {trivia?.city}
              </p>

              <p className="mb-1">
                <span className="text-yellow-300 font-semibold">Founded:</span>{" "}
                {trivia?.year_founded}.
              </p>

              <p className="mb-1">
                <span className="text-yellow-300 font-semibold">
                  Win percentage:
                </span>{" "}
                {stats?.win_percentage}%
              </p>

              <div className="mb-1">
                <span className="text-yellow-300 font-semibold">
                  Last 10 Games:
                </span>

                <div className="flex justify-center flex-wrap gap-1 mt-2">
                  {form.split("").map((letter, i) => (
                    <div
                      key={i}
                      className={`
          w-7 h-7 rounded-full flex items-center justify-center 
          text-sm font-semibold text-white
          ${letter === "W" ? "bg-[#297b04]" : "bg-[#8d0404]"}
        `}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 bg-white/10 rounded-xl p-4 space-y-3">
                <p className="text-yellow-300 font-semibold text-lg">
                  Team stats:
                </p>

                <div>
                  <p className="text-white/90 font-semibold mb-2 border-b border-white/20 pb-1 flex items-center gap-1 justify-center">
                    <PiBasketballBold className="text-[#F57627]" size={26} />
                    Offense
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[14.2px] text-white/80 text-left">
                    <p>Points per game: {stats?.points_per_game}</p>
                    <p>Rebounds per game: {stats?.rebounds_per_game}</p>
                    <p>Assists per game: {stats?.assists_per_game}</p>
                    <p>Turnovers per game: {stats?.turnovers_per_game}</p>

                    <p>
                      Field goal percentage: {stats?.field_goal_percentage}%
                    </p>
                    <p>
                      Three point percentage: {stats?.three_point_percentage}%
                    </p>
                    <p>
                      Free throw percentage: {stats?.free_throw_percentage}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-white/90 font-semibold mb-2 border-b border-white/20 pb-1 flex items-center gap-2 justify-center">
                    <FaShieldAlt className="text-blue-700" size={22} />
                    Defense
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[14.2px] text-white/80 text-left">
                    <p>Steals per game: {stats?.steals_per_game}</p>
                    <p>Blocks per game: {stats?.blocks_per_game}</p>
                    <p>
                      Personal fouls per game: {stats?.personal_fouls_per_game}
                    </p>
                    <p>
                      Opponent points per game:{" "}
                      {stats?.opponent_points_per_game}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="
            flex flex-col items-center bg-white/10 backdrop-blur-lg 
            border border-white/20 rounded-2xl p-6 shadow-lg 
            hover:bg-white/20 transition
          "
        >
          <h2 className="text-yellow-400 font-semibold text-2xl mb-3">
            Favorite Player
          </h2>

          {loadingPlayer ? (
            <div className="w-[90px] h-[90px] rounded-full bg-white/20 animate-pulse" />
          ) : playerImg ? (
            <img
              src={playerImg}
              alt="Favorite Player"
              className="w-[95px] h-[95px] object-cover rounded-full shadow-md"
            />
          ) : (
            <div className="w-[90px] h-[90px] rounded-full bg-white/20 flex items-center justify-center text-yellow-400 text-4xl font-bold">
              ?
            </div>
          )}

          <p className="text-xl font-bold text-white mt-3">
            {user.favourite_player_name ?? "—"}
          </p>

          {playerTrivia && (
            <div className="mt-3 w-full text-center text-white/80 text-base space-y-1">
              <p>
                <span className="text-yellow-300 font-semibold">Country:</span>{" "}
                {playerTrivia.country}
              </p>

              <p>
                <span className="text-yellow-300 font-semibold">
                  Birthdate:
                </span>{" "}
                {formatDate(playerTrivia.birthdate)}
              </p>

              <p>
                <span className="text-yellow-300 font-semibold">Height:</span>{" "}
                {convertHeight(playerTrivia?.height)}
              </p>

              <p>
                <span className="text-yellow-300 font-semibold">Position:</span>{" "}
                {playerTrivia.position}
              </p>

              <p>
                <span className="text-yellow-300 font-semibold">Jersey:</span> #
                {playerTrivia.jersey}
              </p>

              <p>
                <span className="text-yellow-300 font-semibold">
                  Draft year:
                </span>{" "}
                {playerTrivia.draft_year}.
              </p>
            </div>
          )}

          {loadingPlayerData ? (
            <div className="text-white/60 mt-3">Loading player info...</div>
          ) : playerData ? (
            <div className="mt-6 grid grid-cols-2 gap-6 w-full">
              <div
                className="
      flex flex-col items-center 
      bg-white/10 rounded-2xl 
      p-5 border border-white/20 
      shadow-md
    "
              >
                <p className="text-yellow-300 font-semibold text-xl mb-3">
                  Current Team
                </p>

                {playerData.team_logo_url ? (
                  <img
                    src={playerData.team_logo_url}
                    className="w-28 h-28 object-contain"
                    alt="current team"
                  />
                ) : (
                  <p className="text-white/60 text-sm">No team</p>
                )}
              </div>

              <div
                className="
      flex flex-col items-center 
      bg-white/10 rounded-2xl 
      p-5 border border-white/20 
      shadow-md
    "
              >
                <p className="text-yellow-300 font-semibold text-xl mb-3">
                  Draft Team
                </p>

                {playerData.draft_team_logo_url ? (
                  <img
                    src={playerData.draft_team_logo_url}
                    className="w-28 h-28 object-contain"
                    alt="draft team"
                  />
                ) : (
                  <p className="text-white/60 text-sm">Not drafted</p>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}
