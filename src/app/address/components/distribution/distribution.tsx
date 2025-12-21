"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import moment from "moment";
import Card from "@/components/ui/Card";
import Table from "@/components/table/Table";
import StatsPanel from "@/components/StatsPanel";
import AssetIcon from "@/components/AssetIcon";
import RuneAsset from "@/components/RuneAsset";
import { useAppStore } from "@/lib/store";
import { getTCY, getTCYDistribution, getTCYStaker } from "@/lib/api";
import { baseAmountFormat } from "@/utils/global";
import { formatVueNumber, formatPercent } from "@/utils/format";
import { formatCurrency } from "@/utils/global";
import { TableColumn } from "@/components/table/types";
import FileDownloadIcon from "@/assets/images/file-download.svg";
import BusinessIcon from "@/assets/images/business.svg";
import styles from "./distribution.module.css";

interface DistributionData {
  id?: string;
  amount: number;
  value: number;
  date: number;
  price?: number;
}

interface DistributionProps {
  address?: string;
}

const Distribution: React.FC<DistributionProps> = ({ address = "" }) => {
  const [apr, setApr] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [distribution, setDistribution] = useState<any>(null);
  const [price, setPrice] = useState(0);
  const [showPriceInterval, setShowPriceInterval] = useState(true);

  const runePrice = useAppStore((state) => state.runePrice);
  const pools = useAppStore((state) => state.pools);

  const tcyPrice = useMemo(() => {
    if (pools && pools.length > 0) {
      const tcyPool = pools.find((pool: any) => pool.asset === "THOR.TCY");
      return tcyPool ? tcyPool.assetPriceUSD : 0;
    }
    return 0;
  }, [pools]);

  const dailyEarn = useMemo(() => {
    const totalEarn = +distribution?.total / 1e8;
    const days = distribution?.distributions?.length;

    if (+totalEarn <= 0) {
      return 0;
    }

    return totalEarn / days;
  }, [distribution]);

  const tcyAPY = useMemo(() => {
    if (showPriceInterval) {
      return apr;
    }

    if (!dailyEarn || !tcyPrice) {
      return 0;
    }

    const dailyReturn = (dailyEarn * runePrice) / (stakedAmount * tcyPrice);

    return dailyReturn * 365;
  }, [showPriceInterval, apr, dailyEarn, tcyPrice, runePrice, stakedAmount]);

  const calculateTotalValueRuneBased = useCallback(() => {
    return (distribution?.total * runePrice) / 1e8;
  }, [distribution, runePrice]);

  const calculateTotalValuePriceBased = useCallback(() => {
    if (!distribution?.distributions?.length) return 0;
    return distribution.distributions.reduce((sum: number, row: any) => {
      return sum + (row.amount * row.price) / 1e16;
    }, 0);
  }, [distribution]);

  const formatPriceTimesAmount = useCallback((row: any) => {
    const amount = Number(row.amount);
    const price = Number(row.price);
    return (amount * price) / 1e16;
  }, []);

  const formatRuneValue = useCallback(
    (amount: number) => {
      return (Number(amount) * runePrice) / 1e8;
    },
    [runePrice]
  );

  const downloadDistribution = useCallback(
    (data: any[]) => {
      if (!data || !data.length) {
        console.error("No data provided for CSV download.");
        return;
      }

      const mappedData = data.map((d) => {
        const row: any = {
          amount: d.amount / 1e8,
          date: d.date,
        };

        if (showPriceInterval) {
          row.value = (d.amount * d.price) / 1e16;
        } else {
          row.value = (d.amount * runePrice) / 1e8;
        }
        return row;
      });

      const csvContent = [
        Object.keys(mappedData[0]).join(","), 
        ...mappedData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const lastDistribution = mappedData[mappedData.length - 1]?.date
        ? moment
            .unix(mappedData[mappedData.length - 1].date)
            .format("YYYY-MM-DD")
        : "unknown";

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `distribution-${address.slice(-4)}-${lastDistribution}`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [showPriceInterval, runePrice, address]
  );

  const statsMetrics = useMemo(() => {
    return [
      {
        label: "Staked TCY",
        value: stakedAmount,
        filter: (val: number) => {
          return `${formatVueNumber(val, "0,0.00")} `;
        },
        subValue: formatCurrency(stakedAmount * tcyPrice, formatVueNumber),
        icon: <AssetIcon asset="THOR.TCY" height="1.2rem" />,
      },
      {
        label: "APR",
        value: tcyAPY,
        filter: (val: number) => formatPercent(val, 2),
      },
      {
        label: "Daily Earn (est)",
        value: dailyEarn,
        filter: (val: number) => {
          return `${formatVueNumber(val, "0,0.00000")} `;
        },
        icon: <RuneAsset asset="THOR.RUNE" height="1.2rem" />,
      },
      {
        label: "Total Earned",
        value: distribution?.total / 1e8,
        filter: (val: number) => {
          return `${formatVueNumber(val, "0,0.0000")} `;
        },
        subValue: formatCurrency(
          showPriceInterval
            ? calculateTotalValuePriceBased()
            : calculateTotalValueRuneBased(),
          formatVueNumber
        ),
        icon: <RuneAsset asset="THOR.RUNE" height="1.2rem" />,
      },
    ];
  }, [
    stakedAmount,
    tcyPrice,
    tcyAPY,
    dailyEarn,
    distribution,
    showPriceInterval,
    calculateTotalValuePriceBased,
    calculateTotalValueRuneBased,
  ]);

  const distributionsColumns: TableColumn<DistributionData>[] = useMemo(() => {
    return [
      {
        label: "Earned",
        field: "amount",
        className: styles.mono,
        renderCell: (item) => (
          <div title={`${item.amount * runePrice}`}>
            {baseAmountFormat(item.amount, formatVueNumber)}
            <RuneAsset showIcon={false} />
          </div>
        ),
      },
      {
        label: "Value",
        field: "value",
        className: styles.mono,
        renderCell: (item) => (
          <div className={styles["value-cell"]}>
            {showPriceInterval ? (
              <span>
                {formatCurrency(formatPriceTimesAmount(item), formatVueNumber)}
              </span>
            ) : (
              <span>
                {formatCurrency(formatRuneValue(item.amount), formatVueNumber)}
              </span>
            )}
          </div>
        ),
      },
      {
        label: "Date",
        field: "date",
        renderCell: (item) => (
          <span>{moment.unix(item.date).format("MM/DD/YYYY")}</span>
        ),
      },
    ];
  }, [runePrice, showPriceInterval, formatPriceTimesAmount, formatRuneValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tcyRes, , stakerRes] = await Promise.all([
          getTCY(address),
          getTCYDistribution(address),
          getTCYStaker(address),
        ]);

        setDistribution(tcyRes);
        setPrice(tcyRes.price);
        setApr(tcyRes.apr);
        setStakedAmount(stakerRes?.amount / 1e8);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (address) {
      fetchData();
    }
  }, [address]);

  return (
    <div>
      <StatsPanel metrics={statsMetrics} />
      <Card
        title="Distributions"
        extraClass={styles["distributions-card"]}
        header={
          <div className={styles["icon-group"]}>
            <BusinessIcon
              title={
                showPriceInterval
                  ? "Showing Value based on RUNE price on its interval"
                  : "Showing Value amount on the latest RUNE price"
              }
              className={`${styles.rotate} ${
                showPriceInterval ? styles.active : ""
              }`}
              onClick={() => setShowPriceInterval(!showPriceInterval)}
            />
            <div
              className={styles["csv-download"]}
              title="csv-download"
              onClick={() => downloadDistribution(distribution?.distributions)}
            >
              <FileDownloadIcon className={styles.clickable} />
            </div>
          </div>
        }
      >
        <Table
          columns={distributionsColumns}
          data={distribution?.distributions || []}
          loading={false}
          className="vgt-table net-table vgt-compact"
          enableSort={true}
          enableSelect={false}
          showLineNumbers={true}
          onSortChange={() => {}}
          onRowSelectChange={() => {}}
        />
      </Card>
    </div>
  );
};

export default Distribution;
