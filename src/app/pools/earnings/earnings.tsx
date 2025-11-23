"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import { Table, TableColumn, TableData } from "@/components/table";
import {
  createCustomColumn,
  createNumericColumn,
} from "@/components/table/utils";
import TableLoader from "@/components/TableLoader";
import AssetIcon from "@/components/AssetIcon";
import Rune from "@/assets/images/rune.svg";
import InfoIcon from "@/assets/images/info.svg";
import { ProgressIcon } from "@/components/ui/ProgressIcon";
import PooledView from "../components/PooledView";
import { useRunePrice } from "@/lib/store";
import { getPoolsHistory, getOldPoolsHistory } from "@/lib/api";
import {
  formatUnixDate,
  baseAmountFormat,
  smallBaseAmountFormat,
  percentageFormat,
  showAsset,
} from "@/utils/global";
import {
  formatVueNumber,
  formatPercentToString,
  formatTrendNumber,
  formatNumberToString,
} from "@/utils/format";
import Nav from "@/components/Nav";
import styles from "./earnings.module.css";

type PeriodKey = "day" | "Week" | "Month" | "Year";

interface PoolRow extends TableData {
  pool: string;
  asset: string;
  startTime: number;
  endTime: number;
  startAssetDepth: number;
  endAssetDepth: number;
  startRuneDepth: number;
  endRuneDepth: number;
  swapVolume: number;
  swapFees: number;
  earnings: number;
  rewards: number;
  lpDistributed: number;
  feesVolume: number;
  poolAPR: number;
  estEarnings: number;
  distributed: number;
  change: {
    endAssetDepth: number;
    endRuneDepth: number;
    earnings: number;
    swapVolume: number;
    swapFees: number;
    rewards: number;
    lpDistributed: number;
    feesReward: number;
    estEarnings: number;
    feesVolume: number;
    poolAPR: number;
    distributed: number;
  };
}

const periodOptions: { text: string; mode: PeriodKey }[] = [
  { text: "24 Hours", mode: "day" },
  { text: "1 Week", mode: "Week" },
  { text: "1 Month", mode: "Month" },
  { text: "1 Year", mode: "Year" },
];



const EarningsPage: React.FC = () => {
  const router = useRouter();
  const runePrice = useRunePrice();

  const [loading, setLoading] = useState<boolean>(false);
  const [period, setPeriod] = useState<PeriodKey>("Week");
  const [showChange, setShowChange] = useState<boolean>(true);
  const [rows, setRows] = useState<PoolRow[]>([]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_NETWORK &&
      process.env.NEXT_PUBLIC_NETWORK !== "mainnet"
    ) {
      router.push("/pools/main");
    }
  }, [router]);

  const getPPY = (p: PeriodKey) => {
    switch (p) {
      case "day":
        return 365;
      case "Month":
        return 12;
      case "Year":
        return 1;
      case "Week":
        return 52.1429;
      default:
        return 52.1429;
    }
  };

  const getChange = (newD?: number, oldD?: number) => {
    if (newD === undefined || newD === null) return 0;
    if (oldD === undefined || oldD === null) return +newD;
    return +newD - +oldD;
  };

  const loadData = async (p: PeriodKey) => {
    try {
      setLoading(true);
      const poolsData = await getPoolsHistory(p);
      const oldPoolsData = await getOldPoolsHistory(p);

      if (
        !poolsData ||
        !(poolsData as any).pools ||
        !Array.isArray((poolsData as any).pools)
      ) {
        setRows([]);
        return;
      }

      const mapped: PoolRow[] = (poolsData as any).pools
        .filter((pool: any) => pool && pool.pool) 
        .map((pool: any) => {
          const old = (oldPoolsData as any)?.pools?.find(
            (op: any) => op?.pool === pool.pool
          );

          const swapFees = pool.swapFees || 0;
          const swapVolume = pool.swapVolume || 0;
          const earnings = pool.earnings || 0;
          const rewards = pool.rewards || 0;
          const endRuneDepth = pool.endRuneDepth || 0;
          const startRuneDepth = pool.startRuneDepth || 0;

          const pe = swapFees * getPPY(p);
          const ea = endRuneDepth > 0 ? pe / (+endRuneDepth * 2) : 0;
          const oea =
            startRuneDepth > 0
              ? ((old?.swapFees || 0) * getPPY(p)) / (+startRuneDepth * 2)
              : 0;

          const lpDistributed =
            rewards !== 0 && rewards !== null && rewards !== undefined
              ? earnings / (+rewards * -1)
              : 0;
          const feesVolume = swapVolume !== 0 ? swapFees / swapVolume : 0;

          return {
            ...pool,
            pool: pool.pool || "",
            lpDistributed,
            feesVolume,
            poolAPR: ea,
            estEarnings: pe,
            distributed: +rewards * -1,
            change: {
              endAssetDepth: getChange(
                pool.endAssetDepth,
                pool.startAssetDepth
              ),
              endRuneDepth: getChange(pool.endRuneDepth, pool.startRuneDepth),
              earnings: getChange(earnings, old?.earnings),
              swapVolume: getChange(swapVolume, old?.swapVolume),
              swapFees: getChange(swapFees, old?.swapFees),
              rewards: getChange(rewards, old?.rewards),
              lpDistributed: getChange(
                lpDistributed,
                (old?.earnings || 0) / (+(old?.rewards || 0) * -1 || 1)
              ),
              feesReward: getChange(
                rewards !== 0 ? swapFees / rewards : 0,
                (old?.rewards || 0) !== 0
                  ? (old?.swapFees || 0) / (old?.rewards || 0)
                  : 0
              ),
              estEarnings: getChange(pe, (old?.swapFees || 0) * getPPY(p)),
              feesVolume: getChange(
                feesVolume,
                (old?.swapFees || 0) / (old?.swapVolume || 0 || 1)
              ),
              poolAPR: getChange(ea, oea),
              distributed: getChange(+rewards * -1, +(old?.rewards || 0) * -1),
            },
          } as PoolRow;
        });

      const sortedBySwapVolumeDesc = [...mapped].sort(
        (a, b) => (b.swapVolume || 0) - (a.swapVolume || 0)
      );
      setRows(sortedBySwapVolumeDesc);
    } catch (e) {
      console.error("Error loading pools data:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const columns: TableColumn<PoolRow>[] = useMemo(() => {
    return [
      createCustomColumn<PoolRow>("Asset", {
        minWidth: 200,
        renderCell: (item) => (
          <div className="cell-content" title={item.asset}>
            <AssetIcon asset={item.pool || ""} />
            <span>
              {item.pool && item.pool.length > 10
                ? item.pool.slice(0, 14) + "..."
                : item.pool || ""}
            </span>
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Asset Depth", {
        loaderType: "number",
        minWidth: 160,
        renderCell: (item) => (
          <div>
            {smallBaseAmountFormat(item.endAssetDepth || 0, formatVueNumber)}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.endAssetDepth || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs(item.change.endAssetDepth || 0),
                    formatVueNumber
                  )}
                />
              </span>
            )}
            <span
              className="extra-text"
              style={{ fontSize: "0.6rem", fontWeight: "bold", marginLeft: 6 }}
            >
              {showAsset(item.pool || "")}
            </span>
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Rune Depth", {
        loaderType: "number",
        renderCell: (item) => (
          <div>
            <span
              className="extra-text"
              style={{ fontSize: "0.6rem", fontWeight: "bold", marginRight: 6 }}
            >
              <Rune className={styles.runeCur} />
            </span>
            {smallBaseAmountFormat(item.endRuneDepth || 0, formatVueNumber)}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.endRuneDepth || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs(item.change.endRuneDepth || 0),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Swap Volume", {
        loaderType: "number",
        minWidth: 130,
        sortKey: "swapVolume",
        renderCell: (item) => (
          <div>
            ${""}
            {smallBaseAmountFormat(
              (+item.swapVolume || 0) * runePrice,
              formatVueNumber
            )}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={+(item.change.swapVolume || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs(+(item.change.swapVolume || 0) * runePrice),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Swap Fees", {
        loaderType: "number",
        renderCell: (item) => (
          <div>
            ${""}
            {smallBaseAmountFormat(
              (item.swapFees || 0) * runePrice,
              formatVueNumber
            )}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.swapFees || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs((item.change.swapFees || 0) * runePrice),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("LP Earnings", {
        loaderType: "number",
        renderCell: (item) => (
          <div>
            ${""}
            {smallBaseAmountFormat(
              (item.earnings || 0) * runePrice,
              formatVueNumber
            )}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.earnings || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs((item.change.earnings || 0) * runePrice),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Distributed", {
        loaderType: "number",
        headerRender: () => (
          <div
            className="table-asset end"
            title="The distributed amount to Node Operator, Burn, TCY and dev fund"
          >
            Distributed{" "}
            <InfoIcon style={{ marginLeft: 6 }} className="header-icon" />
          </div>
        ),
        renderCell: (item) => (
          <div>
            ${""}
            {smallBaseAmountFormat(
              (item.distributed || 0) * runePrice,
              formatVueNumber
            )}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.distributed || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs((item.change.distributed || 0) * runePrice),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Fees/Volume", {
        loaderType: "percentage",
        renderCell: (item) => (
          <div>
            {percentageFormat(item.feesVolume || 0, 2, formatPercentToString)}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.feesVolume || 0) < 0}
                  dataNumber={percentageFormat(
                    Math.abs(item.change.feesVolume || 0),
                    2,
                    formatPercentToString
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Est. Yr. Earnings", {
        loaderType: "number",
        minWidth: 150,
        renderCell: (item) => (
          <div>
            ${""}
            {smallBaseAmountFormat(
              (item.estEarnings || 0) * runePrice,
              formatVueNumber
            )}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.estEarnings || 0) < 0}
                  dataNumber={smallBaseAmountFormat(
                    Math.abs((item.change.estEarnings || 0) * runePrice),
                    formatVueNumber
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
      createCustomColumn<PoolRow>("Est. Yr. Return", {
        loaderType: "percentage",
        minWidth: 130,
        renderCell: (item) => (
          <div>
            {percentageFormat(item.poolAPR || 0, 2, formatPercentToString)}
            {showChange && item.change && (
              <span style={{ marginLeft: 8 }}>
                <ProgressIcon
                  isDown={(item.change.poolAPR || 0) < 0}
                  dataNumber={percentageFormat(
                    Math.abs(item.change.poolAPR || 0),
                    2,
                    formatPercentToString
                  )}
                />
              </span>
            )}
          </div>
        ),
      }),
    ];
  }, [runePrice, showChange]);

  return (
    <Page error={false} fluid={false}>
      <PooledView />
      <Nav
        activeMode={period}
        navItems={periodOptions}
        preText="Period :"
        onActiveModeChange={(mode) => setPeriod(mode as PeriodKey)}
      />
      <Card
        title="Pool Earnings"
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {rows.length > 0 && (
              <span>
                {formatUnixDate(rows[0].startTime)} -{" "}
                {formatUnixDate(rows[0].endTime)}
              </span>
            )}
            <button
              className="button-container full-screen-btn"
              onClick={() => setShowChange(!showChange)}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                background: "transparent",
                color: "inherit",
              }}
            >
              {showChange ? "Hide Changes" : "Show Changes"}
            </button>
          </div>
        }
      >
        <div className={styles["earning-box"]}>
          {loading ? (
            <TableLoader
              cols={columns.map((col) => ({
                label: col.label,
                field: col.sortKey || col.label.toLowerCase(),
                type: col.loaderType || "text",
              }))}
            />
          ) : rows.length > 0 ? (
            <Table
              columns={columns as any}
              data={rows}
              loading={false}
              enableSort
              className="vgt-table net-table"
            />
          ) : null}
        </div>
      </Card>
    </Page>
  );
};

export default EarningsPage;
