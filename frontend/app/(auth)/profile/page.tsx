"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBasketballBall } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/useGetUser";
import { apiCall } from "@/api";
import { z } from "zod";

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

const profileEditSchema = z.object({
  username: z
    .string()
    .min(4, "Username must have at least 4 characters!")
    .regex(/^[a-zA-Z][a-zA-Z0-9._]*$/, "Invalid username format!"),
  email: z.string().email("Invalid email format!"),
});

export default function ProfilePage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetUser();

  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [playerImg, setPlayerImg] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
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
      } catch {
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
      } catch {
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

  const initials =
    (user.first_name?.[0] ?? user.username?.[0] ?? "").toUpperCase() +
    (user.last_name?.[0] ?? "").toUpperCase();

  const avatarColor = getColorFromName(displayName || user.username);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = () => {
    setFormData({ username: user.username, email: user.email });
    setErrors({});
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setErrors({});
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      profileEditSchema.parse(formData);
      setErrors({});
      setSaving(true);

      const [response, status] = await apiCall(`/user/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (status >= 400) {
        const backendErrors: any = {};
        if (Array.isArray(response.detail)) {
          response.detail.forEach((err: string) => {
            if (err.includes("Username")) backendErrors.username = err;
            if (err.includes("Email")) backendErrors.email = err;
          });
        } else if (typeof response.detail === "string") {
          if (response.detail.includes("Username"))
            backendErrors.username = response.detail;
          if (response.detail.includes("Email"))
            backendErrors.email = response.detail;
        }
        setErrors(backendErrors);
        setSaving(false);
        return;
      }

      if (response?.token) {
        localStorage.setItem("token", response.token);
      }

      setSaving(false);
      setEditMode(false);
      await refetch?.();
    } catch (err) {
      setSaving(false);
      if (err instanceof z.ZodError) {
        const formattedErrors = err.errors.reduce((acc: any, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(formattedErrors);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-white min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 w-full max-w-3xl text-center"
      >
        {!editMode ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg"
                style={{ backgroundColor: avatarColor }}
              >
                {initials || "?"}
              </div>

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
                    <div className="w-[85px] h-[85px] flex items-center justify-center rounded-full bg-white/20 text-yellow-400 text-4xl font-bold">
                      ?
                    </div>
                  )}
                  <p className="text-xl font-bold">{favoritePlayer}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold px-5 py-2 rounded-lg transition"
                onClick={startEdit}
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
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">Edit Profile</h2>

            <div className="flex flex-col gap-4 text-left">
              <div>
                <label className="block text-md mb-1 font-semibold text-white/80">
                  Username
                </label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg text-black focus:outline-none ${
                    errors.username
                      ? "ring-2 ring-red-700"
                      : "focus:ring-2 focus:ring-blue-400"
                  }`}
                />
                {errors.username && (
                  <p className="text-red-700 text-[16px] font-semibold mt-1">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-md mb-1 font-semibold text-white/80">
                  Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg text-black focus:outline-none ${
                    errors.email
                      ? "ring-2 ring-red-700"
                      : "focus:ring-2 focus:ring-blue-400"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-700 text-[16px] font-semibold mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button
                type="submit"
                disabled={saving}
                className={`${
                  saving ? "bg-gray-600" : "bg-green-800 hover:bg-green-700"
                } text-white font-semibold px-5 py-2 rounded-lg transition`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                className="bg-red-800 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
