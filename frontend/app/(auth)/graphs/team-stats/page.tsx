"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { apiCall } from "@/api";

export default function TeamStatsPage() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const toggleDropdown = () => setOpenDropdown(!openDropdown);
  const closeDropdown = () => setOpenDropdown(false);
  const svgRef = useRef(null);

  const [teamA, setTeamA] = useState("Team A");
  const [teamB, setTeamB] = useState("Team B");

  const [teamASearch, setTeamASearch] = useState("");
  const [teamADropdown, setTeamADropdown] = useState(false);
  const [teamAResults, setTeamAResults] = useState([]);
  const [teamALoading, setTeamALoading] = useState(false);

  const [teamBSearch, setTeamBSearch] = useState("");
  const [teamBDropdown, setTeamBDropdown] = useState(false);
  const [teamBResults, setTeamBResults] = useState([]);
  const [teamBLoading, setTeamBLoading] = useState(false);

  const teamARef = useRef(null);
  const teamBRef = useRef(null);

  const [numGames, setNumGames] = useState(5);
  const [gamePart, setGamePart] = useState("game");
  const [showSum, setShowSum] = useState(false);

  // static mock data
  const dataA = [10, 20, 35, 50];
  const dataB = [15, 30, 45, 60];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (teamASearch.trim().length === 0) {
      setTeamAResults([]);
      return;
    }

    const fetchTeams = async () => {
      setTeamALoading(true);
      const [data, status] = await apiCall(
        `/teams?search=${encodeURIComponent(teamASearch)}`
      );
      if (status === 200) setTeamAResults(data);
      setTeamALoading(false);
    };

    const debounce = setTimeout(fetchTeams, 300);
    return () => clearTimeout(debounce);
  }, [teamASearch]);

  useEffect(() => {
    if (teamBSearch.trim().length === 0) {
      setTeamBResults([]);
      return;
    }

    const fetchTeams = async () => {
      setTeamBLoading(true);
      const [data, status] = await apiCall(
        `/teams?search=${encodeURIComponent(teamBSearch)}`
      );
      if (status === 200) setTeamBResults(data);
      setTeamBLoading(false);
    };

    const debounce = setTimeout(fetchTeams, 300);
    return () => clearTimeout(debounce);
  }, [teamBSearch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (teamARef.current && !teamARef.current.contains(e.target)) {
        setTeamADropdown(false);
      }
      if (teamBRef.current && !teamBRef.current.contains(e.target)) {
        setTeamBDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 350;
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };

    const x = d3
      .scaleLinear()
      .domain([0, dataA.length - 1])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max([...dataA, ...dataB])])
      .range([height - margin.bottom, margin.top]);

    const lineGen = d3
      .line()
      .x((d, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);

    // Team A line
    svg
      .append("path")
      .datum(dataA)
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-width", 3)
      .attr("opacity", 0.6)
      .attr("d", lineGen);

    // Team B line
    svg
      .append("path")
      .datum(dataB)
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 3)
      .attr("d", lineGen);

    // labels
    svg
      .append("text")
      .attr("x", x(dataB.length - 1) + 10)
      .attr("y", y(dataB[dataB.length - 1]))
      .attr("fill", "#555")
      .text(teamB);

    svg
      .append("text")
      .attr("x", x(dataA.length - 1) + 10)
      .attr("y", y(dataA[dataA.length - 1]) + 15)
      .attr("fill", "#888")
      .text(teamA);
  }, [teamA, teamB, gamePart, showSum]);

  return (
    <div className="flex justify-center pt-10 pb-20">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-10 text-center">
          📈 Team Stats Trend
        </h1>

        <div className="flex flex-row gap-10">
          <div className="flex flex-col gap-6 w-80 rounded-2xl">
            <h2 className="text-2xl font-semibold text-white">Filters</h2>

            <div className="relative custom-dropdown" ref={teamARef}>
              <input
                type="text"
                placeholder="Search Team A..."
                value={teamASearch}
                onChange={(e) => {
                  setTeamASearch(e.target.value);
                  setTeamADropdown(true);
                }}
                onFocus={() => setTeamADropdown(true)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none"
              />

              {teamADropdown && (
                <div
                  className="
      absolute z-10 w-full bg-white/95 text-black rounded-lg mt-1 shadow-lg 
      max-h-48 overflow-y-auto scrollbar-yellow
      animate-dropdownFade
    "
                >
                  {teamALoading ? (
                    <div className="p-3 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : teamAResults.length > 0 ? (
                    teamAResults.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setTeamA(t.full_name);
                          setTeamASearch(t.full_name);
                          setTeamADropdown(false);
                        }}
                        className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-2"
                      >
                        <img src={t.logo_url} className="w-10 h-10" />
                        <span className="font-semibold">{t.full_name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-700">
                      No teams found...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative custom-dropdown" ref={teamBRef}>
              <input
                type="text"
                placeholder="Search Team B..."
                value={teamBSearch}
                onChange={(e) => {
                  setTeamBSearch(e.target.value);
                  setTeamBDropdown(true);
                }}
                onFocus={() => setTeamBDropdown(true)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none"
              />

              {teamBDropdown && (
                <div className="absolute z-10 w-full bg-white/95 text-black rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {teamBLoading ? (
                    <div className="p-3 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : teamBResults.length > 0 ? (
                    teamBResults.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setTeamB(t.full_name);
                          setTeamBSearch(t.full_name);
                          setTeamBDropdown(false);
                        }}
                        className="p-2 cursor-pointer hover:bg-yellow-200 flex items-center gap-2"
                      >
                        <img src={t.logo_url} className="w-10 h-10" />
                        <span className="font-semibold">{t.full_name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-700">
                      No teams found...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="custom-dropdown flex flex-col gap-2">
              <label className="text-lg font-semibold text-white">
                Number of Games:
              </label>

              <button
                onClick={toggleDropdown}
                className="
      w-full text-left px-4 py-2 rounded-lg text-white 
      bg-white/10 border border-white/20 
      hover:bg-white/20 
      transition flex items-center justify-between
    "
              >
                <span>
                  {numGames === 5 && "Last 5 games"}
                  {numGames === 10 && "Last 10 games"}
                  {numGames === 15 && "Last 15 games"}
                  {numGames === 20 && "Last 20 games"}
                  {numGames === 25 && "Last 25 games"}
                </span>

                <span
                  className={`transition-transform ${
                    openDropdown ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {openDropdown && (
                <div
                  className="
        w-full mt-2
        bg-white/10 backdrop-blur-xl rounded-xl 
        border border-white/20 shadow-xl 
        overflow-hidden animate-dropdownFade
      "
                >
                  {[
                    { value: 5, label: "Last 5 games" },
                    { value: 10, label: "Last 10 games" },
                    { value: 15, label: "Last 15 games" },
                    { value: 20, label: "Last 20 games" },
                    { value: 25, label: "Last 25 games" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setNumGames(opt.value);
                        closeDropdown();
                      }}
                      className="
            px-4 py-2 text-white cursor-pointer 
            hover:bg-white/20 transition
          "
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 text-white w-64">
              <h2 className="text-lg font-semibold">Game Part:</h2>

              <div className="flex flex-col gap-2 bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-xl">
                {[
                  { value: "1st", label: "1st Quarter" },
                  { value: "2nd", label: "2nd Quarter" },
                  { value: "3rd", label: "3rd Quarter" },
                  { value: "4th", label: "4th Quarter" },
                  { value: "game", label: "Full Game" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition 
    ${
      gamePart === opt.value
        ? "bg-white/40 font-semibold"
        : "hover:bg-white/10 font-normal"
    }`}
                  >
                    <input
                      type="radio"
                      name="part"
                      value={opt.value}
                      checked={gamePart === opt.value}
                      onChange={() => setGamePart(opt.value)}
                      className="hidden"
                    />

                    <span className="text-lg w-5 text-center">
                      {gamePart === opt.value ? "🏀" : ""}
                    </span>

                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 mt-2 text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSum}
                onChange={() => setShowSum(!showSum)}
                className="hidden"
              />

              <div
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-all
      ${showSum ? "bg-orange-600" : "bg-white/25"}`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all
        ${showSum ? "translate-x-7" : "translate-x-0"}`}
                ></div>
              </div>

              <span className="text-lg font-medium">Show sum</span>
            </label>
          </div>

          <svg
            ref={svgRef}
            width={900}
            height={600}
            className="rounded-xl bg-black/20 backdrop-blur-md border border-white/10 shadow-xl"
          />
        </div>
      </div>
    </div>
  );
}
