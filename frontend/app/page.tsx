"use client";

import Logo from "./components/Logo";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/api";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [serverErrorMessage, setServerErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/setup");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerErrorMessage("");
    setLoading(true);

    const [data, status] = await apiCall("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (status >= 400) {
      if (data?.detail) {
        setServerErrorMessage(
          Array.isArray(data.detail) ? data.detail.join(", ") : data.detail
        );
      } else {
        setServerErrorMessage("Login failed. Please try again.");
      }
      return;
    }

    if (data?.token) {
      localStorage.setItem("token", data.token);
      router.push("/setup");
    } else {
      setServerErrorMessage("No token received from server.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full md:flex min-h-screen bg-gradient-to-br from-indigo-900 via-blue-500 to-blue-300">
        <div className="flex flex-1 items-center justify-center mt-4 md:mt-0">
          <Logo />
        </div>

        <div className="flex-1 flex items-center justify-center text-center mt-14 sm:mt-10 md:mt-0">
          <div className="bg-white p-8 rounded-2xl shadow-gray-900 shadow-2xl lg:w-96">
            <h2 className="text-2xl md:text-3xl font-bold mb-5">
              Welcome back!
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Username"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    serverErrorMessage
                      ? "ring-2 ring-red-500"
                      : "focus:ring-blue-500"
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Password"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    serverErrorMessage
                      ? "ring-2 ring-red-500"
                      : "focus:ring-blue-500"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={20}
                  required
                />
              </div>

              {serverErrorMessage && (
                <div
                  style={{ color: "red" }}
                  className="text-[15px] lg:text-[16px] mb-4 font-semibold"
                >
                  {serverErrorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${
                  loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                } text-white w-full py-3 rounded-lg transition-colors`}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <div className="mt-4 flex justify-center items-center text-gray-600">
              <p className="mr-2">Don't have an account yet?</p>
              <button
                className="text-blue-500 hover:underline"
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
