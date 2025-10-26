"use client";

import { motion } from "framer-motion";
import { FaUserCircle, FaBasketballBall } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const user = {
    name: "LeBron James",
    username: "kingjames",
    favoriteTeam: "Los Angeles Lakers",
    favoritePlayer: "Kobe Bryant",
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center text-white min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 w-full max-w-3xl text-center"
      >
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <FaUserCircle className="text-yellow-400 w-24 h-24 mb-4" />
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-white/70">@{user.username}</p>
        </div>

        {/* Favorite Team / Player */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-md shadow-md hover:bg-white/20 transition">
            <h2 className="text-yellow-400 font-semibold text-lg mb-3">
              Favorite Team
            </h2>
            <div className="flex flex-col items-center gap-3">
              <FaBasketballBall className="text-yellow-400 w-10 h-10" />
              <p className="text-xl font-bold">{user.favoriteTeam}</p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-md shadow-md hover:bg-white/20 transition">
            <h2 className="text-yellow-400 font-semibold text-lg mb-3">
              Favorite Player
            </h2>
            <div className="flex flex-col items-center gap-3">
              <FaUserCircle className="text-yellow-400 w-10 h-10" />
              <p className="text-xl font-bold">{user.favoritePlayer}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold px-5 py-2 rounded-lg transition">
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
