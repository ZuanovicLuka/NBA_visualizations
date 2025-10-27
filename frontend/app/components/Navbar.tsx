"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaHome, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-md"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <img src="/images/logo.png" alt="Logo" className="w-40 md:w-52" />

        <div className="flex gap-6">
          <Link
            href="/home"
            className="flex items-center gap-2 text-white/80 hover:text-yellow-400 transition font-medium"
          >
            <FaHome className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-lg md:text-xl">Home</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-2 text-white/80 hover:text-yellow-400 transition font-medium"
          >
            <FaUserCircle className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-lg md:text-xl">Profile</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
