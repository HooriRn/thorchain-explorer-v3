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
import { formatNumberToString, formatPercentToString, formatVueNumber } from "@/utils/format";
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

  const formatNumber = (value: number | string) => {
    if (value === "Not Added") return value;
    return formatNumberToString(Number(value), "0,0.0000");
  };

  const formatBlock = (value: number) => {
    return formatNumberToString(value, "0,0");
  };

  const formatAddress = (value?: string) => {
    return value || "Not Assigned";
  };

  const runeCur = () => {
    return (
      <RuneIcon className={styles.runeCur} style={{ marginRight: "4px" }} />
    );
  };

  const columns = useMemo((): TableColumn<LpPositionData>[] => {
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
          <span className="mono">{formatNumber(item.asset_add)}</span>
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
              : <>
                  {runeCur()}
                  {formatNumber(item.rune_add)}
                </>}
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
          <div className="mono">
            {runeCur()}
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
        const results = await Promise.allSettled([
          getLpPositions(poolNameString),
          getPoolDetail(poolNameString),
        ]);

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

          if (!lpPositionsData || !Array.isArray(lpPositionsData)) {
            setError("Invalid LP positions data format");
            return;
          }

          if (!poolDetailData) {
            setError("Invalid pool detail data format");
            return;
          }

          setLpPositions(lpPositionsData);
          setPoolDetail(poolDetailData);

          formatLP(lpPositionsData, poolDetailData);
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

  const checkPositionType = (position: LpPositionResponse): string => {
    let pos = "";
    if (position?.asset_address) {
      pos = "Asymmetrical Asset";
    }
    if (position?.rune_address) {
      pos = "Asymmetrical Rune";
    }
    if (position?.asset_address && position?.rune_address) {
      pos = "Symmetrical";
    }
    return pos;
  };

  const formatLP = (positions: LpPositionResponse[], poolDetail: PoolDetailData) => {
    const lpUnits = poolDetail.LP_units || 0;
    const balanceRune = poolDetail.balance_rune || 0;
    const balanceAsset = poolDetail.balance_asset || 0;

    const runeData: PieChartData[] = [];
    const formattedRows: LpPositionData[] = [];

    positions.forEach((position, index) => {
      const userUnits = position?.units || 0;

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

        runeData.push({
          name: address || `Position ${index + 1}`,
          value: value,
          ownership: ownershipPercentage,
          color: color,
          vol: value,
        });
      }
    });

    const sortedRows = orderBy(formattedRows, "ownershipPercentage", "desc");
    setRows(sortedRows);

    createRunePieData(runeData);
  };

  const createRunePieData = (runeData: PieChartData[]) => {
    const topRuneData = orderBy(runeData, "ownership", "desc").slice(0, 10);
    const othersValue = sumBy(runeData.slice(10), "value");

    const finalPieData = [
      ...topRuneData,
      {
        name: "Others",
        value: othersValue,
        color: getChartColor(6, getCurrentChartTheme(theme)),
      },
    ];

    setRunePieData(finalPieData);
  };

  const updateGeneralStats = (poolDetail: PoolDetailData) => {
    if (poolDetail) {
      const balanceRune = poolDetail.balance_rune || 0;
      const balanceAsset = poolDetail.balance_asset || 0;

      const stats: GeneralStatsItem[] = [
        {
          name: "Balance Rune",
          value: formatVueNumber(balanceRune / 1e8, "0a"),
        },
        {
          name: "Balance Asset",
          value: formatNumberToString(balanceAsset / 1e8, "0a"),
        },
      ];

      setLpGeneralStats(stats);
    }
  };

  const totalRuneFormatter = (param: any) => {
    const formatNumber = (value: number) => {
      return formatNumberToString(value, {
        decimalScale: 2,
        notation: "compact",
      });
    };

    return `
      <div class="tooltip-header">
        <div class="data-color" style="background-color: ${param.color || "#ccc"}"></div>
        ${param.name || "Unknown"}
      </div>
      <div class="tooltip-body">
        <span>
          <span>Value</span>
          <b>$${formatNumber(param.value)}</b>
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

  const tableProps = {
    columns,
    data: rows,
    loading,
    enableSort: true,
    enableSelect: false,
    customTheme,
    className: "vgt-table net-table",
    onSortChange: (action: any, state: any) => {
    },
    onRowSelectChange: (action: any, state: any) => {
    },
  };

  return (
    <div>
      <CardsHeader tableGeneralStats={lpGeneralStats} />
      <div className={styles.pieChartContainer}>
        <Card
          title="Address Distribution"
          isLoading={!runePieData || runePieData.length === 0}
        >
          {runePieData && runePieData.length > 0 ? (
            <PieChart 
              pieData={runePieData} 
              formatter={totalRuneFormatter}
              height="200px"
              showLoading={false}
              showLegend={false}
              extra={{
                center: ["50%", "50%"],
                label: {
                  show: true,
                  position: "outside",
                  formatter: function (params: any) {
                    const name = params.name;                    
                  },
                  fontSize: 12,
                  color: theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
                },
                labelLine: {
                  show: true,
                  length: 15,
                  length2: 10,
                  lineStyle: {
                    color: theme === "dark" || theme === "BlueElectra" ? "#999999" : "#cccccc",
                    width: 1,
                  },
                },
              }}
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
            <span>Can't fetch the pool LPs</span>
          </div>
        ) : (
          <div className={`${styles.baseContainer} ${styles.lpContainer}`}>
            {loading ? (
              <TableLoader cols={columns as any} rows={Array(10).fill({})} />
            ) : rows.length > 0 ? (
              <Table {...tableProps} />
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