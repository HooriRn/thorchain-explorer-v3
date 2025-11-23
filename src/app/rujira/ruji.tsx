"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatAsset, showAsset } from "@/utils/global";
import {
  formatNumberToString,
  formatTrendCurrency,
  formatTrendNumber,
  formatUSDValue,
} from "@/utils/format";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import TableLoader from "@/components/TableLoader";
import AssetIcon from "@/components/AssetIcon";
import StatsPanel from "@/components/StatsPanel";
import { Table, TableColumn, TableData } from "@/components/table";
import {
  createAddressColumn,
  createStatusColumn,
  createNumericColumn,
  createDateColumn,
  createCustomColumn,
  createCustomSortFn,
} from "@/components/table/utils";
import { useTheme, useRunePrice } from "@/lib/store";
import styles from "./ruji.module.css";

interface StatsData {
  tvl?: number;
  tvl_usd?: number;
  compounding?: number;
  holders?: number;
}

interface PendingBalance {
  asset: string;
  amount: string;
  valueUsd: number;
}

interface RUJIStatsResponse {
  ruji: StatsData;
  pendingBalances: PendingBalance[];
}

interface StatsMetric {
  label: string;
  value: number | string | undefined;
  filter: (value: any) => string;
  link?: string;
}

const RujiPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const runePrice = useRunePrice();

  const baseAmountFormat = (value: number): string => {
    return formatNumberToString(value / 1e8, { decimalScale: 4 });
  };

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: auto auto auto;
      table-layout: fixed;
    `,
    HeaderCell: `
      text-align: right ;
      
      &:first-child {
        text-align: left ;
      }
    `,
  };

  const [rows, setRows] = useState<PendingBalance[]>([]);
  const [stats, setStats] = useState<StatsData>({});
  const [pendingRevenue, setPendingRevenue] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const columns = useMemo(
    (): TableColumn<PendingBalance>[] => [
      createCustomColumn<PendingBalance>("Asset", {
        sortKey: "asset",
        renderCell: (item: PendingBalance) => (
          <div className={styles.assetCell}>
            <AssetIcon asset={item.asset} />
            <span className={styles.assetName}>{formatAsset(item.asset)}</span>
          </div>
        ),
      }),
      createCustomColumn<PendingBalance>("Pending", {
        sortKey: "amount",
        renderCell: (item: PendingBalance) => (
          <div className={styles.numericCell}>
            <span className={`mono ${styles.right}`}>
              {baseAmountFormat(parseFloat(item.amount))}
            </span>
            <small className={styles.assetChain}>
              {showAsset(item.asset, true)}
            </small>
          </div>
        ),
      }),
      createCustomColumn<PendingBalance>("Pending (USD)", {
        sortKey: "valueUsd",
        renderCell: (item: PendingBalance) => (
          <div className={styles.numericCell}>
            <span className={`mono ${styles.right}`}>
              {formatUSDValue (item.valueUsd / 1e8)}
            </span>
          </div>
        ),
      }),
    ],
    []
  );

  const statsMetrics = useMemo(
    () => [
      {
        label: "RUJI Staked (TVL)",
        value: stats?.tvl,
        filter: (v: number) =>
          `${formatNumberToString(v / 1e8, { decimals: 2 })} RUJI`,
      },
      {
        label: "RUJI Staked (USD)",
        value: stats?.tvl_usd ? +stats.tvl_usd : 0,
        filter: (v: number) => formatUSDValue(v / 1e8),
      },
      {
        label: "Pending Revenue (USD)",
        value: pendingRevenue,
        filter: (v: number) => formatUSDValue(v / 1e8),
      },
      {
        label: "Auto Compounding",
        value: stats?.compounding,
        filter: (v: number) =>
          `${formatNumberToString(v * 100, { decimals: 2 })}%`,
      },
      {
        label: "Holders",
        value: stats?.holders,
        filter: (v: number) => formatNumberToString(v, { decimals: 0 }),
        link: "/holders?asset=x%2Fruji",
      },
    ],
    [stats, pendingRevenue]
  );


  useEffect(() => {
    const fetchRUJIStats = async () => {
      try {
        const response = await fetch("/api/ruji-stats");
        const result = await response.json();

        if (result.success && result.data) {
          const { ruji, pendingBalances } = result.data;
          setStats(ruji);
          setPendingRevenue(
            pendingBalances.reduce((acc: number, item: PendingBalance) => {
              acc += +item.valueUsd;
              return acc;
            }, 0)
          );
          setRows(pendingBalances);
        } else {
          setError(true);
        }
      } catch (e) {
        setError(true);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRUJIStats();
  }, []);

  return (
    <Page error={error} fluid={false}>
      <StatsPanel metrics={statsMetrics} />
      <Card title="RUJI Pending Revenue">
        <Table
          columns={columns}
          data={rows}
          loading={loading}
          onSortChange={(action, state) => {}}
          onRowSelectChange={(action, state) => {}}
          enableSort={true}
          enableSelect={false}
          customTheme={customTheme}
          className={styles.tableContainer}
        />
      </Card>
    </Page>
  );
};

export default RujiPage;
