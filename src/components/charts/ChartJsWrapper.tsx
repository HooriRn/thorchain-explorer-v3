"use client";

import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  BarController,
  PieController,
  LineController,
  DoughnutController,
} from "chart.js";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import "@/styles/tooltip.css";

const createCustomTooltipFormatter = (customCallbacks?: any) => {
  return function (context: any) {
    const tooltipModel = context.tooltip;

    if (!tooltipModel.body) return "";

    const titleLines = tooltipModel.title || [];
    const bodyLines = tooltipModel.body.map((bodyItem: any) => bodyItem.lines);
    const afterBodyLines = tooltipModel.afterBody || [];

    const htmlParts: string[] = [];

    if (titleLines.length > 0) {
      htmlParts.push('<div class="tooltip-header">', titleLines[0], "</div>");
    }

    
    htmlParts.push('<div class="tooltip-body">');

    bodyLines.forEach((body: any) => {
      const parts = body.split(":");
      if (parts.length >= 2) {
        const label = parts[0].trim();
        const value = parts.slice(1).join(":").trim();

        htmlParts.push(
          '<div class="tooltip-item">',
          '<div class="tooltip-item-content">',
          '<div class="tooltip-item-header">',
          '<span class="tooltip-label">',
          label,
          "</span>",
          '<span class="tooltip-value">',
          value,
          "</span>",
          "</div>",
          "</div>",
          "</div>"
        );
      }
    });

    afterBodyLines.forEach((line: string) => {
      if (line.trim()) {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const label = parts[0].trim();
          const value = parts.slice(1).join(":").trim();

          htmlParts.push(
            '<div class="tooltip-item">',
            '<div class="tooltip-item-content">',
            '<div class="tooltip-item-header">',
            '<span class="tooltip-label">',
            label,
            "</span>",
            '<span class="tooltip-value">',
            value,
            "</span>",
            "</div>",
            "</div>",
            "</div>"
          );
        }
      }
    });

    htmlParts.push("</div>");

    return htmlParts.join("");
  };
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  BarController,
  PieController,
  LineController,
  DoughnutController
);

interface ChartJsWrapperProps {
  type: "bar" | "pie" | "line" | "doughnut";
  data: any;
  options?: any;
  height?: string;
  className?: string;
}

const ChartJsWrapper: React.FC<ChartJsWrapperProps> = ({
  type,
  data,
  options = {},
  height = "300px",
  className = "",
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const currentTheme = getCurrentChartTheme(theme);

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "var(--font-color)",
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          enabled: true,
          displayColors: false, 
          usePointStyle: false, 
          external: function (context: any) {
            let tooltipEl = document.getElementById("chartjs-tooltip");

            if (!tooltipEl) {
              tooltipEl = document.createElement("div");
              tooltipEl.id = "chartjs-tooltip";
              tooltipEl.className = "v-popper--theme-tooltip";
              document.body.appendChild(tooltipEl);
            }

            const tooltipModel = context.tooltip;
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = "0";
              return;
            }

            tooltipEl.classList.remove("above", "below", "no-transform");
            if (tooltipModel.yAlign) {
              tooltipEl.classList.add(tooltipModel.yAlign);
            } else {
              tooltipEl.classList.add("no-transform");
            }

            const customFormatter = createCustomTooltipFormatter(
              options?.plugins?.tooltip?.callbacks
            );
            tooltipEl.innerHTML = customFormatter(context);

            const colorElements = tooltipEl.querySelectorAll(
              '[style*="background"], .chartjs-tooltip-key, [class*="color"], span[style*="background"], div[style*="background"]'
            );
            colorElements.forEach((el) => {
              el.remove();
            });

            const allElements = tooltipEl.querySelectorAll("*");
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (
                htmlEl.style &&
                (htmlEl.style.backgroundColor || htmlEl.style.background)
              ) {
                el.remove();
              }
            });

            const position = context.chart.canvas.getBoundingClientRect();

            tooltipEl.style.opacity = "1";
            tooltipEl.style.position = "absolute";
            tooltipEl.style.left =
              position.left + window.pageXOffset + tooltipModel.caretX + "px";
            tooltipEl.style.top =
              position.top + window.pageYOffset + tooltipModel.caretY + "px";
            tooltipEl.style.pointerEvents = "none";
          },
          callbacks: options?.plugins?.tooltip?.callbacks || {},
        },
      },
      scales:
        type !== "pie" && type !== "doughnut"
          ? {
              x: {
                display: false,
                ticks: {
                  display: false,
                },
                grid: {
                  display: false,
                },
              },
              y: {
                display: false,
                ticks: {
                  display: false,
                },
                grid: {
                  display: false,
                },
                beginAtZero: true,
              },
            }
          : undefined,
      ...options,
    };

    chartInstanceRef.current = new ChartJS(chartRef.current, {
      type,
      data,
      options: defaultOptions,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [type, data, options, theme]);

  return (
    <div style={{ height }} className={className}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartJsWrapper;
