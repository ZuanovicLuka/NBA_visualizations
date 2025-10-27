"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/Navbar";

interface JwtPayload {
  exp?: number;
  sub?: string;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
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
      } catch {
        localStorage.removeItem("token");
        router.push("/");
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 text-white">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 relative">
      <Navbar />
      <main className="pt-32 pb-24 px-6">{children}</main>
    </div>
  );
}
