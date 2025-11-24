"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export function BubbleChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 300, bottom: 60, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chart = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxPPG = d3.max(data, (d) => d.ppg);

    const radius = d3.scaleLinear().domain([0, 100]).range([15, 45]);

    const baseMax = 50;
    const dynamicMax = maxPPG > baseMax ? Math.ceil(maxPPG / 5) * 5 : baseMax;

    const x = d3.scaleLinear().domain([-5, dynamicMax]).range([0, innerWidth]);

    const y = d3.scaleLinear().domain([-18, 100]).range([innerHeight, 0]);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("padding", "10px 12px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "6px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("font-size", "14px")
      .style("box-shadow", "0 2px 10px rgba(0,0,0,0.15)");

    const numberedData = data.map((d, i) => ({ ...d, index: i + 1 }));

    chart
      .selectAll("circle")
      .data(numberedData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.ppg))
      .attr("cy", (d) => y(d.win_pct))
      .attr("r", (d) => radius(d.fg_pct))
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.85)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br/>PPG: ${d.ppg}<br/>Win%: ${d.win_pct}%<br/>FG%: ${d.fg_pct.toFixed(1)}%`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.85);
        tooltip.style("opacity", 0);
      });

    chart
      .selectAll("text.bubble-number")
      .data(numberedData)
      .enter()
      .append("text")
      .attr("class", "bubble-number")
      .attr("x", (d) => x(d.ppg))
      .attr("y", (d) => y(d.win_pct))
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .text((d) => `${d.index}.`);

    const xAxis = d3
      .axisBottom(x)
      .tickValues(d3.range(0, dynamicMax + 1, 5))
      .tickFormat((d) => d);

    const yAxis = d3
      .axisLeft(y)
      .tickValues(d3.range(0, 101, 10))
      .tickFormat((d) => d + "%");

    chart
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .call((g) =>
        g.selectAll("text").attr("fill", "white").attr("font-size", 12)
      )
      .call((g) =>
        g.selectAll("line, path").attr("stroke", "rgba(255,255,255,0.35)")
      );

    chart
      .append("g")
      .call(yAxis)
      .call((g) =>
        g.selectAll("text").attr("fill", "white").attr("font-size", 12)
      )
      .call((g) =>
        g.selectAll("line, path").attr("stroke", "rgba(255,255,255,0.35)")
      );

    chart
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("fill", "white")
      .attr("font-size", 16)
      .attr("text-anchor", "middle")
      .text("PPG in clutch games");

    chart
      .append("text")
      .attr("transform", `translate(-45, ${innerHeight / 2}) rotate(-90)`)
      .attr("fill", "white")
      .attr("font-size", 16)
      .attr("text-anchor", "middle")
      .text("Win% in clutch games");

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right + 80}, ${margin.top})`
      );

    legend
      .selectAll("legend-item")
      .data(numberedData)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(0, ${i * 34})`)
      .each(function (d) {
        const g = d3.select(this);

        g.append("circle")
          .attr("r", 11)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("fill", d.color)
          .attr("opacity", 0.95);

        g.append("text")
          .attr("x", 22)
          .attr("y", 6)
          .style("fill", "white")
          .style("font-size", "15px")
          .style("font-weight", 600)
          .text(`${d.index}. ${d.name}`);
      });

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return (
    <div className="flex justify-center">
      <svg ref={svgRef}></svg>
    </div>
  );
}
