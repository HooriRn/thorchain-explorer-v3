"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore, useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import styles from "./PoolsVolumeChart.module.css";
import { formatNumberToString } from "@/utils/format";
import { BounceLoader } from "react-spinners";
import PieChart from "./PieChart";

interface PoolData {
  value: number;
  name: string;
  vol: number;
  color: string;
}

interface PoolsVolumeChartProps {
  data?: any;
  loading?: boolean;
  className?: string;
}

const PoolsVolumeChart: React.FC<PoolsVolumeChartProps> = ({
  data,
  loading = false,
  className = "",
}) => {
  const [poolData, setPoolData] = useState<PoolData[]>([]);
  const [totalValuePooled, setTotalValuePooled] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const runePrice = useAppStore((state) => state.runePrice);
  const theme = useTheme();
  const appStore = useAppStore();

  useEffect(() => {
    if (!data) {
      setPoolData([]);
      setTotalValuePooled(0);
      setError(null);
      return;
    }

    if (!runePrice || runePrice <= 0) {
      return;
    }

    try {
      let pools: any[] = [];

      if (data?.processedData && Array.isArray(data.processedData)) {
        const processedDataWithRunePrice = data.processedData.map(
          (pool: any) => ({
            ...pool,
            value: pool.value * runePrice,
            vol: pool.vol * runePrice,
          })
        );

        const totalValueWithRunePrice = (data.totalValue || 0) * runePrice;

        setPoolData(processedDataWithRunePrice);
        setTotalValuePooled(totalValueWithRunePrice);
        setError(null);
        return;
      } else if (data?.rawData && Array.isArray(data.rawData)) {
        pools = data.rawData;
      } else if (data?.intervals && Array.isArray(data.intervals)) {
        pools = data.intervals.flatMap((interval: any) => interval.pools || []);
      } else if (Array.isArray(data)) {
        pools = data;
      } else if (data?.data && Array.isArray(data.data)) {
        pools = data.data;
      } else {
        console.warn("🔄 Unexpected data structure:", data);
        throw new Error("Invalid pools data structure");
      }

      if (!pools || pools.length === 0) {
        throw new Error("No pools data available");
      }

      const poolData: PoolData[] = [];
      let totalValue = 0;
      let otherPoolsVolume = 0;
      let otherValuePooled = 0;

      const sortedPools = pools.sort(
        (a: any, b: any) => (b.runeDepth || 0) - (a.runeDepth || 0)
      );

      sortedPools.forEach((pool: any, index: number) => {
        const runeDepth = (Number(pool.runeDepth) || 0) / 1e8;
        const assetDepth = (Number(pool.assetDepth) || 0) / 1e8;
        const volume24h = (Number(pool.volume24h) || 0) / 1e8;

        const assetValue = assetDepth * (Number(pool.assetPrice) || 0);
        const poolValue = (runeDepth + assetValue) * runePrice;

        const poolVolume = volume24h * runePrice;

        totalValue += poolValue;

        if (index < 6) {
          const assetName = pool.asset || `Pool-${index + 1}`;
          poolData.push({
            value: poolValue,
            name: assetName,
            vol: poolVolume,
            color: getChartColor(index, getCurrentChartTheme(theme)),
          });
        } else {
          otherPoolsVolume += poolVolume;
          otherValuePooled += poolValue;

          if (index === sortedPools.length - 1) {
            poolData.push({
              value: otherValuePooled,
              name: "Other pools",
              vol: otherPoolsVolume,
              color: getChartColor(6, getCurrentChartTheme(theme)),
            });
          }
        }
      });

      setPoolData(poolData);
      setTotalValuePooled(totalValue);
      setError(null);
    } catch (err) {
      console.error("🔄 Error processing pools data:", err);
      setError("Failed to process pools data");
    }
  }, [data, runePrice, theme]);

  const pieData = useMemo(() => {
    return poolData.map((pool) => ({
      name: pool.name,
      value: pool.value,
      vol: pool.vol,
      color: pool.color,
    }));
  }, [poolData]);

  const formatter = useCallback(
    (value: any, name: string) => {
      const pool = poolData.find((p) => p.name === name);
      if (!pool) {
        return `$${formatNumberToString(value, {
          decimalScale: 1,
          notation: "compact",
        })}`;
      }

      const formatValue = (val: number) => {
        if (val >= 1e9) {
          return `$${(val / 1e9).toFixed(1)}B`;
        } else if (val >= 1e6) {
          return `$${(val / 1e6).toFixed(1)}M`;
        } else if (val >= 1e3) {
          return `$${(val / 1e3).toFixed(1)}K`;
        } else {
          return `$${val.toFixed(0)}`;
        }
      };

      const formattedDepth = formatValue(pool.value);
      const formattedVolume = formatValue(pool.vol);

      return `
        <div class="tooltip-header">
          <span>${name}</span>
        </div>
        <div class="tooltip-body">
          <span class="tooltip-item space">
            <span class="series-name-color">
              <span class="data-color" style="background-color: ${pool.color};"></span>
              <span>Depth</span>
            </span>
            <span>${formattedDepth}</span>
          </span>
          <span class="tooltip-item space">
            <span class="series-name-color">
              <span class="data-color" style="background-color: ${pool.color};"></span>
              <span>Volume</span>
            </span>
            <span>${formattedVolume}</span>
          </span>
        </div>
      `;
    },
    [poolData]
  );

  return (
    <div className={`${styles.poolsVolumeChart} ${className}`}>
      <div className={styles.chartContainer}>
        <div className={styles.chartSection}>
          <PieChart
            pieData={pieData}
            formatter={formatter}
            height="200px"
            showLoading={loading}
            showLegend={false}
          />
        </div>

        <div className={styles.tableSection}>
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Pool Name</th>
                  <th style={{ textAlign: "center" }}>Volume</th>
                  <th style={{ textAlign: "center" }}>Depth</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {poolData.map((pool, index) => (
                  <tr key={index}>
                    <td>
                      <div className={styles.poolNameContainer}>
                        <div
                          className={styles.colorIndicator}
                          style={{ backgroundColor: pool.color }}
                        />
                        <span>{pool.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      $
                      {formatNumberToString(pool.vol, {
                        decimalScale: 1,
                        notation: "compact",
                      })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      $
                      {formatNumberToString(pool.value, {
                        decimalScale: 1,
                        notation: "compact",
                      })}
                    </td>
                  </tr>
                ))}
                <tr className={styles.tableFooter}>
                  <td colSpan={2} style={{ paddingRight: "8px" }}>
                    Total value locked in pools:
                  </td>
                  <td style={{ textAlign: "center" }}>
                    $
                    {formatNumberToString(totalValuePooled, {
                      decimalScale: 1,
                      notation: "compact",
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/pools" className={styles.viewAllButton}>
              View All
              <ArrowRightIcon className={styles.arrowIcon} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolsVolumeChart;
