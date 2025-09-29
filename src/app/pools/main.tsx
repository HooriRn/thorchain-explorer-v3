"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { shuffle, capitalize } from "lodash";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import Nav from "@/components/Nav";
import TableLoader from "@/components/TableLoader";
import AssetIcon from "@/components/AssetIcon";
import RuneAsset from "@/components/RuneAsset";
import {
  Table,
  TableColumn,
  TableData as TableDataType,
} from "@/components/table";
import {
  createAddressColumn,
  createStatusColumn,
  createNumericColumn,
  createDateColumn,
  createCustomColumn,
  createCustomSortFn,
} from "@/components/table/utils";
import { tradeToAsset } from "@/utils";
import { showAsset } from "@/utils/global";
import { formatNumberToString, formatPercentToString } from "@/utils/format";
import { useAppStore } from "@/lib/store";
import PooledView from "./components/PooledView";
import styles from "./main.module.css";

interface PoolData {
  status: string;
  price: number;
  depth: number;
  apy: number;
  volume: number;
  vd: number;
  asset: string;
  saversDepth: number;
  depthToUnitsRatio: number;
  earning24hr: number;
  estEarnings: number;
  collateral: number;
  assetDepth: number;
  balances: number;
  trading: number;
  polShare?: number;
}

interface TableData {
  data: PoolData[];
  mode: string;
}

const PoolsMain: React.FC = () => {
  const router = useRouter();
  const runePrice = useAppStore((state) => state.runePrice);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [tableMode, setTableMode] = useState("active");
  const [pools, setPools] = useState<PoolData[]>([]);
  const [runePoolData, setRunePoolData] = useState<{ data: any[] } | null>(
    null
  );
  const [poolsHistory, setPoolsHistory] = useState<any>(null);

  const periods = [
    { text: "1 Hour", mode: "1h" },
    { text: "24 Hours", mode: "24h" },
    { text: "7 Days", mode: "7d" },
    { text: "1 Month", mode: "30d" },
    { text: "3 Month", mode: "90d" },
    { text: "100 Days", mode: "100d" },
    { text: "6 Months", mode: "180d" },
    { text: "1 Year", mode: "365d" },
    { text: "All", mode: "all" },
  ];

  const tableModeItems = [
    { text: "Active Pools", mode: "active" },
    { text: "Staged Pools", mode: "staged" },
  ];

  const formatAsset = (asset: string) => {
    return showAsset(asset, false);
  };

  const formattedPrice = (number: number) => {
    return "$" + formatNumberToString(number, "0.00a");
  };

  const curFormat = (number: number) => {
    return "$" + formatNumberToString(number, "0,0.00");
  };

  const percentageFormat = (value: number, decimals: number = 0) => {
    return formatPercentToString(value);
  };

  const normalNumberFormat = (number: number, filter: string) => {
    return number ? formatNumberToString(+number, "0,0.00") : "-";
  };

  const numberFormat = (number: number, filter: string) => {
    return formatNumberToString(number, "0.00a");
  };

  const columns: TableColumn[] = [
    createCustomColumn<PoolData>("Asset", {
      sortKey: "asset",
      renderCell: (item: PoolData) => (
        <div className={styles["assetCell"]}>
          <AssetIcon asset={item.asset} />
          <span className={styles["clickable"]}>{formatAsset(item.asset)}</span>
        </div>
      ),
    }),
    createCustomColumn<PoolData>("USD Price", {
      sortKey: "price",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          <span className={styles["mono"]}>{curFormat(item.price)}</span>
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Volume 24H", {
      sortKey: "volume",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          <span className={styles["mono"]}>{formattedPrice(item.volume)}</span>
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Depth", {
      sortKey: "depth",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          <span className={styles["mono"]}>{formattedPrice(item.depth)}</span>
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Balances", {
      sortKey: "balances",
      renderCell: (item: PoolData) => (
        <div className={styles["balancesCell"]}>
          {item.balances > 0 ? (
            <>
              <div className={styles["balanceRow"]}>
                <span className={styles["mono"]}>
                  {formatNumberToString(item.balances, "0,0.00a")}
                </span>
                <RuneAsset showIcon={false} />
              </div>
              <div className={styles["balanceRow"]}>
                <span className={styles["mono"]}>
                  {formatNumberToString(item.assetDepth, "0,0.00a")}
                </span>
                <small className={styles["assetSymbol"]}>
                  {showAsset(item.asset, true)}
                </small>
              </div>
            </>
          ) : (
            <span className={styles["emptyValue"]}>-</span>
          )}
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Trade Asset Depth", {
      sortKey: "trading",
      renderCell: (item: PoolData) => {
        return (
          <div className={styles["numericCell"]}>
            {item.trading > 0 ? (
              <span className={styles["mono"]}>
                ${formatNumberToString(item.trading, "0,0.00a")} (
                {formatPercentToString(item.trading / item.depth)})
              </span>
            ) : (
              <span className={styles["emptyValue"]}>-</span>
            )}
          </div>
        );
      },
    }),
    createCustomColumn<PoolData>("RUNEPool Share", {
      sortKey: "polShare",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          {item.polShare && item.polShare > 0 ? (
            <span className={styles["mono"]}>
              {formattedPrice(item.polShare)} (
              {percentageFormat(item.polShare / item.depth, 0)})
            </span>
          ) : (
            <span className={styles["emptyValue"]}>-</span>
          )}
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Volume/Depth", {
      sortKey: "vd",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          <span className={styles["mono"]}>{percentageFormat(item.vd)}</span>
        </div>
      ),
    }),
    createCustomColumn<PoolData>("Est. Yr. Earnings", {
      sortKey: "estEarnings",
      renderCell: (item: PoolData) => (
        <div className={styles["numericCell"]}>
          <span className={styles["mono"]}>$0</span>
        </div>
      ),
    }),
  ];

  const [tables, setTables] = useState<{ [key: string]: TableData }>({
    activeRows: {
      data: [],
      mode: "active",
    },
    standbyRows: {
      data: [],
      mode: "staged",
    },
  });

  const getDVEs = async () => {
    try {
      const response = await fetch("/api/pools-history?period=day");
      const { data: poolsDataDay } = await response.json();
      return {
        day: poolsDataDay,
      };
    } catch (error) {
      console.warn("Failed to fetch pools history:", error);
      return undefined;
    }
  };

  const getLiquidityShareByAsset = (asset: string) => {
    if (!runePoolData || !runePoolData.data || runePoolData.data.length === 0) {
      return 0;
    }

    const data = runePoolData.data;

    for (const i in data) {
      if (asset === data[i].pool) {
        return data[i].share;
      }
    }
    return 0;
  };

  const sepPools = (pools: PoolData[]) => {
    if (!pools || pools.length <= 0) {
      return;
    }

    const standbyData: PoolData[] = [];
    const activeData: PoolData[] = [];

    for (const i in pools) {
      if (pools[i].status === "available") {
        activeData.push(pools[i]);
      } else {
        standbyData.push(pools[i]);
      }
    }

    setTables({
      activeRows: {
        data: activeData,
        mode: "active",
      },
      standbyRows: {
        data: standbyData,
        mode: "staged",
      },
    });
  };

  const updatePool = async (period: string) => {
    setLoading(true);
    try {
      const [
        poolsResponse,
        pd,
        tradeAssetsResponse,
        runePoolResponse,
        statsResponse,
      ] = await Promise.all([
        fetch(`/api/pools?period=${period}`),
        getDVEs(),
        fetch("/api/trade-assets"),
        fetch("/api/rune-pools-info"),
        fetch("/api/stats"),
      ]);

      const { data } = await poolsResponse.json();
      const tradeAssetsData = await tradeAssetsResponse.json();
      const runePoolData = await runePoolResponse.json();
      const statsData = await statsResponse.json();

      if (!data || data.length === 0) {
        setPools([]);
        setTables({
          activeRows: { data: [], mode: "active" },
          standbyRows: { data: [], mode: "staged" },
        });
        setLoading(false);
        return;
      }

      setPools(data);
      setPoolsHistory(pd);
      setRunePoolData({ data: runePoolData.success ? runePoolData.data : [] });

      const tradeAssets = tradeAssetsData.success ? tradeAssetsData.data : [];
      const runePoolShares = runePoolData.success ? runePoolData.data : [];
      const currentRunePrice =
        statsData.success && statsData.data?.runePriceUSD
          ? Number.parseFloat(statsData.data.runePriceUSD)
          : runePrice || 0;

      const ps = data.map((p: any) => {
        const pe = pd?.day?.pools?.find((e: any) => e.pool === p.asset);
        const tradeAsset = tradeAssets.find(
          (e: any) => tradeToAsset(e.asset) === p.asset
        );
        const runePoolShare = runePoolShares.find(
          (e: any) => e.pool === p.asset
        );

        const volume = (+p.volume24h / 10 ** 8) * currentRunePrice;
        console.log(
          `Pool ${p.asset}: volume24h=${p.volume24h}, runePrice=${currentRunePrice}, volume=${volume}`
        );

        return {
          status: p.status,
          price: +p.assetPriceUSD,
          depth: (+p.assetDepth / 10 ** 8) * p.assetPriceUSD,
          apy: p.annualPercentageRate,
          volume: volume,
          vd: +p.volume24h / (+p.assetDepth * +p.assetPrice),
          asset: p.asset,
          saversDepth: +p.saversDepth / 10 ** 8,
          depthToUnitsRatio: p.saversDepth
            ? +p.saversDepth / +p.saversUnits
            : 0,
          earning24hr: pe ? (pe.earnings * (runePrice || 0)) / 10 ** 8 : 0,
          estEarnings: pe
            ? (pe.earnings * (runePrice || 0) * 365) / 10 ** 8
            : 0,
          collateral: +p.totalCollateral / 1e8,
          assetDepth: +p.assetDepth / 1e8,
          balances: +p.runeDepth / 1e8,
          trading: tradeAsset ? (+tradeAsset.depth / 1e8) * p.assetPriceUSD : 0,
          polShare: runePoolShare
            ? runePoolShare.share *
              ((+p.assetDepth / 10 ** 8) * p.assetPriceUSD)
            : 0,
        };
      });

      sepPools(ps);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const gotoPool = (asset: string) => {
    router.push(`/pool/${asset}`);
  };

  const getRowProps = (item: TableDataType) => ({
    onClick: () => gotoPool((item as PoolData).asset),
    style: { cursor: "pointer" },
  });

  useEffect(() => {
    updatePool(period);
  }, []);

  useEffect(() => {
    updatePool(period);
  }, [period]);

  useEffect(() => {}, [runePrice]);

  const currentTableData = useMemo(() => {
    const data = tables[tableMode === "active" ? "activeRows" : "standbyRows"];
    if (data?.data) {
      const sortedData = [...data.data].sort((a, b) => b.depth - a.depth);
      return {
        ...data,
        data: sortedData,
      };
    }
    return data;
  }, [tables, tableMode]);

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: auto auto auto auto auto auto auto auto auto;
    `,
    HeaderCell: `
      text-align: left;
    `,
    Cell: `
      text-align: right;
    `,
  };

  return (
    <Page error={null} fluid={false}>
      <PooledView />
      <div>
        <Nav
          activeMode={tableMode}
          navItems={tableModeItems}
          extraClasses={[styles["pools-type-table"]]}
          onActiveModeChange={setTableMode}
        />
      </div>
      <Card>
        {loading ? (
          <TableLoader
            cols={columns.map((col) => ({
              label: col.label,
              field: col.sortKey || "id",
            }))}
          />
        ) : (
          <div className={styles["pools-box"]}>
            {currentTableData?.data.length === 0 ? (
              <div className={styles["no-pools-message"]}>
                No Pools {capitalize(tableMode)}
              </div>
            ) : (
              <Table
                columns={columns}
                data={currentTableData?.data || []}
                loading={loading}
                onSortChange={(action, state) => {}}
                onRowSelectChange={(action, state) => {}}
                rowProps={getRowProps}
                enableSort={true}
                enableSelect={false}
                customTheme={customTheme}
                className={`${styles.tableContainer} ${styles["vgt-table"]}`}
              />
            )}
          </div>
        )}
      </Card>
    </Page>
  );
};

export default PoolsMain;
