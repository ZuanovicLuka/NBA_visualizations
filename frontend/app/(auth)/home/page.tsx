"use client";

import { useState } from "react";
import { FaBasketballBall } from "react-icons/fa";
import { motion } from "framer-motion";

export default function HomePage() {
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 text-center">
          <div className="flex justify-center mb-3">
            <FaBasketballBall className="text-yellow-400 w-10 h-10" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-6">
            What’s your NBA vibe?
          </h1>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Favorite NBA Team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <input
                type="text"
                placeholder="Favorite NBA Player"
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
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
