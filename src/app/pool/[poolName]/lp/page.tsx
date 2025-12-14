"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRunePrice } from "@/lib/store";
import { orderBy, sumBy } from "lodash";
import Address from "@/components/transactions/Address";
import CardsHeader from "@/components/CardsHeader";
import Card from "@/components/ui/Card";
import TableLoader from "@/components/TableLoader";
import { Table, TableColumn, createCustomColumn } from "@/components/table";
import { formatNumberToString, formatPercentToString } from "@/utils/format";
import { showAsset } from "@/utils/global";
import RuneIcon from "@/assets/images/rune.svg";
import styles from "./PoolLP.module.css";
import { getLpPositions, getPoolDetail } from "@/lib/api";

import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";
import PieChart from "@/components/PieChart";

interface LpPositionData {
  position: string;
  rune_addr?: string;
  asset_addr?: string;
  rune_add: string | number;
  asset_add: string | number;
  assetClaimable: number;
  claimableRune: number;
  ownershipPercentage: number;
  last_add_height: string | number;
}

interface PieChartData {
  name: string;
  value: number;
  ownership?: number;
  color?: string; 
  vol?: number; 
}

interface PoolDetailData {
  LP_units: number;
  balance_rune: number;
  balance_asset: number;
  [key: string]: any;
}

interface LpPositionResponse {
  asset_address?: string;
  rune_address?: string;
  units: number;
  rune_deposit_value?: number;
  asset_deposit_value?: number;
  last_add_height?: number;
}

interface GeneralStatsItem {
  name: string;
  value?: string;
}

const PoolLP = () => {
  const params = useParams();
  const poolName = params?.poolName;
  const runePrice = useRunePrice();
  const theme = useTheme(); 

  const [lpPositions, setLpPositions] = useState<LpPositionResponse[]>([]);
  const [poolDetail, setPoolDetail] = useState<PoolDetailData | null>(null);
  const [rows, setRows] = useState<LpPositionData[]>([]);
  const [runePieData, setRunePieData] = useState<PieChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lpGeneralStats, setLpGeneralStats] = useState<GeneralStatsItem[]>([
    {
      name: "Total Rune Balance",
    },
    {
      name: "Total Asset Balance",
    },
  ]);

  const poolNameString = useMemo(() => {
    if (!poolName) return "";
    if (Array.isArray(poolName)) return poolName[0];
    return poolName;
  }, [poolName]);

  const columns = useMemo((): TableColumn<LpPositionData>[] => {
    const formatNumber = (num: number) => formatNumberToString(num, "0,0.0000");
    const formatBlock = (num: number) => formatNumberToString(num, "0,0");

    return [
      createCustomColumn<LpPositionData>("Position", {
        sortKey: "position",
        minWidth: 150,
        renderCell: (item: LpPositionData) => <span>{item.position}</span>,
      }),
      createCustomColumn<LpPositionData>("Rune address", {
        sortKey: "rune_addr",
        minWidth: 200,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <div>
            {item.rune_addr ? (
              <Address address={item.rune_addr} />
            ) : (
              <span>Not Assigned</span>
            )}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>("Asset address", {
        sortKey: "asset_addr",
        minWidth: 200,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <div>
            {item.asset_addr ? (
              <Address address={item.asset_addr} />
            ) : (
              <span>Not Assigned</span>
            )}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>("Asset added", {
        sortKey: "asset_add",
        minWidth: 150,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.asset_add === "Not Added"
              ? "Not Added"
              : formatNumber(item.asset_add as number)}
          </span>
        ),
      }),
      createCustomColumn<LpPositionData>("Rune added", {
        sortKey: "rune_add",
        minWidth: 150,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.rune_add === "Not Added"
              ? "Not Added"
              : `RUNE ${formatNumber(item.rune_add as number)}`}
          </span>
        ),
      }),
      createCustomColumn<LpPositionData>("Asset Claimable", {
        sortKey: "assetClaimable",
        minWidth: 150,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <span className="mono">{formatNumber(item.assetClaimable)}</span>
        ),
      }),
      createCustomColumn<LpPositionData>("Rune Claimable", {
        sortKey: "claimableRune",
        minWidth: 150,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <div className={`mono ${styles.cellContent}`}>
            <RuneIcon className={styles.runeCur} />
            {formatNumber(item.claimableRune)}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>("Ownership", {
        sortKey: "ownershipPercentage",
        minWidth: 120,
        renderCell: (item: LpPositionData) => (
          <span>{formatPercentToString(item.ownershipPercentage, 3)}</span>
        ),
      }),
      createCustomColumn<LpPositionData>("Last Height added", {
        sortKey: "last_add_height",
        minWidth: 150,
        className: "mono",
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.last_add_height === " "
              ? " "
              : formatBlock(item.last_add_height as number)}
          </span>
        ),
      }),
    ];
  }, []);

  useEffect(() => {
    if (!poolNameString) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching LP data for pool: ${poolNameString}`);

        const results = await Promise.allSettled([
          getLpPositions(poolNameString),
          getPoolDetail(poolNameString),
        ]);

        console.log("API Results:", results);

        const [lpPositionsRes, poolDetailRes] = results;

        if (lpPositionsRes.status === "rejected") {
          console.error("Failed to fetch LP positions:", lpPositionsRes.reason);
          setError(
            `Failed to fetch LP positions: ${lpPositionsRes.reason.message}`
          );
        }

        if (poolDetailRes.status === "rejected") {
          console.error("Failed to fetch pool detail:", poolDetailRes.reason);
          setError(
            `Failed to fetch pool detail: ${poolDetailRes.reason.message}`
          );
        }

        if (
          lpPositionsRes.status === "fulfilled" &&
          poolDetailRes.status === "fulfilled"
        ) {
          const lpPositionsData = lpPositionsRes.value as any;
          const poolDetailData = poolDetailRes.value as PoolDetailData;

          console.log("LP Positions Data:", lpPositionsData);
          console.log("Pool Detail Data:", poolDetailData);

          if (!lpPositionsData || !Array.isArray(lpPositionsData)) {
            setError("Invalid LP positions data format");
            console.error(
              "LP positions data is not an array:",
              lpPositionsData
            );
            return;
          }

          if (!poolDetailData) {
            setError("Invalid pool detail data format");
            console.error("Pool detail data is null:", poolDetailData);
            return;
          }

          setLpPositions(lpPositionsData);
          setPoolDetail(poolDetailData);

          const { formattedRows, pieData } = formatLPData(
            lpPositionsData,
            poolDetailData
          );
          console.log("Formatted Rows:", formattedRows);
          console.log("Pie Data:", pieData);

          setRows(formattedRows);
          setRunePieData(pieData);

          updateGeneralStats(poolDetailData);
        } else {
          setError("Failed to fetch required data");
        }
      } catch (error: any) {
        console.error("Error loading LP data:", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolNameString, runePrice]);

  const formatLPData = (
    positions: LpPositionResponse[],
    poolDetail: PoolDetailData
  ): { formattedRows: LpPositionData[]; pieData: PieChartData[] } => {
    const lpUnits = poolDetail.LP_units || 0;
    const balanceRune = poolDetail.balance_rune || 0;
    const balanceAsset = poolDetail.balance_asset || 0;

    const pieData: PieChartData[] = [];
    const formattedRows: LpPositionData[] = [];

    console.log(
      `Formatting LP Data: LP Units=${lpUnits}, Balance Rune=${balanceRune}, Balance Asset=${balanceAsset}`
    );

    positions.forEach((position, index) => {
      const userUnits = position?.units || 0;
      console.log(
        `Position ${index}: units=${userUnits}, rune_address=${position?.rune_address}, asset_address=${position?.asset_address}`
      );

      const assetClaimable =
        lpUnits > 0 ? ((userUnits / lpUnits) * balanceAsset) / 1e8 : 0;
      const claimableRune =
        lpUnits > 0 ? ((userUnits / lpUnits) * balanceRune) / 1e8 : 0;
      const ownershipPercentage = lpUnits > 0 ? userUnits / lpUnits : 0;

      const positionType = checkPositionType(position);

      formattedRows.push({
        position: positionType,
        rune_addr: position?.rune_address || undefined,
        asset_addr: position?.asset_address || undefined,
        rune_add: position?.rune_deposit_value
          ? position.rune_deposit_value / 10 ** 8
          : "Not Added",
        asset_add: position?.asset_deposit_value
          ? position.asset_deposit_value / 10 ** 8
          : "Not Added",
        last_add_height: position?.last_add_height || " ",
        assetClaimable,
        claimableRune,
        ownershipPercentage,
      });

      if (claimableRune > 0 && runePrice) {
        const address = position?.asset_address || position?.rune_address;
        const value = runePrice * claimableRune * 2;
        const color = getChartColor(
          Math.min(index, 6),
          getCurrentChartTheme(theme)
        );

        pieData.push({
          name: address || `Position ${index + 1}`,
          value: value,
          ownership: ownershipPercentage,
          color: color,
          vol: value, 
        });

        console.log(
          `Pie data for ${address}: value=${value}, ownership=${ownershipPercentage}, color=${color}`
        );
      }
    });

    const sortedPieData = orderBy(pieData, "value", "desc");
    const topPieData = sortedPieData.slice(0, 6);
    const othersValue = sumBy(sortedPieData.slice(6), "value");

    if (othersValue > 0) {
      topPieData.push({
        name: "Other positions",
        value: othersValue,
        color: getChartColor(6, getCurrentChartTheme(theme)),
        vol: othersValue,
      });
    }

    console.log("Final Pie Data:", topPieData);

    return {
      formattedRows,
      pieData: topPieData,
    };
  };

  const checkPositionType = (position: LpPositionResponse): string => {
    if (position?.asset_address && position?.rune_address) {
      return "Symmetrical";
    } else if (position?.asset_address) {
      return "Asymmetrical Asset";
    } else if (position?.rune_address) {
      return "Asymmetrical Rune";
    }
    return "Unknown";
  };

  const updateGeneralStats = (poolDetail: PoolDetailData) => {
    if (poolDetail) {
      const balanceRune = poolDetail.balance_rune || 0;
      const balanceAsset = poolDetail.balance_asset || 0;

      const stats: GeneralStatsItem[] = [
        {
          name: "Balance Rune",
          value: formatNumberToString(balanceRune / 1e8, "0a"),
        },
        {
          name: "Balance Asset",
          value: formatNumberToString(balanceAsset / 1e8, "0a"),
        },
      ];

      console.log("Updated General Stats:", stats);
      setLpGeneralStats(stats);
    }
  };

  const totalRuneFormatter = (value: any, name: string) => {
    const pool = runePieData.find((p) => p.name === name);
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

    const formattedValue = formatValue(pool.value);
    const formattedOwnership = formatPercentToString(
      pool.ownership || 0,
      3
    );

    return `
      <div class="tooltip-header">
        <span>${name}</span>
      </div>
      <div class="tooltip-body">
        <span class="tooltip-item space">
          <span class="series-name-color">
            <span class="data-color" style="background-color: ${
              pool.color || "#ccc"
            };"></span>
            <span>Value</span>
          </span>
          <span>${formattedValue}</span>
        </span>
        <span class="tooltip-item space">
          <span class="series-name-color">
            <span class="data-color" style="background-color: ${
              pool.color || "#ccc"
            };"></span>
            <span>Ownership</span>
          </span>
          <span>${formattedOwnership}</span>
        </span>
      </div>
    `;
  };

  const customTheme = {
    HeaderCell: `
      &:last-child {
        text-align: right;
      }
    `,
    Cell: `
      &:last-child {
        text-align: right;
      }
    `,
  };

  console.log("Current State:", {
    loading,
    error,
    rowsCount: rows.length,
    pieDataCount: runePieData.length,
    generalStats: lpGeneralStats,
  });

  return (
    <div>
      <CardsHeader tableGeneralStats={lpGeneralStats} />
      <div className={styles.pieChartContainer}>
        <Card
          title="Address Distribution"
          isLoading={loading}
        >
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loaderWrapper}>
                {/* می‌توانید از spinner دلخواه استفاده کنید */}
                <div>Loading chart...</div>
              </div>
            </div>
          ) : runePieData.length > 0 ? (
            <PieChart 
              pieData={runePieData} 
              formatter={totalRuneFormatter}
              height="200px"
              showLoading={false}
              showLegend={false}
            />
          ) : (
            <div className={styles.noData}>
              <p>No LP data available for this pool</p>
            </div>
          )}
        </Card>
      </div>
      <Card className={styles.tableCard}>
        {error ? (
          <div className={styles.baseContainer}>
            <span style={{ color: "red" }}>Error: {error}</span>
          </div>
        ) : (
          <div className={`${styles.baseContainer} ${styles.lpContainer}`}>
            {loading ? (
              <TableLoader cols={columns as any} rows={Array(10).fill({})} />
            ) : rows.length > 0 ? (
              <Table
                columns={columns}
                data={rows}
                loading={loading}
                onSortChange={(action, state) => {}}
                onRowSelectChange={(action, state) => {}}
                enableSort={true}
                enableSelect={false}
                customTheme={customTheme}
                className="vgt-table net-table"
              />
            ) : (
              <div className={styles.noData}>
                <p>No LP positions found for this pool</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PoolLP;