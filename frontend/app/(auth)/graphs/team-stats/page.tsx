"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { apiCall } from "@/api";
import { LineChart } from "lucide-react";

export default function TeamStatsPage() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const toggleDropdown = () => setOpenDropdown(!openDropdown);
  const closeDropdown = () => setOpenDropdown(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [teamA, setTeamA] = useState("Team A");
  const [teamB, setTeamB] = useState("Team B");
  const [teamAId, setTeamAId] = useState<number | null>(null);
  const [teamBId, setTeamBId] = useState<number | null>(null);

  const [teamASearch, setTeamASearch] = useState("");
  const [teamADropdown, setTeamADropdown] = useState(false);
  const [teamAResults, setTeamAResults] = useState<any[]>([]);
  const [teamALoading, setTeamALoading] = useState(false);

  const [teamBSearch, setTeamBSearch] = useState("");
  const [teamBDropdown, setTeamBDropdown] = useState(false);
  const [teamBResults, setTeamBResults] = useState<any[]>([]);
  const [teamBLoading, setTeamBLoading] = useState(false);

  const teamARef = useRef<HTMLDivElement | null>(null);
  const teamBRef = useRef<HTMLDivElement | null>(null);

  const [statistic, setStatistic] = useState("team_score");
  const [openStatisticDropdown, setOpenStatisticDropdown] = useState(false);

  const toggleStatisticDropdown = () =>
    setOpenStatisticDropdown(!openStatisticDropdown);
  const closeStatisticDropdown = () => setOpenStatisticDropdown(false);

  const STAT_LABELS: Record<string, string> = {
    assists: "Assists",
    turnovers: "Turnovers",
    team_score: "Points",
    field_goals_percentage: "Field Goal %",
    three_pointers_percentage: "3PT %",
    free_throws_percentage: "Free Throw %",
    rebounds_total: "Rebounds",
  };

  const [numGames, setNumGames] = useState(5);
  const [gamePart, setGamePart] = useState("game");
  const [showSum, setShowSum] = useState(false);

  const [teamAStats, setTeamAStats] = useState<any[]>([]);
  const [teamBStats, setTeamBStats] = useState<any[]>([]);

  const getTeamColor = (id: number | null, fallback: string) => {
    const COLORS: Record<number, string> = {
      1610612737: "#E03A3E", // Atlanta Hawks
      1610612738: "#007A33", // Boston Celtics
      1610612751: "#000000", // Brooklyn Nets
      1610612766: "#1D1160", // Charlotte Hornets
      1610612741: "#CE1141", // Chicago Bulls
      1610612739: "#6F263D", // Cleveland Cavaliers
      1610612742: "#007DC5", // Dallas Mavericks
      1610612743: "#0E2240", // Denver Nuggets
      1610612765: "#006BB6", // Detroit Pistons
      1610612744: "#FDB927", // Golden State Warriors
      1610612745: "#552583", // Houston Rockets (new brand is red but purple looks wrong—yellow alt)
      1610612754: "#002D62", // Indiana Pacers
      1610612746: "#007A33", // LA Clippers (note: officially red/blue—use red?)
      1610612747: "#552583", // Los Angeles Lakers
      1610612763: "#5D76A9", // Memphis Grizzlies
      1610612748: "#98002E", // Miami Heat
      1610612750: "#0C2340", // Minnesota Timberwolves
      1610612749: "#00471B", // Milwaukee Bucks
      1610612752: "#F58426", // New York Knicks
      1610612753: "#0C2340", // Orlando Magic
      1610612755: "#006BB6", // Philadelphia 76ers
      1610612756: "#1D1160", // Phoenix Suns
      1610612757: "#E03A3E", // Portland Trail Blazers
      1610612758: "#5A2D81", // Sacramento Kings
      1610612759: "#000000", // San Antonio Spurs
      1610612760: "#007AC1", // Oklahoma City Thunder
      1610612761: "#CE1141", // Toronto Raptors
      1610612762: "#1D428A", // Utah Jazz
      1610612764: "#002B5C", // Washington Wizards
    };

    if (id && COLORS[id]) return COLORS[id];
    return fallback;
  };

  const getCurrentValueKey = () => {
    if (statistic !== "team_score") return statistic;
    const map: Record<string, string> = {
      "1st": "q1_points",
      "2nd": "q2_points",
      "3rd": "q3_points",
      "4th": "q4_points",
      game: "team_score",
    };
    return map[gamePart];
  };

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
    if (!teamAId || !teamBId) return;

    const fetchStats = async () => {
      let finalStatistic = statistic;

      if (statistic === "team_score") {
        const map = {
          "1st": "q1_points",
          "2nd": "q2_points",
          "3rd": "q3_points",
          "4th": "q4_points",
          game: "team_score",
        };

        finalStatistic = map[gamePart];
      }

      const payload = {
        teamAId,
        teamBId,
        statistic: finalStatistic,
        numGames,
      };

      console.log("Sending payload:", payload);

      const [data, status] = await apiCall("/teams_statistics", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (status === 200 && data) {
        console.log("Backend response:", data);
        setTeamAStats(data.first_team?.stats ?? []);
        setTeamBStats(data.second_team?.stats ?? []);

        if (data.first_team?.name?.data?.[0]?.full_name) {
          setTeamA(data.first_team.name.data[0].full_name);
        }
        if (data.second_team?.name?.data?.[0]?.full_name) {
          setTeamB(data.second_team.name.data[0].full_name);
        }
      }
    };

    fetchStats();
  }, [teamAId, teamBId, statistic, numGames, gamePart, showSum]);

  useEffect(() => {
    if (!svgRef.current) return;
    if (teamAStats.length === 0 && teamBStats.length === 0) return;

    const valueKey = getCurrentValueKey();

    const prepareSeries = (arr: any[]) => {
      const sorted = [...arr].sort(
        (a, b) => (a.game_order ?? 0) - (b.game_order ?? 0)
      );
      const mapped = sorted.map((d: any, i: number) => {
        let raw = Number(d[valueKey] ?? 0);

        const isPercentage =
          statistic === "field_goals_percentage" ||
          statistic === "three_pointers_percentage" ||
          statistic === "free_throws_percentage";

        if (isPercentage) {
          raw = raw * 100;
        }

        return {
          x: d.game_order ?? i + 1,
          y: raw,
        };
      });

      if (!showSum) return mapped;

      // cumulative sum when showSum is ON
      let running = 0;
      return mapped.map((d) => {
        running += d.y;
        return { x: d.x, y: running };
      });
    };

    const seriesA = prepareSeries(teamAStats);
    const seriesB = prepareSeries(teamBStats);

    const allPoints = [...seriesA, ...seriesB];
    if (allPoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 650;
    const margin = { top: 60, right: 80, bottom: 60, left: 80 };

    const xExtent = d3.extent(allPoints, (d) => d.x) as [number, number];
    const yMax = d3.max(allPoints, (d) => d.y) ?? 1;

    const x = d3
      .scaleLinear()
      .domain([1, numGames])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const lineGen = d3
      .line<{ x: number; y: number }>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgba(30, 41, 59, 0.25)")
      .style("pointer-events", "none");

    const xAxis = d3
      .axisBottom(x)
      .ticks(numGames)
      .tickFormat((d: any) => d);
    const yAxis = d3.axisLeft(y).ticks(6);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call((g) =>
        g.selectAll("text").attr("fill", "#e5e7eb").attr("font-size", 14)
      )
      .call((g) =>
        g.selectAll("line, path").attr("stroke", "rgba(255,255,255,0.3)")
      );

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call((g) =>
        g.selectAll("text").attr("fill", "#e5e7eb").attr("font-size", 14)
      )
      .call((g) =>
        g.selectAll("line, path").attr("stroke", "rgba(255,255,255,0.3)")
      );

    svg
      .append("text")
      .attr("x", (width + margin.left - margin.right) / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .attr("font-size", 18)
      .text("Game order (last games)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height - margin.top - margin.bottom) / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .attr("font-size", 18)
      .text(
        showSum
          ? `Cumulative ${STAT_LABELS[statistic] || valueKey}`
          : STAT_LABELS[statistic] || valueKey
      );

    const colorA = getTeamColor(teamAId, "#3b82f6");
    const colorB = getTeamColor(teamBId, "#ef4444");

    const LEGEND_WIDTH = 200;
    const LEGEND_HEIGHT = 50;

    const legendX = width - LEGEND_WIDTH;
    const legendY = 0;

    const legendGroup = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    legendGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("width", LEGEND_WIDTH)
      .attr("height", LEGEND_HEIGHT)
      .attr("fill", "rgba(255,255,255,0.85)")
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 1.5);

    legendGroup
      .append("circle")
      .attr("cx", 15)
      .attr("cy", 15)
      .attr("r", 6)
      .attr("fill", colorA)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    legendGroup
      .append("text")
      .attr("x", 30)
      .attr("y", 20)
      .attr("fill", colorA)
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .text(teamA);

    legendGroup
      .append("circle")
      .attr("cx", 15)
      .attr("cy", 35)
      .attr("r", 6)
      .attr("fill", colorB)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    legendGroup
      .append("text")
      .attr("x", 30)
      .attr("y", 40)
      .attr("fill", colorB)
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .text(teamB);

    if (seriesA.length > 0) {
      svg
        .append("path")
        .datum(seriesA)
        .attr("fill", "none")
        .attr("stroke", colorA)
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineGen)
        .attr("opacity", 0)
        .transition()
        .duration(700)
        .attr("opacity", 0.9);
    }

    if (seriesB.length > 0) {
      svg
        .append("path")
        .datum(seriesB)
        .attr("fill", "none")
        .attr("stroke", colorB)
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", lineGen)
        .attr("opacity", 0)
        .transition()
        .duration(700)
        .attr("opacity", 0.9);
    }

    const tooltip = d3.select("#tooltip");
    const mapA = new Map(seriesA.map((d) => [d.x, d.y]));
    const mapB = new Map(seriesB.map((d) => [d.x, d.y]));

    function addPoints(series, color, teamKey) {
      svg
        .selectAll(`.point-${teamKey}`)
        .data(series)
        .enter()
        .append("circle")
        .attr("class", `point-${teamKey}`)
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 4)
        .attr("fill", color)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("mouseenter", function (event, d) {
          d3.select(this).transition().duration(120).attr("r", 10);

          const label = STAT_LABELS[statistic] || statistic;

          const pointX = x(d.x) - 100;
          const pointY = y(d.y) - 50;

          const svgRect = svgRef.current.getBoundingClientRect();
          const screenX = svgRect.left + pointX;
          const screenY = svgRect.top + pointY;

          const isPercentage =
            statistic === "field_goals_percentage" ||
            statistic === "three_pointers_percentage" ||
            statistic === "free_throws_percentage";

          const formattedValue = isPercentage
            ? d.y.toFixed(1) + "%"
            : Math.round(d.y);

          tooltip
            .style("opacity", 1)
            .style("left", `${screenX}px`)
            .style("top", `${screenY}px`)
            .html(`<div>${label}: ${formattedValue}</div>`);
        })
        .on("mouseleave", function () {
          d3.select(this).transition().duration(120).attr("r", 4);
          tooltip.style("opacity", 0);
        });
    }

    addPoints(seriesA, colorA, "teamA");
    addPoints(seriesB, colorB, "teamB");
  }, [
    teamAStats,
    teamBStats,
    teamA,
    teamB,
    teamAId,
    teamBId,
    statistic,
    gamePart,
    numGames,
    showSum,
  ]);

  return (
    <div className="flex justify-center pt-10 pb-20">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-7xl">
        <h1 className="text-3xl font-bold text-white mb-10 text-center flex items-center justify-center gap-3">
          <LineChart className="w-10 h-10 text-white" />
          Team Stats Trend
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
                          setTeamAId(t.id);
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
                          setTeamBId(t.id);
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
                Statistic:
              </label>

              <button
                onClick={toggleStatisticDropdown}
                className="
      w-full text-left px-4 py-2 rounded-lg text-white 
      bg-white/10 border border-white/20 
      hover:bg-white/20 transition 
      flex items-center justify-between
    "
              >
                <span>{STAT_LABELS[statistic]}</span>

                <span
                  className={`transition-transform ${
                    openStatisticDropdown ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {openStatisticDropdown && (
                <div
                  className="
        w-full mt-2
        bg-white/10 backdrop-blur-xl rounded-xl 
        border border-white/20 shadow-xl 
        overflow-hidden animate-dropdownFade
      "
                >
                  {[
                    { value: "assists", label: "Assists" },
                    { value: "turnovers", label: "Turnovers" },
                    { value: "team_score", label: "Points" },
                    { value: "field_goals_percentage", label: "Field Goal %" },
                    { value: "three_pointers_percentage", label: "3PT %" },
                    { value: "free_throws_percentage", label: "Free Throw %" },
                    { value: "rebounds_total", label: "Rebounds" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        setStatistic(opt.value);
                        closeStatisticDropdown();
                      }}
                      className="
            px-4 py-2 text-white cursor-pointer
            hover:bg-white/20 transition capitalize
          "
                    >
                      {opt.label}
                    </div>
                  ))}
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

            {statistic === "team_score" && (
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
            )}
          </div>

          <div
            id="tooltip"
            style={{
              position: "fixed",
              zIndex: 999999,
              pointerEvents: "none",
              background: "rgba(255,255,255,0.85)",
              color: "black",
              padding: "6px 10px",
              borderRadius: "6px",
              opacity: 0,
              transition: "opacity 0.15s ease",
            }}
          ></div>

          {(!teamAId || !teamBId) && (
            <div className="flex items-center justify-center w-full h-[650px] rounded-xl backdrop-blur-md border border-white/10 shadow-xl text-white text-lg font-semibold">
              Select both teams in order to see the graph...
            </div>
          )}

          {teamAId && teamBId && (
            <svg
              ref={svgRef}
              className="rounded-xl backdrop-blur-md border border-white/10 shadow-xl w-full"
              height={650}
            />
          )}
        </div>
      </div>
    </div>
  );
}
