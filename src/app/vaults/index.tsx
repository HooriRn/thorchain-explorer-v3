"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import { useAppStore } from "@/lib/store";
import {
  getAsgard,
  getNodes,
  getPools,
  getTSSMetrics,
  getChainsHeight,
} from "@/lib/api";
import { addressFormatV2, gotoAddr } from "@/utils/global";
import {
  formatNumber,
  formatUSDValue,
  formatPercent,
  formatUSDValueWithTrend,
  numberWithTrend,
  formatTrendPercentage,
} from "@/utils/format";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import SummaryCard from "@/components/SummaryCard";
import Address from "@/components/transactions/Address";
import Copy from "@/components/Copy";
import ColorHash from "@/components/ColorHash";
import styles from "./vaults.module.css";
import { Badge } from "@/components/ui/badge";

import { Table, TableColumn, TableData } from "@/components/table";
import {
  createAddressColumn,
  createStatusColumn,
  createNumericColumn,
  createDateColumn,
  createCustomColumn,
  createCustomSortFn,
} from "@/components/table/utils";

interface VaultData {
  id: string;
  hash: string;
  type: string;
  status: string;
  ins: number;
  bond: number;
  total_value: number;
  membership_count: number;
  membership: any[];
  vb: number;
  outs: number;
  height: number;
  since: number;
  age: number;
  pubKey: string;
  avgTSS: number;
}

interface VaultsGeneralStats {
  name: string;
  value?: string;
}

const VaultsPage: React.FC = () => {
  const router = useRouter();
  const { runePrice, chainsHeight } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [asgard, setAsgard] = useState<VaultData[]>([]);
  const [vaultsGeneralStats, setVaultsGeneralStats] = useState<
    VaultsGeneralStats[]
  >([
    { name: "Bond" },
    { name: "Balance" },
    { name: "Balance/Bond" },
    { name: "Ins/Outs" },
  ]);

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: auto auto auto auto auto auto auto auto auto auto auto auto;
    `,
  };

  const getRowProps = (item: TableData) => {
    const vaultItem = item as VaultData;
    const baseProps = {
      className: styles.vaultRow,
    };

    if (vaultItem.status === "Active") {
      return {
        ...baseProps,
        className: `${styles.vaultRow} ${styles.activeRow}`,
      };
    } else if (vaultItem.status === "Retiring") {
      return {
        ...baseProps,
        className: `${styles.vaultRow} ${styles.retiringRow}`,
      };
    }

    return baseProps;
  };

  useEffect(() => {
    fetchVaultsData();
  }, []);

  useEffect(() => {
    if (asgard && asgard.length > 0) {
      updateGeneralStats(asgard);
    }
  }, [asgard, runePrice]);

  const fetchVaultsData = async () => {
    try {
      const [asgardRes, poolsPrice, nodes, tss] = await Promise.all([
        getAsgard(),
        formatPoolPrice(),
        formatNodes(),
        formatTSS(),
      ]);

      const formattedAsgard = await formatVaults(
        asgardRes,
        "Asgard",
        poolsPrice,
        nodes,
        tss
      );

      setAsgard(formattedAsgard);
      updateGeneralStats(formattedAsgard);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const duration = (since: number) => {
    return moment.duration(since * 6, "seconds").humanize();
  };

  const updateGeneralStats = (asgardData: VaultData[]) => {
    const activeAsgard = asgardData.filter((a) => a.status === "Active");

    const totalBond = activeAsgard.reduce(
      (total, o) => total + o.bond * runePrice,
      0
    );
    const totalValue = activeAsgard.reduce(
      (total, o) => total + o.total_value * runePrice,
      0
    );
    const valuePerBond = totalValue / totalBond;

    const totalIns = activeAsgard.reduce((total, o) => total + (o.ins ?? 0), 0);
    const totalOuts = activeAsgard.reduce(
      (total, o) => total + (o.outs ?? 0),
      0
    );

    setVaultsGeneralStats([
      {
        name: "Bond",
        value: formatUSDValueWithTrend(totalBond || 0, true, { decimals: 1 }),
      },
      {
        name: "Balance",
        value: formatUSDValueWithTrend(totalValue || 0, true, { decimals: 1 }),
      },
      {
        name: "Balance/Bond",
        value: formatTrendPercentage(valuePerBond * 100, { decimals: 2 }),
      },
      {
        name: "Ins / Outs",
        value: `${numberWithTrend(totalIns, "0,0a")} / ${numberWithTrend(
          totalOuts,
          "0,0a"
        )}`,
      },
    ]);
  };

  const formatTSS = async () => {
    try {
      const res: any = await getTSSMetrics();
      if (Array.isArray(res)) return res;
      const keygen = Array.isArray(res?.keygen) ? res.keygen : [];
      const keysign = Array.isArray(res?.keysign) ? res.keysign : [];
      const combined = keygen.length ? keygen : keysign;
      return Array.isArray(combined) ? combined : [];
    } catch (error) {
      return [];
    }
  };

  const formatStatus = (status: string) => {
    if (status === "ActiveVault") {
      return "Active";
    } else if (status === "RetiringVault") {
      return "Retiring";
    }
    return status;
  };

  const formatPoolPrice = async () => {
    try {
      const pools = await getPools();
      const poolsPrice: { [key: string]: number } = {};
      pools.forEach((p: any) => {
        poolsPrice[p.asset] = p.assetPrice;
      });
      return poolsPrice;
    } catch (error) {
      return {};
    }
  };

  const formatNodes = async () => {
    try {
      const nodes = await getNodes();
      const nodesFormat: { [key: string]: any } = {};
      nodes.forEach((n: any) => {
        nodesFormat[n.pub_key_set?.secp256k1] = n;
      });
      return nodesFormat;
    } catch (error) {
      return {};
    }
  };

  const formatVaults = async (
    data: any[],
    type: string = "Yggdrasil",
    poolsPrice: { [key: string]: number } = {},
    nodes: { [key: string]: any } = {},
    tss: any = undefined
  ): Promise<VaultData[]> => {
    const vaults: VaultData[] = [];

    for (const vault of data) {
      let bond = vault?.bond / 1e8;
      let totalValue =
        +vault?.total_value < 100 ? 0.1 : vault?.total_value / 1e8;
      let vb;

      if (type === "Asgard" && poolsPrice) {
        totalValue = 0;
        vault.coins?.forEach((a: any) => {
          totalValue += (+(poolsPrice[a.asset] || 0) * +a.amount) / 1e8;
        });
        bond = 0;
        vault.membership?.forEach((m: any) => {
          bond += nodes[m]?.total_bond / 1e8 || 0;
        });
        vb = totalValue / bond;
      }

      let height = chainsHeight?.THOR || 0;
      if (!height) {
        try {
          const heightRes = await getChainsHeight();
          const thorHeight = heightRes?.find(
            (chain: any) => chain.chain === "THOR"
          );
          height = thorHeight?.height || 0;
        } catch (error) {
          height = 0;
        }
      }

      let avgTSS;
      if (Array.isArray(tss)) {
        const tssEntry = tss.find(
          (t: any) =>
            t?.pub_key === vault?.pub_key || t?.pubkey === vault?.pub_key
        );
        let times: number[] | undefined;
        if (Array.isArray(tssEntry?.node_tss_times)) {
          times = tssEntry.node_tss_times
            .map((n: any) => n?.tss_time ?? n?.tssTime ?? n?.time)
            .filter((v: any) => typeof v === "number");
        } else if (Array.isArray(tssEntry?.node_tss_times_ms)) {
          times = tssEntry.node_tss_times_ms.filter(
            (v: any) => typeof v === "number"
          );
        }

        if (times && times.length > 0) {
          avgTSS =
            times.reduce((a: number, c: number) => a + c, 0) / times.length;
        }
      }

      vaults.push({
        id: vault?.pub_key || Math.random().toString(),
        hash:
          vault?.addresses?.find((e: any) => e.chain === "THOR")?.address || "",
        type,
        status: formatStatus(vault?.status),
        ins: vault?.inbound_tx_count || 0,
        bond,
        total_value: totalValue,
        membership_count: vault?.membership?.length || 0,
        membership: vault?.membership?.map((v: any) => nodes[v]),
        vb: vb || 0,
        outs: vault?.outbound_tx_count || 0,
        height: vault?.block_height || 0,
        since: vault?.status_since || 0,
        age: height && vault?.block_height ? height - vault.block_height : 0,
        pubKey: vault?.pub_key,
        avgTSS: avgTSS || 0,
      });
    }

    return vaults;
  };

  const runeCur = () => "ᚱ";

  const curFormat = (number: number) => {
    return formatUSDValue(number);
  };

  const numberFormat = (number: number) => {
    return formatNumber(number);
  };

  const handleAddressClick = (hash: string) => {
    gotoAddr(router, hash);
  };

  const columns = useMemo(
    (): TableColumn<VaultData>[] => [
      createCustomColumn<VaultData>("Hash", {
        minWidth: 260,
        sortKey: "pubKey",
        renderCell: (item: VaultData) => (
          <div className={styles.hashCell}>
            <span
              className={`mono ${styles.clickable}`}
              title={`Full Hash: ${item.pubKey}`}
              onClick={() => handleAddressClick(item.hash)}
            >
              {addressFormatV2(item.pubKey)}
            </span>
            <ColorHash
              name={item.pubKey}
              size={12}
              className={styles.colorHash}
            />
            <Copy strCopy={item.pubKey} size="small" hideToast={false} />
          </div>
        ),
      }),
      createCustomColumn<VaultData>("Status", {
        minWidth: 80,
        sortKey: "status",
        renderCell: (item: VaultData) => (
          <div className={styles.statusCell}>
            <Badge
              variant={
                item.status === "Active"
                  ? "green"
                  : item.status === "Retiring"
                  ? "yellow"
                  : "gray"
              }
              className={`${styles.statusBadge} ${
                item.status === "Active" ? styles.activeBadge : ""
              }`}
            >
              {item.status}
            </Badge>
            {item.status === "Active" && (
              <div className={styles.statusIndicator} title="Active Vault" />
            )}
          </div>
        ),
      }),
      createNumericColumn<VaultData>("Height", "height", {
        minWidth: 50,
        formatFn: (value) => numberFormat(value),
        showTooltip: true,
      }),
      createCustomColumn<VaultData>("Bond", {
        minWidth: 50,
        sortKey: "bond",
        renderCell: (item: VaultData) =>
          item.bond ? (
            <div className={styles.numericCell}>
              <span
                className={`mono ${styles.right}`}
                title={`Bond Value: ${curFormat(runePrice * item.bond)}`}
              >
                <span className={styles.currency}>{runeCur()}</span>
                {numberFormat(item.bond)}
              </span>
            </div>
          ) : (
            <span className={styles.emptyValue}>-</span>
          ),
      }),
      createCustomColumn<VaultData>("Balance", {
        minWidth: 120,
        sortKey: "total_value",
        renderCell: (item: VaultData) =>
          item.total_value ? (
            <div className={styles.numericCell}>
              <span
                className={`mono ${styles.right}`}
                title={`Balance Value: ${curFormat(
                  runePrice * item.total_value
                )}`}
              >
                <span className={styles.currency}>{runeCur()}</span>
                {numberFormat(item.total_value)}
              </span>
            </div>
          ) : (
            <span className={styles.emptyValue}>-</span>
          ),
      }),
      createCustomColumn<VaultData>("Value/Bond", {
        minWidth: 100,
        sortKey: "vb",
        renderCell: (item: VaultData) => (
          <div className={styles.ratioCell}>
            {item.vb ? (
              <span
                className={`${styles.ratio} ${
                  item.vb > 1 ? styles.positive : styles.negative
                }`}
                title={`Ratio: ${item.vb.toFixed(4)}`}
              >
                {formatPercent(item.vb)}
              </span>
            ) : (
              <span className={styles.emptyValue}>-</span>
            )}
          </div>
        ),
      }),
      createCustomColumn<VaultData>("Node Members", {
        minWidth: 120,
        sortKey: "membership_count",
        renderCell: (item: VaultData) =>
          item.membership_count ? (
            <div className={styles.membershipCell}>
              <span
                className="mono"
                style={{ color: "var(--primary)" }}
                title={`Node Members: ${item.membership
                  ?.map((node: any) => `.${node.node_address?.slice(-4)}`)
                  .join(", ")}`}
              >
                {item.membership_count}
              </span>
              <div className={styles.membershipIndicator}>
                {item.membership_count > 0 && (
                  <div className={styles.memberDot} />
                )}
              </div>
            </div>
          ) : (
            <span className={styles.emptyValue}>-</span>
          ),
      }),
      createNumericColumn<VaultData>("Ins", "ins", {
        minWidth: 80,
        formatFn: (value) => numberFormat(value),
        showTooltip: true,
      }),
      createNumericColumn<VaultData>("Outs", "outs", {
        minWidth: 80,
        formatFn: (value) => numberFormat(value),
        showTooltip: true,
      }),
      createNumericColumn<VaultData>("Status Since", "since", {
        minWidth: 100,
        formatFn: (value) => numberFormat(value),
        showTooltip: true,
      }),
      createDateColumn<VaultData>("Age", "age", {
        minWidth: 100,
        formatFn: (value) => duration(value),
      }),
      createCustomColumn<VaultData>("AVG TSS", {
        minWidth: 100,
        sortKey: "avgTSS",
        renderCell: (item: VaultData) => (
          <div className={styles.tssCell}>
            <span
              className="mono"
              title={`Average TSS Time: ${
                item.avgTSS ? (item.avgTSS / 1e3).toFixed(2) : "N/A"
              } seconds`}
            >
              {item.avgTSS
                ? `${formatNumber(item.avgTSS / 1e3, { decimalScale: 2 })} secs`
                : "-"}
            </span>
          </div>
        ),
      }),
    ],
    [runePrice]
  );

  return (
    <PageContainer error={false} fluid={false}>
      <div className={styles.vaultsContainer}>
        <div className={styles.summaryCards}>
          {vaultsGeneralStats.map((stat, index) => (
            <div key={index} className={styles.summaryCard}>
              <h3>{stat.name}</h3>
              <div className={styles.summaryValue}>{stat.value || "-"}</div>
            </div>
          ))}
        </div>

        <Card title="Vaults">
          <Table
            columns={columns}
            data={asgard}
            loading={loading}
            onSortChange={(action, state) => {}}
            onRowSelectChange={(action, state) => {}}
            rowProps={getRowProps}
            enableSort={true}
            enableSelect={false}
            customTheme={customTheme}
            className={styles.tableContainer}
          />
        </Card>

        <div className={styles.footerStat}>
          <small>
            <sup>*</sup>
            Hover on the table elements to see more info!
          </small>
        </div>
      </div>
    </PageContainer>
  );
};

export default VaultsPage;
