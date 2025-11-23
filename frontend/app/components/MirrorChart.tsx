import { useEffect, useRef } from "react";
import * as d3 from "d3";

export function MirrorChart({ metrics, activeMetrics, player1, player2 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const visibleMetrics = metrics.filter((m) => activeMetrics.includes(m.key));

    const maxValue = d3.max(visibleMetrics.flatMap((m) => [m.p1, m.p2])) || 1;

    const width = 700;
    const height = visibleMetrics.length * 75;
    const axisX = width / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("height", height);

    const xLeft = d3.scaleLinear().domain([0, maxValue]).range([axisX, 80]);

    const xRight = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([axisX, width - 80]);

    const y = d3
      .scaleBand()
      .domain(visibleMetrics.map((m) => m.key))
      .range([20, height - 20])
      .padding(0.6);

    svg
      .append("line")
      .attr("x1", axisX)
      .attr("x2", axisX)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "white")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 2);

    visibleMetrics.forEach((m) => {
      const yPos = y(m.key)!;

      svg
        .append("text")
        .attr("x", axisX)
        .attr("y", yPos - 12)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "19px")
        .attr("font-weight", "600")
        .text(m.label);

      if (m.p1 > 0 || m.key === "games_played") {
        svg
          .append("rect")
          .attr("x", xLeft(m.p1))
          .attr("y", yPos)
          .attr("height", y.bandwidth())
          .attr("width", axisX - xLeft(m.p1))
          .attr("fill", "#2755A8");

        svg
          .append("text")
          .attr("x", xLeft(m.p1) - 8)
          .attr("y", yPos + y.bandwidth() / 1.6)
          .attr("text-anchor", "end")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .attr("font-size", "18px")
          .text(m.p1);
      } else {
        svg
          .append("text")
          .attr("x", axisX - 20)
          .attr("y", yPos + y.bandwidth() / 1.6)
          .attr("text-anchor", "end")
          .attr("fill", "white")
          .attr("font-size", "16px")
          .attr("opacity", 0.7)
          .text("N/A");
      }

      if (m.p2 > 0 || m.key === "games_played") {
        svg
          .append("rect")
          .attr("x", axisX)
          .attr("y", yPos)
          .attr("height", y.bandwidth())
          .attr("width", xRight(m.p2) - axisX)
          .attr("fill", "#facc15");

        svg
          .append("text")
          .attr("x", xRight(m.p2) + 8)
          .attr("y", yPos + y.bandwidth() / 1.6)
          .attr("text-anchor", "start")
          .attr("fill", "white")
          .attr("font-weight", "bold")
          .attr("font-size", "18px")
          .text(m.p2);
      } else {
        svg
          .append("text")
          .attr("x", axisX + 20)
          .attr("y", yPos + y.bandwidth() / 1.6)
          .attr("text-anchor", "start")
          .attr("fill", "white")
          .attr("font-size", "16px")
          .attr("opacity", 0.7)
          .text("N/A");
      }
    });
  }, [metrics, activeMetrics, player1, player2]);

  return <svg ref={svgRef} className="rounded-xl w-full" />;
}
