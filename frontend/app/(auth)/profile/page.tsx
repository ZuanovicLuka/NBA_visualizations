"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaUserCircle, FaBasketballBall } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/useGetUser";
import { apiCall } from "@/api";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  favourite_team_name?: string | null;
  favourite_player_name?: string | null;
  favourite_player_id?: number | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetUser();

  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [playerImg, setPlayerImg] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  useEffect(() => {
    const fetchTeamLogo = async () => {
      if (!data?.favourite_team_name) return;
      setLogoLoading(true);
      try {
        const [response, status] = await apiCall(
          `/teams?search=${encodeURIComponent(data.favourite_team_name)}`,
          { method: "GET" }
        );

        if (status === 200 && Array.isArray(response) && response.length > 0) {
          const exact =
            response.find(
              (t: any) =>
                t.full_name?.toLowerCase() ===
                data.favourite_team_name!.toLowerCase()
            ) || response[0];
          setTeamLogo(exact.logo_url ?? null);
        } else {
          setTeamLogo(null);
        }
      } catch (err) {
        console.error("Failed to fetch team logo:", err);
        setTeamLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };
    fetchTeamLogo();
  }, [data]);

  useEffect(() => {
    const fetchPlayerImage = async () => {
      const name = data?.favourite_player_name?.trim();
      if (!name) return;

      setPlayerLoading(true);
      try {
        const [response, status] = await apiCall(
          `/player-image?name=${encodeURIComponent(name)}`,
          { method: "GET" }
        );

        if (status === 200 && response?.image_url) {
          setPlayerImg(response.image_url);
        } else {
          setPlayerImg(null);
        }
      } catch (err) {
        console.error("Failed to fetch player image:", err);
        setPlayerImg(null);
      } finally {
        setPlayerLoading(false);
      }
    };
    fetchPlayerImage();
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 text-white">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  if (isError || !data) return null;

  const user = data as ApiUser;

  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : user.username;

  const favoriteTeam = user.favourite_team_name ?? "—";
  const favoritePlayer = user.favourite_player_name ?? "—";

  return (
    <div className="flex flex-col items-center justify-center text-white min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 w-full max-w-3xl text-center"
      >
        <div className="flex flex-col items-center mb-8">
          <FaUserCircle className="text-yellow-400 w-24 h-24 mb-4" />
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-white/70">@{user.username}</p>
          <p className="text-white/60 text-sm mt-1">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-md shadow-md hover:bg-white/20 transition">
            <h2 className="text-yellow-400 font-semibold text-lg mb-3">
              Favorite Team
            </h2>
            <div className="flex flex-col items-center gap-3">
              {logoLoading ? (
                <div className="w-[85px] h-[85px] rounded bg-white/20 animate-pulse" />
              ) : teamLogo ? (
                <img
                  src={teamLogo}
                  alt={favoriteTeam}
                  className="w-[85px] h-[85px] object-contain"
                  loading="lazy"
                />
              ) : (
                <FaBasketballBall className="text-yellow-400 w-[85px] h-[85px]" />
              )}
              <p className="text-xl font-bold">{favoriteTeam}</p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-md shadow-md hover:bg-white/20 transition">
            <h2 className="text-yellow-400 font-semibold text-lg mb-3">
              Favorite Player
            </h2>
            <div className="flex flex-col items-center gap-3">
              {playerLoading ? (
                <div className="w-[85px] h-[85px] rounded-full bg-white/20 animate-pulse" />
              ) : playerImg ? (
                <img
                  src={playerImg}
                  alt={favoritePlayer}
                  className="w-[85px] h-[85px] object-cover rounded-full"
                  loading="lazy"
                />
              ) : (
                <FaUserCircle className="text-yellow-400 w-[85px] h-[85px]" />
              )}
              <p className="text-xl font-bold">{favoritePlayer}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold px-5 py-2 rounded-lg transition"
            onClick={() => router.push("/profile/edit")}
          >
            Edit Profile
          </button>

          <button
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
