"use client";

import React from "react";
import Navbar from "../components/Navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300 relative">
      <Navbar />
      <main className="pt-32 pb-24 px-6">{children}</main>
    </div>
  );
}
