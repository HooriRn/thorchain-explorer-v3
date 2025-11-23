"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import InfoCard from "@/components/InfoCard";
import PieChart from "@/components/PieChart";
import { formatRune } from "@/utils/global";
import { formatRuneToString } from "@/utils/format";
import { useTheme } from "@/lib/store";

interface AllocationsCardProps {
  networkAllocations: any;
  network: any;
}

const AllocationsCard: React.FC<AllocationsCardProps> = ({
  networkAllocations,
  network,
}) => {
  const router = useRouter();
  const theme = useTheme();

  const labelColor = useMemo(() => {
    if (theme === "dark" || theme === "BlueElectra") {
      return "#e6e6e6";
    }
    return "#333333";
  }, [theme]);

  const lineColor = useMemo(() => {
    if (theme === "dark" || theme === "BlueElectra") {
      return "#666666";
    }
    return "#999999";
  }, [theme]);

  const allocationPie = useMemo(() => {
    const circulating =
      +networkAllocations?.runeSupply -
      +network?.totalPooledRune -
      +network?.bondMetrics?.totalActiveBond -
      +network?.totalReserve -
      +networkAllocations?.totalCexs;
    const burnt = 50000000000000000 - +networkAllocations?.runeSupply;

    return [
      {
        name: "Pooled",
        value: +network?.totalPooledRune / 10 ** 8,
      },
      {
        name: "Bonded",
        value: +network?.bondMetrics?.totalActiveBond / 10 ** 8,
      },
      {
        name: "Reserve",
        value: +network?.totalReserve / 10 ** 8,
      },
      {
        name: "CEXs",
        value: networkAllocations?.totalCexs / 10 ** 8,
      },
      {
        name: "Free",
        value: circulating / 10 ** 8,
      },
      {
        name: "Burnt/Killed",
        value: burnt / 10 ** 8,
      },
    ];
  }, [networkAllocations, network]);

  const extraSeries = useMemo(
    () => ({
      center: ["55%", "50%"],
      radius: ["40%", "70%"],
      nodeClick: "link",
    }),
    []
  );

  const extra = useMemo(
    () => ({
      legend: {
        show: true,
        type: "scroll",
        orient: "vertical",
        x: "left",
        y: "top",
        icon: "circle",
        textStyle: {
          color: labelColor,
        },
      },
      tooltip: {
        formatter: (params: any) => {
          return `${params.name}: ${formatRuneToString(params.value)}`;
        },
      },
      label: {
        show: true,
        position: "outside",
        formatter: (params: any) => {
          return `{a|${params.name}: ${formatRuneToString(params.value)}}`;
        },
        distanceToLabelLine: 5,
        color: labelColor,
        fontSize: 12,
        fontFamily: "Montserrat",
        textStyle: {
          color: labelColor,
          fontSize: 12,
          fontFamily: "Montserrat",
        },
        rich: {
          a: {
            color: labelColor,
            fontSize: 12,
            fontFamily: "Montserrat",
          },
        },
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
        lineStyle: {
          color: lineColor,
          width: 1,
        },
      },
    }),
    [labelColor, lineColor]
  );

  const navigatePie = useCallback(
    (param: any) => {
      switch (param?.name) {
        case "Pooled":
          router.push("/pools");
          break;
        case "Bonded":
          router.push("/nodes");
          break;
        case "Reserve":
          router.push("/address/module-addr");
          break;
        default:
          break;
      }
    },
    [router]
  );

  return (
    <Card
      title="Allocation"
      imgSrc="/assets/images/allocations.svg"
      imgStyle={{
        width: "36px",
        height: "36px",
      }}
    >
      <PieChart
        pieData={allocationPie}
        type="doughnut"
        extraSeries={extraSeries}
        extra={extra}
        click={navigatePie}
      />
    </Card>
  );
};

export default AllocationsCard;
