"use client";

import React from "react";
import PieChart from "@/components/PieChart";
import { formatTrendNumber } from "@/utils/format";
import { useTheme } from "@/lib/store";

interface AllocationData {
  name: string;
  value: number;
}

interface TcyAllocationPieChartProps {
  allocationPie: AllocationData[];
  loading?: boolean;
}

const TcyAllocationPieChart: React.FC<TcyAllocationPieChartProps> = ({
  allocationPie,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return null;
  }

  return (
    <PieChart
      pieData={allocationPie}
      type="doughnut"
      formatter={(value: number, name: string) => {
        const total = allocationPie.reduce((sum, item) => sum + item.value, 0);
        const percentage = ((value / total) * 100).toFixed(2);
        const formattedValue =
          value >= 1e6
            ? `${(value / 1e6).toFixed(2)} Million TCY`
            : `${formatTrendNumber(value, { decimals: 2 })} TCY`;
        return `${formattedValue} (${percentage}%)`;
      }}
      height="180px"
      extra={{
        legend: {
          show: true,
          orient: "vertical",
          left: "left",
          top: "center",
          icon: "circle",
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 15,
          textStyle: {
            fontSize: 12,
            color:
              theme === "dark" || theme === "BlueElectra"
                ? "#e6e6e6"
                : "#333333",
          },
        },
        center: ["60%", "60%"],
        label: {
          show: true,
          position: "outside",
          formatter: function (params: any) {
            const value = params.value;
            const name = params.name;
            const percentage = params.percent;

            const formattedValue =
              value >= 1e6
                ? `${(value / 1e6).toFixed(2)}M TCY`
                : `${formatTrendNumber(value, { decimals: 2 })} TCY`;

            return `${name}: ${formattedValue} (${percentage.toFixed(2)}%)`;
          },
          fontSize: 12,
          color:
            theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: {
            color: "#999999",
            width: 1,
          },
        },
      }}
    />
  );
};

export default TcyAllocationPieChart;
