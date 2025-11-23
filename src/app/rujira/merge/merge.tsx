"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import StatsPanel from "@/components/StatsPanel";
import Table from "@/components/table/Table";
import AssetIcon from "@/components/AssetIcon";
import PageContainer from "@/components/PageContainer";
import { getInfraRUJIMerge } from "@/lib/api";
import { formatVueNumber, formatPercentageRatio } from "@/utils/format";
import { formatAsset, showAsset, isMainnet } from "@/utils/global";
import styles from "./ruji-merge.module.css";

export const metadata = {
  title: "THORChain Network Explorer | Ruji Merge",
};

type MergeRow = {
  Asset: string;
  Amount: number;
  MergedPct?: number;
  Allocation?: number;
  AllocationMerged?: number;
  Shares?: number;
  Count?: number;
  Addresses?: number;
  maxSupply?: number;
  [key: string]: any;
};

const getContractAddress = (asset: string): string => {
  switch (asset) {
    case "GAIA.KUJI":
      return "thor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s3p2nzy";
    case "GAIA.WINK":
      return "thor1yw4xvtc43me9scqfr2jr2gzvcxd3a9y4eq7gaukreugw2yd2f8tsz3392y";
    case "GAIA.RKUJI":
      return "thor1yyca08xqdgvjz0psg56z67ejh9xms6l436u8y58m82npdqqhmmtqrsjrgh";
    case "GAIA.FUZN":
      return "thor1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrsw5xx2d";
    case "GAIA.LVN":
      return "thor1ltd0maxmte3xf4zshta9j5djrq9cl692ctsp9u5q0p9wss0f5lms7us4yf";
    case "GAIA.NSTK":
      return "thor1cnuw3f076wgdyahssdkd0g3nr96ckq8cwa2mh029fn5mgf2fmcmsmam5ck";
    default:
      return "";
  }
};

const normalizeAndCompute = (input: MergeRow[]): MergeRow[] => {
  const rows = input
    .filter((a) => !(a.Asset || "").includes("RUNE"))
    .map((item) => {
      const out: MergeRow = { ...item };
      out.Asset = (out.Asset || "").toUpperCase().replace("THOR.", "GAIA.");
      switch (out.Asset) {
        case "GAIA.KUJI":
          out.maxSupply = 112349807;
          out.Allocation = 41840000;
          break;
        case "GAIA.WINK":
          out.maxSupply = 69000000;
          out.Allocation = 1430000;
          break;
        case "GAIA.RKUJI":
          out.maxSupply = 10000000;
          out.Allocation = 3720000;
          break;
        case "GAIA.FUZN":
          out.maxSupply = 171740000;
          out.Allocation = 1560000;
          break;
        case "GAIA.LVN":
          out.maxSupply = 695260000;
          out.Allocation = 5000000;
          break;
        case "GAIA.NSTK":
          out.maxSupply = 65000000;
          out.Allocation = 1440000;
          break;
        default:
          break;
      }
      if (out.maxSupply && typeof out.Amount === "number") {
        const mergedUnits = out.Amount / 1e8;
        out.MergedPct = mergedUnits / out.maxSupply;
      } else {
        out.MergedPct = 0;
      }
      if (
        typeof out.MergedPct === "number" &&
        typeof out.Allocation === "number"
      ) {
        out.AllocationMerged = out.MergedPct * out.Allocation;
      }
      return out;
    });
  return rows;
};

const MergePage: React.FC = () => {
  const [rows, setRows] = useState<MergeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getInfraRUJIMerge();
        if (!active) return;
        const processed = normalizeAndCompute(data || []);
        setRows(processed);
      } catch (e) {
        console.error(e);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const acc = {
      mergedRUJI: 0,
      totalWallets: 0,
      totalAllocation: 0,
      totalTxs: 0,
    };
    if (!rows || rows.length === 0) return acc;
    for (const item of rows) {
      acc.mergedRUJI += item.AllocationMerged || 0;
      acc.totalWallets += item.Addresses || 0;
      acc.totalAllocation += item.Allocation || 0;
      acc.totalTxs += item.Count || 0;
    }
    return acc;
  }, [rows]);

  const statsMetrics = useMemo(() => {
    const formatMerge = (val: number) => {
      let formatted = formatVueNumber(val || 0, "0,0.00a");
      if (totals.totalAllocation > 0) {
        formatted += ` / ${formatVueNumber(
          totals.totalAllocation,
          "0,0.00a"
        )} RUJI - ${formatPercentageRatio(
          (val || 0) / totals.totalAllocation,
          2
        )}`;
      }
      return formatted;
    };
    return [
      {
        label: "RUJI Merged",
        value: totals.mergedRUJI,
        filter: (v: number) => formatMerge(v),
      },
      {
        label: "Switch Txs",
        value: totals.totalTxs,
        filter: (v: number) => formatVueNumber(v, "0,0"),
      },
      {
        label: "Wallet Count",
        value: totals.totalWallets,
        filter: (v: number) => formatVueNumber(v, "0,0"),
      },
    ];
  }, [totals]);

  const columns = useMemo(() => {
    const mainnet = isMainnet();
    return [
      {
        label: "Asset",
        sortKey: "Asset",
        minWidth: 160,
        renderCell: (item: MergeRow) => (
          <div
            title={item.Asset}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <AssetIcon asset={item.Asset} />
            <span>{formatAsset(item.Asset)}</span>
          </div>
        ),
      },
      {
        label: "Merged",
        sortKey: "Amount",
        minWidth: 160,
        className: "mono",
        renderCell: (item: MergeRow) => {
          const merged = formatVueNumber((item.Amount || 0) / 1e8, "0,0.00a");
          const maxStr = formatVueNumber(item.maxSupply || 0, "0,0.00a");
          return (
            <div>
              {merged} / {maxStr}
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {showAsset(item.Asset, true) || ""}
              </div>
            </div>
          );
        },
      },
      {
        label: "% Merged",
        sortKey: "MergedPct",
        minWidth: 120,
        className: "mono",
        renderCell: (item: MergeRow) =>
          formatPercentageRatio(item.MergedPct || 0, 2),
      },
      {
        label: "Allocation",
        sortKey: "Allocation",
        minWidth: 160,
        className: "mono",
        renderCell: (item: MergeRow) => (
          <div>
            {formatVueNumber(item.Allocation || 0, "0,0.00a")}
            <div style={{ fontSize: 12, opacity: 0.8 }}>RUJI</div>
          </div>
        ),
      },
      {
        label: "Allocation Merged",
        sortKey: "AllocationMerged",
        minWidth: 180,
        className: "mono",
        renderCell: (item: MergeRow) => {
          const mergedAllocation =
            typeof item.Shares === "number"
              ? formatVueNumber(item.Shares / 1e8, "0,0.00a")
              : formatVueNumber(item.AllocationMerged || 0, "0,0.00a");
          return (
            <div>
              {mergedAllocation}
              <div style={{ fontSize: 12, opacity: 0.8 }}>RUJI</div>
            </div>
          );
        },
      },
      {
        label: "Tx Count",
        sortKey: "Count",
        minWidth: 120,
        className: "mono",
        renderCell: (item: MergeRow) => formatVueNumber(item.Count || 0, "0,0"),
      },
      {
        label: "Wallet Count",
        sortKey: "Addresses",
        minWidth: 140,
        className: "mono",
        renderCell: (item: MergeRow) =>
          formatVueNumber(item.Addresses || 0, "0,0"),
      },
      {
        label: "Contract",
        sortKey: "contract",
        minWidth: 140,
        hidden: !mainnet,
        className: "center",
        renderCell: (item: MergeRow) => {
          const address = getContractAddress(item.Asset);
          if (!address) return <span>-</span>;
          return (
            <Link
              className={styles.buttonContainer}
              href={`/address/${address}`}
            >
              Transactions
            </Link>
          );
        },
      },
    ];
  }, []);

  return (
    <PageContainer error={error}>
      <StatsPanel metrics={statsMetrics as any} />

      <Card title="RUJIRA Merge" imgSrc={"/assets/images/ruji-merge.svg"}>
        <Table
          columns={columns as any}
          data={rows as any}
          loading={loading}
          className="net-table"
        />
      </Card>

      <div>
        <Card>
          <span>
            Holders of{" "}
            <b style={{ color: "var(--sec-font-color)" }}>
              KUJI, rKUJI, FUZN, NSTK, WINK, and LVN
            </b>{" "}
            tokens are able to migrate and convert these tokens into RUJI on
            Rujira, the THORChain app layer.
          </span>
          <br />
          <br />
          <div className={styles.buttonMore}>
            <a
              className={styles.buttonContainer}
              href="https://rujira.network/merge/KUJI"
              target="_blank"
              rel="noreferrer"
            >
              More Info
            </a>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default MergePage;
