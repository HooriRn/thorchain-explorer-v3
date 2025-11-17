"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { rcompare } from "semver";
import { orderBy, countBy } from "lodash";
import moment from "moment";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import InfoCard from "@/components/InfoCard";
import TableLoader from "@/components/TableLoader";
import Table from "@/components/table/Table";
import { fillNodeData, availableChains, blockTime } from "@/lib/utils";
import { addressFormatV2 } from "@/utils/global";
import { number, formatPercent, formatNormalNumber } from "@/utils/format";
import { useRunePrice, useChainsHeight } from "@/lib/store";
import { getNodeOverview, getNodesInfo, getAsgard, getMimir } from "@/lib/api";
import styles from "./page.module.css";

import SearchIcon from "@/assets/images/search.svg";
import CaretIcon from "@/assets/images/caret.svg";
import ActiveImage from "@/assets/images/active.svg";
import ChurnImage from "@/assets/images/churn.svg";
import WhitelistImage from "@/assets/images/whitelist.svg";
import NextChurnImage from "@/assets/images/next-churn.svg";
import CheapIcon from "@/assets/images/cheap.svg";
import OldIcon from "@/assets/images/old.svg";
import AngryIcon from "@/assets/images/angry.svg";
import VersionIcon from "@/assets/images/version.svg";
import ArrowDownSquareIcon from "@/assets/images/arrow-down-square.svg";
import HandcuffsIcon from "@/assets/images/handcuffs.svg";
import CircleUpIcon from "@/assets/images/circle-up.svg";
import WalkerIcon from "@/assets/images/walker.svg";
import HammerIcon from "@/assets/images/hammer.svg";
import { TableColumn, TableData } from "@/components/table/types";

const SkeletonItem: React.FC<{
  loading: boolean;
  children: React.ReactNode;
}> = ({ loading, children }) => {
  if (loading) {
    return (
      <div className={styles["skeleton-item"]}>
        <div className={styles["skeleton-bar"]} />
      </div>
    );
  }
  return <>{children}</>;
};

interface NodeRow extends TableData {
  address: string;
  churn: any[];
  isp: string;
  location: any;
  status: string;
  version: string;
  fee: number;
  operator: string;
  award: number;
  total_bond: number;
  slash: number;
  score: number;
  apy: number;
  vault: string;
  missing_blocks: number;
  rpcHealth: string;
  bifrostHealth: string;
  age: any;
  behind?: any;
  highlight?: any;
}

const NodesPage: React.FC = () => {
  const runePrice = useRunePrice();
  const chainsHeight = useChainsHeight();

  const [network, setNetwork] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [nodesQuery, setNodesQuery] = useState<any[] | undefined>(undefined);
  const [minBond, setMinBond] = useState<number>(30000000000000);
  const [extraNodeChurn, setExtraNodeChurn] = useState<number>(0);
  const [newNodesChurn, setNewNodesChurn] = useState<number>(2);
  const [churnInterval, setChurnInterval] = useState<number | undefined>(undefined);
  const [churnOption, setChurnOption] = useState<any | undefined>(undefined);
  const [bondMetrics, setBondMetrics] = useState<any | undefined>(undefined);
  const [mimirs, setMimirs] = useState<any | undefined>(undefined);
  const [churnHalted, setChurnHalted] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [churnProgressValue, setChurnProgressValue] = useState<number>(0);
  const [churnProgressTime, setChurnProgressTime] = useState<number>(0);
  const [totalAwards, setTotalAwards] = useState<number | undefined>(undefined);
  const [leastBondChurn, setLeastBondChurn] = useState<number>(0);
  const [retiringVaults, setRetiringVaults] = useState<string[]>([]);
  const [enteringBond, setEnteringBond] = useState<number>(0);
  const [enteringCount, setEnteringCount] = useState<number>(0);
  const [leavingBond, setLeavingBond] = useState<number>(0);
  const [leavingCount, setLeavingCount] = useState<number>(0);
  const [hides, setHides] = useState({
    isp: false,
    score: true,
    fee: false,
    age: false,
    RPC: true,
    BFR: true,
  });

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const secondIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // توابع setter باید قبل از useMemo ها تعریف شوند
  const setTheLeastBondChurn = useCallback((bond: number) => {
    setLeastBondChurn(bond);
  }, []);

  const setEntering = useCallback((bond: number, count: number) => {
    setEnteringBond(bond);
    setEnteringCount(count);
  }, []);

  const setLeaving = useCallback((bond: number, count: number) => {
    setLeavingBond(bond);
    setLeavingCount(count);
  }, []);

  const error = useMemo(() => {
    return !nodesQuery;
  }, [nodesQuery]);

  // Sorting functions
  const cSort = useCallback((x: any, y: any) => {
    return x?.code < y?.code ? -1 : x?.code > y?.code ? 1 : 0;
  }, []);

  const aSort = useCallback((x: any, y: any) => {
    return x?.number < y?.number ? -1 : x?.number > y?.number ? 1 : 0;
  }, []);

  const versionSort = useCallback((x: string, y: string) => {
    return rcompare(x, y);
  }, []);

  const highlightSort = useCallback((
    rowX: any,
    rowY: any,
    name: string
  ) => {
    const favs = JSON.parse(localStorage.getItem(name) || "[]")?.map((f: any) => f.address) || [];
    if (!favs || favs.length === 0) {
      return 0;
    }
    if (favs.includes(rowX.address)) {
      return 1;
    }
    if (favs.includes(rowY.address)) {
      return -1;
    }
    return 0;
  }, []);

  const activeCols = useMemo<TableColumn[]>(() => {
    const activeNodesList = nodesQuery?.filter((n) => n.status === "Active") || [];
    const availableChainsList = availableChains(activeNodesList);
    
    const chainColumns: TableColumn[] = Array.isArray(availableChainsList)
      ? availableChainsList.sort().map((c: string) => ({
          label: c,
          sortKey: `behind.${c}`,
          renderCell: (item: NodeRow) => (
            <span className="mono center">{item.behind?.[c] || 0}</span>
          ),
          thClass: "center no-padding",
        }))
      : [];

    const baseColumns: TableColumn[] = [
      {
        label: "Highlight",
        sortKey: "highlight",
        renderCell: (item: NodeRow) => (
          <div className="center">
            {item.churn && item.churn.length > 0 && (
              <div className={styles.churnIndicator}>
                {item.churn.map((h: any, idx: number) => (
                  <img key={idx} src={h.icon} alt={h.name} title={h.name} className={styles.churnIcon} />
                ))}
              </div>
            )}
          </div>
        ),
        thClass: "center no-padding",
      },
      {
        label: "Address",
        sortKey: "address",
        renderCell: (item: NodeRow) => (
          <span className="mono">{addressFormatV2(item.address)}</span>
        ),
      },
      {
        label: "Churn",
        sortKey: "churn",
        renderCell: (item: NodeRow) => (
          <div className={styles.churnContainer}>
            {item.churn?.map((churn, idx) => (
              <div key={idx} className={`${styles.churnItem} ${styles[churn.type] || ''}`}>
                <img src={churn.icon} alt={churn.name} className={styles.churnIcon} />
                <span>{churn.name}</span>
              </div>
            ))}
          </div>
        ),
        thClass: "center min-padding",
      },
      {
        label: "ISP",
        sortKey: "isp",
        renderCell: (item: NodeRow) => <span className="center">{item.isp}</span>,
        thClass: "center",
        hidden: hides?.isp ?? false,
      },
      {
        label: "Location",
        sortKey: "location",
        renderCell: (item: NodeRow) => <span className="center">{item.location?.name || '-'}</span>,
        thClass: "center",
      },
      {
        label: "Status",
        sortKey: "status",
        renderCell: (item: NodeRow) => <span className="center">{item.status}</span>,
        thClass: "center",
      },
      {
        label: "Version",
        sortKey: "version",
        renderCell: (item: NodeRow) => <span className="center">{item.version}</span>,
        thClass: "center",
      },
      {
        label: "Fee",
        sortKey: "fee",
        renderCell: (item: NodeRow) => <span className="mono">{formatPercent(item.fee, 2)}</span>,
        hidden: hides?.fee ?? false,
      },
      {
        label: "Operator",
        sortKey: "operator",
        renderCell: (item: NodeRow) => <span className="mono center">{item.operator}</span>,
        thClass: "center",
      },
      {
        label: "Award",
        sortKey: "award",
        renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.award)}</span>,
      },
      {
        label: "Bond",
        sortKey: "total_bond",
        renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.total_bond)}</span>,
      },
      {
        label: "Slash",
        sortKey: "slash",
        renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.slash)}</span>,
      },
      {
        label: "Score",
        sortKey: "score",
        renderCell: (item: NodeRow) => <span className="mono center">{item.score}</span>,
        thClass: "center",
        hidden: hides?.score ?? false,
      },
      {
        label: "APY",
        sortKey: "apy",
        renderCell: (item: NodeRow) => <span className="mono center">{formatPercent(item.apy, 2)}</span>,
        thClass: "center",
      },
      {
        label: "Vault",
        sortKey: "vault",
        renderCell: (item: NodeRow) => <span className="center">{item.vault}</span>,
        thClass: "center min-padding",
      },
      ...chainColumns,
      {
        label: "",
        sortKey: "missing_blocks",
        renderCell: (item: NodeRow) => <span className="mono center">{item.missing_blocks}</span>,
        thClass: "center no-padding",
      },
      {
        label: "RPC",
        sortKey: "rpcHealth",
        renderCell: (item: NodeRow) => <span className="mono center">{item.rpcHealth}</span>,
        thClass: "center no-padding",
        hidden: hides?.RPC ?? false,
      },
      {
        label: "BFR",
        sortKey: "bifrostHealth",
        renderCell: (item: NodeRow) => <span className="mono center">{item.bifrostHealth}</span>,
        thClass: "center no-padding",
        hidden: hides?.BFR ?? false,
      },
      {
        label: "Age",
        sortKey: "age",
        renderCell: (item: NodeRow) => <span className="center">{item.age?.number || 0}</span>,
        thClass: "center",
        hidden: hides?.age ?? false,
      },
    ];

    return baseColumns.filter(col => !col.hidden);
  }, [nodesQuery, hides]);

  const stbCols = useMemo<TableColumn[]>(() => {
    const activeNodesList = nodesQuery?.filter((n) => n.status === "Active") || [];
    const availableChainsList = availableChains(activeNodesList);
    
    const chainColumns: TableColumn[] = Array.isArray(availableChainsList)
      ? availableChainsList.sort().map((c: string) => ({
          label: c,
          sortKey: `behind.${c}`,
          renderCell: (item: NodeRow) => (
            <span className="mono center">{item.behind?.[c] || 0}</span>
          ),
          thClass: "center no-padding",
        }))
      : [];

    const baseColumns: TableColumn[] = [
      {
        label: "Highlight",
        sortKey: "highlight",
        renderCell: (item: NodeRow) => (
          <div className="center">
            {item.churn && item.churn.length > 0 && (
              <div className={styles.churnIndicator}>
                {item.churn.map((h: any, idx: number) => (
                  <img key={idx} src={h.icon} alt={h.name} title={h.name} className={styles.churnIcon} />
                ))}
              </div>
            )}
          </div>
        ),
        thClass: "center no-padding",
      },
      {
        label: "Address",
        sortKey: "address",
        renderCell: (item: NodeRow) => (
          <span className="mono">{addressFormatV2(item.address)}</span>
        ),
      },
      {
        label: "Churn",
        sortKey: "churn",
        renderCell: (item: NodeRow) => (
          <div className={styles.churnContainer}>
            {item.churn?.map((churn, idx) => (
              <div key={idx} className={`${styles.churnItem} ${styles[churn.type] || ''}`}>
                <img src={churn.icon} alt={churn.name} className={styles.churnIcon} />
                <span>{churn.name}</span>
              </div>
            ))}
          </div>
        ),
        thClass: "center min-padding",
      },
      {
        label: "ISP",
        sortKey: "isp",
        renderCell: (item: NodeRow) => <span className="center">{item.isp}</span>,
        thClass: "center",
        hidden: hides?.isp ?? false,
      },
      {
        label: "Location",
        sortKey: "location",
        renderCell: (item: NodeRow) => <span className="center">{item.location?.name || '-'}</span>,
        thClass: "center",
      },
      {
        label: "Status",
        sortKey: "status",
        renderCell: (item: NodeRow) => <span className="center">{item.status}</span>,
        thClass: "center",
      },
      {
        label: "Version",
        sortKey: "version",
        renderCell: (item: NodeRow) => <span className="center">{item.version}</span>,
        thClass: "center",
      },
      {
        label: "Fee",
        sortKey: "fee",
        renderCell: (item: NodeRow) => <span className="mono">{formatPercent(item.fee, 2)}</span>,
        hidden: hides?.fee ?? false,
      },
      {
        label: "Operator",
        sortKey: "operator",
        renderCell: (item: NodeRow) => <span className="mono center">{item.operator}</span>,
        thClass: "center",
      },
      {
        label: "Bond",
        sortKey: "total_bond",
        renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.total_bond)}</span>,
      },
      {
        label: "Slash",
        sortKey: "slash",
        renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.slash)}</span>,
      },
      ...chainColumns,
      {
        label: "",
        sortKey: "missing_blocks",
        renderCell: (item: NodeRow) => <span className="mono center">{item.missing_blocks}</span>,
        thClass: "center no-padding",
      },
      {
        label: "RPC",
        sortKey: "rpcHealth",
        renderCell: (item: NodeRow) => <span className="mono center">{item.rpcHealth}</span>,
        thClass: "center no-padding",
        hidden: hides?.RPC ?? false,
      },
      {
        label: "BFR",
        sortKey: "bifrostHealth",
        renderCell: (item: NodeRow) => <span className="mono center">{item.bifrostHealth}</span>,
        thClass: "center no-padding",
        hidden: hides?.BFR ?? false,
      },
      {
        label: "Age",
        sortKey: "age",
        renderCell: (item: NodeRow) => <span className="center">{item.age?.number || 0}</span>,
        thClass: "center",
        hidden: hides?.age ?? false,
      },
    ];

    return baseColumns.filter(col => !col.hidden);
  }, [nodesQuery, hides]);

  const otherCols = useMemo<TableColumn[]>(() => [
    {
      label: "Address",
      sortKey: "address",
      renderCell: (item: NodeRow) => (
        <span className="mono">{addressFormatV2(item.address)}</span>
      ),
    },
    {
      label: "ISP",
      sortKey: "isp",
      renderCell: (item: NodeRow) => <span className="center">{item.isp}</span>,
    },
    {
      label: "Location",
      sortKey: "location",
      renderCell: (item: NodeRow) => <span className="center">{item.location?.name || '-'}</span>,
    },
    {
      label: "Status",
      sortKey: "status",
      renderCell: (item: NodeRow) => <span className="center">{item.status}</span>,
      thClass: "center",
    },
    {
      label: "Version",
      sortKey: "version",
      renderCell: (item: NodeRow) => <span className="center">{item.version}</span>,
    },
    {
      label: "Fee",
      sortKey: "fee",
      renderCell: (item: NodeRow) => <span className="mono">{formatPercent(item.fee, 2)}</span>,
    },
    {
      label: "Operator",
      sortKey: "operator",
      renderCell: (item: NodeRow) => <span className="mono center">{item.operator}</span>,
      thClass: "center",
    },
    {
      label: "Bond",
      sortKey: "total_bond",
      renderCell: (item: NodeRow) => <span className="mono">{formatNormalNumber(item.total_bond)}</span>,
    },
    {
      label: "Age",
      sortKey: "age",
      renderCell: (item: NodeRow) => <span className="center">{item.age?.number || 0}</span>,
      thClass: "center",
    },
  ], []);

  const activeInfo = useMemo(() => {
    const formatRune = (value: number, format: string): string => {
      return number(value, format) + " RUNE";
    };

    const calculateHardCap = (): number => {
      if (!nodesQuery) {
        return 0;
      }
      const actNodes = nodesQuery?.filter((n) => n.status === "Active");
      if (actNodes?.length === 0) {
        return 0;
      }
      if (actNodes?.length < 2) {
        return actNodes[0].total_bond;
      }
      actNodes?.sort((a, b) => +a.total_bond - +b.total_bond);
      const lowerNodes = actNodes?.slice(0, Math.floor((actNodes.length * 2) / 3));
      return Math.floor((Number.parseInt(lowerNodes?.slice(-1)[0]?.total_bond) ?? 0) / 10 ** 8);
    };

    return [
      {
        title: "Active",
        rowStart: 1,
        colSpan: "1",
        grid: true,
        icon: ActiveImage.src,
        items: [
          {
            name: "Node",
            value: network?.activeNodeCount,
          },
          {
            name: "Bond",
            value: bondMetrics?.totalActiveBond / 10 ** 8,
            usdValue: true,
            filter: (v: number) => formatRune(v, "0,0.00a"),
          },
          {
            name: "Average",
            value: bondMetrics?.averageActiveBond / 10 ** 8,
            filter: (v: number) => formatRune(v, "0,0"),
            usdValue: true,
          },
          {
            name: "Minimum",
            value: Math.floor(bondMetrics?.minimumActiveBond / 10 ** 8),
            filter: (v: number) => formatRune(v, "0,0"),
            usdValue: true,
          },
          {
            name: "Max Effective",
            value: calculateHardCap(),
            filter: (v: number) => formatRune(v, "0,0"),
            usdValue: true,
          },
        ],
      },
    ];
  }, [network, bondMetrics, nodesQuery]);

  const standbyInfo = useMemo(() => {
    const formatRune = (value: number, format: string): string => {
      return number(value, format) + " RUNE";
    };

    return [
      {
        title: "Standby",
        rowStart: 1,
        colSpan: "1",
        grid: true,
        icon: ChurnImage.src,
        items: [
          {
            name: "Nodes",
            value: network?.standbyNodeCount,
          },
          {
            name: "Bond",
            value: bondMetrics?.totalStandbyBond / 10 ** 8,
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
          {
            name: "Average",
            value: bondMetrics?.averageStandbyBond / 10 ** 8,
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
          {
            name: "Maximum",
            value: Math.floor(bondMetrics?.maximumStandbyBond / 10 ** 8),
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
          {
            name: "Minimum",
            value: bondMetrics?.minimumStandbyBond / 10 ** 8,
            filter: (v: number) => formatRune(v, "0,0.00a"),
            usdValue: true,
          },
          {
            name: "Least Churn",
            value: leastBondChurn,
            filter: (v: number) => formatRune(v, "0,0.00a"),
            usdValue: true,
          },
        ],
      },
    ];
  }, [network, bondMetrics, leastBondChurn]);

  const churnInfo = useMemo(() => {
    const formatRune = (value: number, format: string): string => {
      return number(value, format) + " RUNE";
    };

    const averageApysCalc = (): number => {
      if (!nodesQuery || nodesQuery.length === 0) {
        return 0;
      }
      let totalApy = 0;
      for (const node of nodesQuery) {
        totalApy += +node.apy;
      }
      const totalActiveNodes = nodesQuery.filter((node) => node.status === "Active").length;
      return totalApy / totalActiveNodes;
    };

    const monthlyNodeReturn = (): number => {
      if (!totalAwards || !churnProgressValue || !network) {
        return 0;
      }
      const churnProgress = churnProgressValue;
      let churnPeriodInDays = (((churnInterval || 0) * 6) / 86400) * churnProgress;
      const thisChurnBlock = (chainsHeight?.THOR ?? 0) - +(churnOption?.height || 0);
      if (thisChurnBlock > (churnInterval || 0)) {
        churnPeriodInDays = (thisChurnBlock * 6) / 86400;
      }
      const calculatedValue = (totalAwards / network?.activeNodeCount) * (30 / churnPeriodInDays);
      return calculatedValue;
    };

    const annualNodeReturn = (): number => {
      if (!totalAwards || !nodesQuery || !churnProgressValue) {
        return 0;
      }
      const churnProgress = churnProgressValue;
      let churnPeriodInDays = (((churnInterval || 0) * 6) / 86400) * churnProgress;
      const thisChurnBlock = (chainsHeight?.THOR ?? 0) - +(churnOption?.height || 0);
      if (thisChurnBlock > (churnInterval || 0)) {
        churnPeriodInDays = (thisChurnBlock * 6) / 86400;
      }
      const annualNodes = (totalAwards / network?.activeNodeCount) * (365 / churnPeriodInDays);
      return annualNodes;
    };

    let churnValue: string | undefined;

    if (churnProgressTime > 600) {
      churnValue = blockTime(churnProgressTime, true);
    } else if (churnProgressTime) {
      churnValue = `${churnProgressTime} Block`;
    }

    if (churnProgressValue) {
      churnValue += ` | ${formatPercent(churnProgressValue, 3)}`;
    }

    if (churnHalted) {
      churnValue = "Churn Halted";
    }

    return [
      {
        title: "Current Churn",
        rowStart: 2,
        colSpan: "1",
        grid: true,
        icon: NextChurnImage.src,
        items: [
          {
            name: "Next Churn",
            value: churnValue ?? "No Churns",
            valueSlot: "churn",
          },
          {
            name: "Churn Interval",
            value: churnInterval,
            filter: (v: number) => `${churnInterval ? blockTime(v, true) : "N/A"}`,
          },
          {
            name: "Total Rewards",
            value: totalAwards ? totalAwards / 1e8 : 0,
            usdValue: true,
            filter: (v: number) => formatRune(v, "0,0a"),
          },
          {
            name: "Average APY ",
            value: averageApysCalc(),
            filter: (v: number) => `${formatPercent(v, 2)} `,
          },
          {
            name: "Monthly Node Return",
            value: monthlyNodeReturn() / 1e8,
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
          {
            name: "Annual Node Return ",
            value: annualNodeReturn() / 1e8,
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
          {
            name: "Churn Duration",
            value: churnOption ? `${churnOption.date}` : "",
          },
          {
            name: "Churn Start",
            value: churnOption ? `${churnOption.height}` : "",
            filter: (v: string) => `${number(Number(v), "0,0")}`,
          },
        ],
      },
    ];
  }, [
    churnProgressTime,
    churnProgressValue,
    churnHalted,
    churnInterval,
    totalAwards,
    churnOption,
    nodesQuery,
    network,
    chainsHeight,
  ]);

  const blockRewardInfo = useMemo(() => {
    const formatRune = (value: number, format: string): string => {
      return number(value, format) + " RUNE";
    };

    return [
      {
        title: "Next Churn",
        rowStart: 2,
        colSpan: "1",
        grid: true,
        icon: ChurnImage.src,
        items: [
          {
            name: "Leaving Count",
            value: leavingCount,
            filter: (v: number) => `${number(v, "0,0")}`,
          },
          {
            name: "Leaving Bond",
            value: leavingBond / 1e8,
            filter: (v: number) => formatRune(v, "0,0.00a"),
            usdValue: true,
          },
          {
            name: "Entering Count",
            value: enteringCount,
            filter: (v: number) => `${number(v, "0,0")}`,
          },
          {
            name: "Entering Bond",
            value: enteringBond / 1e8,
            filter: (v: number) => formatRune(v, "0,0.00a"),
            usdValue: true,
          },
          {
            name: "Bond Difference",
            value: (enteringBond - leavingBond) / 1e8,
            filter: (v: number) => formatRune(v, "0,0a"),
            usdValue: true,
          },
        ],
      },
    ];
  }, [leavingCount, leavingBond, enteringCount, enteringBond]);

  const activeNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }

    let actNodes = nodesQuery.filter((e) => e.status === "Active");
    actNodes = orderBy(actNodes, [(o) => +o.slash_points]);
    const filteredNodes: NodeRow[] = [];

    let lowestBond: number | null = null;
    let highestSlash = 0;
    let oldest = chainsHeight?.THOR ?? Number.MAX_SAFE_INTEGER;
    let oldestIndex: number | undefined;

    const lowVersions: string[] = [];
    const nodesVersion = actNodes.map((r) => r.version).sort(rcompare);
    const versions = countBy(nodesVersion);

    for (let i = 0; i < actNodes.length; i++) {
      const el = actNodes[i];
      if (+el.slash_points > highestSlash) {
        highestSlash = +el.slash_points;
      }

      if (el.status_since < oldest && el.requested_to_leave === false) {
        oldest = el.status_since;
        oldestIndex = i;
      }

      if ((!lowestBond || lowestBond > +el.total_bond) && el.requested_to_leave === false) {
        lowestBond = +el.total_bond;
      }

      if (
        Object.keys(versions).length > 1 &&
        el.version !== Object.keys(versions)[0] &&
        versions[Object.keys(versions)[0]] > Math.floor((actNodes.length * 2) / 3)
      ) {
        lowVersions.push(el.node_address);
      }
    }

    let extraChurn = 0;
    let leavingBondCalc = 0;
    let leavingCountCalc = 0;

    actNodes.forEach((el, index) => {
      fillNodeData(filteredNodes, el, index);

      filteredNodes[index].churn = [];

      if (+el.total_bond === lowestBond) {
        filteredNodes[index].churn.push({
          name: "Lowest Bond",
          icon: CheapIcon.src || "/assets/images/cheap.svg",
          type: churnProgressValue > 0.5 ? "churn-out" : "churn-out-candidate",
        });
        leavingBondCalc += +el.total_bond;
        leavingCountCalc += 1;
      }

      if (index === oldestIndex) {
        filteredNodes[index].churn.push({
          name: "Oldest",
          icon: OldIcon.src || "/assets/images/old.svg",
          type: churnProgressValue > 0.5 ? "churn-out" : "churn-out-candidate",
        });
        leavingBondCalc += +el.total_bond;
        leavingCountCalc += 1;
      }

      if (+el.slash_points === highestSlash) {
        filteredNodes[index].churn.push({
          name: "Highest Slashes",
          icon: AngryIcon.src || "/assets/images/angry.svg",
          type: churnProgressValue > 0.5 ? "churn-out" : "churn-out-candidate",
        });
        leavingBondCalc += +el.total_bond;
        leavingCountCalc += 1;
      }

      if (lowVersions.includes(el.node_address) && churnProgressValue > 0.9) {
        filteredNodes[index].churn.push({
          name: "Low Version",
          icon: VersionIcon.src || "/assets/images/version.svg",
          type: churnProgressValue > 0.9 ? "churn-out" : "",
        });
        extraChurn += 1;
      }

      if (el.requested_to_leave) {
        filteredNodes[index].churn.push({
          name: "Requested to leave",
          icon: ArrowDownSquareIcon.src || "/assets/images/arrow-down-square.svg",
          type: "leave",
        });

        if (mimirs && +mimirs?.DESIREDVALIDATORSET >= actNodes.length + extraChurn) {
          extraChurn += 1;
        }
        leavingBondCalc += +el.total_bond;
        leavingCountCalc += 1;
      }
    });

    setExtraNodeChurn(extraChurn);
    setLeaving(leavingBondCalc, leavingCountCalc);

    return filteredNodes;
  }, [nodesQuery, chainsHeight, churnProgressValue, mimirs, setLeaving]);

  const stbNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }

    const actNodes = nodesQuery?.filter((e) => e.status === "Active");
    const nodesVersion = actNodes?.map((r) => r.version).sort(rcompare);
    const versions = countBy(nodesVersion);
    const activeVersion = Object.keys(versions);

    const latestVersion = activeVersion[0];
    let justLatest = false;
    if (versions[latestVersion] > Math.floor((actNodes.length * 2) / 3)) {
      justLatest = true;
    }

    let stbNodesList = nodesQuery?.filter(
      (e) =>
        (e.status === "Standby" || e.status === "Ready") &&
        (activeVersion.includes(e.version) || e.total_bond >= minBond)
    );

    if (stbNodesList.length === 0) {
      return [];
    }

    stbNodesList = orderBy(stbNodesList, [(o) => +o.total_bond], ["desc"]);

    const filteredNodes: NodeRow[] = [];
    const churnInNumbers = 3 + newNodesChurn + extraNodeChurn;
    const remainingCount = +mimirs?.DESIREDVALIDATORSET - (activeNodes?.length ?? 0) + leavingCount;
    let lastChurnIndex = 0;
    let churnNodes = 0;
    let enteringBondCalc = 0;
    let enteringCountCalc = 0;

    for (let i = 0; i < stbNodesList.length; i++) {
      const el = stbNodesList[i];
      fillNodeData(filteredNodes, el, i);

      const chainHeight = chainsHeight?.THOR;

      filteredNodes[i].churn = [];

      if (el.jail?.release_height > chainHeight) {
        filteredNodes[i].churn.push({
          name: {
            ...el.jail,
            releaseTime: moment.duration((el.jail?.release_height - chainHeight) * 6, "seconds").humanize(),
          },
          icon: HandcuffsIcon.src || "/assets/images/handcuffs.svg",
          type: "jail",
        });
        continue;
      }

      if (churnInNumbers > churnNodes) {
        if (justLatest && el.version !== latestVersion) {
          continue;
        }
        if (!activeVersion.includes(el.version)) {
          continue;
        }
        if (el.jail && el.jail.release_height > chainsHeight?.THOR) {
          continue;
        }
        if (+el.total_bond < minBond) {
          continue;
        }
        if (remainingCount <= churnNodes) {
          continue;
        }
        if (el.maintenance) {
          continue;
        }
        filteredNodes[i].churn.push({
          name: "Churning In",
          icon: CircleUpIcon.src || "/assets/images/circle-up.svg",
          type: churnProgressValue > 0.5 ? "churn-in" : "churn-in-candidate",
        });
        churnNodes++;
        enteringBondCalc += +el.total_bond;
        enteringCountCalc += 1;
        lastChurnIndex = i;
      }

      if (retiringVaults.includes(el.pub_key_set?.secp256k1)) {
        filteredNodes[i].churn.push({
          name: "Retiring Vault, Can't unbond",
          icon: WalkerIcon.src || "/assets/images/walker.svg",
        });
      }

      if (el.maintenance) {
        filteredNodes[i].churn.push({
          name: "Maintenance mode, won't churn",
          icon: HammerIcon.src || "/assets/images/hammer.svg",
        });
      }
    }

    setEntering(enteringBondCalc, enteringCountCalc);
    setTheLeastBondChurn(filteredNodes[lastChurnIndex]?.total_bond);

    return filteredNodes;
  }, [
    nodesQuery,
    minBond,
    newNodesChurn,
    extraNodeChurn,
    mimirs,
    activeNodes,
    leavingCount,
    chainsHeight,
    churnProgressValue,
    retiringVaults,
    setEntering,
    setTheLeastBondChurn
  ]);

  const whiteListedNodes = useMemo(() => {
    if (!nodesQuery) {
      return undefined;
    }

    const actNodes = activeNodes?.map((n) => n.address) || [];
    const stbNodesList = stbNodes?.map((n) => n.address) || [];

    let whtNodes = nodesQuery?.filter(
      (e) =>
        !actNodes.includes(e.node_address) &&
        e.status !== "Disabled" &&
        e.age.number < 300 &&
        !stbNodesList.includes(e.node_address)
    );

    whtNodes = orderBy(whtNodes, [(o) => +o.total_bond], ["desc"]);

    const filteredNodes: NodeRow[] = [];

    whtNodes.forEach((el, index) => {
      fillNodeData(filteredNodes, el, index);
    });

    return filteredNodes;
  }, [nodesQuery, activeNodes, stbNodes]);

  const getRetiringVault = (vaults: any[]) => {
    return vaults
      .filter((v) => v.status === "RetiringVault")
      .map((v) => v.membership)
      .flat();
  };

  const fetchNodeOverview = async () => {
    try {
      const data = await getNodeOverview();
      const { network: net, churn, blockRewards } = data;

      setNetwork(net);
      setBondMetrics(net.bondMetrics);
      setChurnOption(churn);
      setChurnHalted(blockRewards.HALTCHURNING);
      setMinBond(+blockRewards.MINIMUMBONDINRUNE);
      setChurnInterval(+blockRewards.CHURNINTERVAL);
      setNewNodesChurn(+blockRewards.NUMBEROFNEWNODESPERCHURN);
    } catch (e) {
      console.error(e);
    }
  };

  const updateNodes = async () => {
    try {
      const nodesInfo = await getNodesInfo();
      setNodesQuery(nodesInfo);
    } catch (e) {
      console.error(e);
    }
  };

  const saveFilters = () => {
    localStorage.setItem("filterSettings", JSON.stringify(hides));
  };

  const totalAwardsCalc = () => {
    if (!nodesQuery) return;
    let total = 0;
    for (const a in nodesQuery) {
      total = total + +nodesQuery[a].current_award;
    }
    setTotalAwards(total);
  };

  const churnProgress = () => {
    if (!network || !churnInterval) {
      return;
    }

    const churnValue = 1 - (network?.nextChurnHeight - (chainsHeight?.THOR ?? 0)) / churnInterval;
    setChurnProgressValue(churnValue);

    const churnTime = network?.nextChurnHeight - (chainsHeight?.THOR ?? 0);
    setChurnProgressTime(churnTime);
  };

  const filteredActiveNodes = useMemo(() => {
    if (!activeNodes) return [];
    return activeNodes.filter(node => 
      node.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeNodes, searchTerm]);

  const filteredStbNodes = useMemo(() => {
    if (!stbNodes) return [];
    return stbNodes.filter(node => 
      node.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stbNodes, searchTerm]);

  const filteredWhiteListedNodes = useMemo(() => {
    if (!whiteListedNodes) return [];
    return whiteListedNodes.filter(node => 
      node.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.location?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [whiteListedNodes, searchTerm]);

  useEffect(() => {
    churnProgress();
    totalAwardsCalc();
  }, [chainsHeight, nodesQuery, network, churnInterval]);

  useEffect(() => {
    fetchNodeOverview();

    getAsgard()
      .then((res) => {
        setRetiringVaults(getRetiringVault(res));
      })
      .catch((e) => {
        console.error(e);
      });

    updateNodes().then(() => {
      setLoading(false);
    });

    getMimir().then((data) => {
      setMimirs(data);
    });

    intervalIdRef.current = setInterval(() => {
      updateNodes();
    }, 10 * 1e3);

    secondIntervalRef.current = setInterval(() => {
      fetchNodeOverview();
    }, 60 * 1e3);

    churnProgress();

    const savedFilters = localStorage.getItem("filterSettings");
    if (savedFilters) {
      setHides(JSON.parse(savedFilters));
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (secondIntervalRef.current) {
        clearInterval(secondIntervalRef.current);
      }
    };
  }, []);

  return (
    <PageContainer error={error && !loading} fluid={true}>
      <div className={styles["grid-network"]}>
          <InfoCard options={activeInfo} inner={true} />
          <InfoCard options={standbyInfo} inner={true} />
      </div>
      <div className={styles["grid-network"]}>
          <InfoCard options={churnInfo} inner={true}>
            {churnInfo[0]?.items?.find(
              (item: any) => item.valueSlot === "churn"
            ) && (
              <SkeletonItem
                loading={
                  !churnInfo[0]?.items?.find(
                    (item: any) => item.valueSlot === "churn"
                  )?.value
                }
              >
                <span style={{ fontFamily: "Montserrat" }}>
                  {
                    churnInfo[0]?.items?.find(
                      (item: any) => item.valueSlot === "churn"
                    )?.value
                  }
                </span>
              </SkeletonItem>
            )}
          </InfoCard>
          <InfoCard options={blockRewardInfo} inner={true} />
      </div>
      <div className={styles["search-container"]}>
        <div id={styles["nodes-search-container"]}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search All Tables"
            className={styles["search-input"]}
          />
          <SearchIcon className={styles["search-icon"]} />
        </div>

        <div className={styles["filter-btns"]}>
          <button
            className={`${styles["filter-button"]} ${
              !hides.isp ? styles["enabled-btn"] : ""
            }`}
            onClick={() => {
              setHides({ ...hides, isp: !hides.isp });
              saveFilters();
            }}
          >
            <CaretIcon
              className={`${styles["filter-icon"]} ${
                hides.isp ? styles.disable : ""
              }`}
            />
            ISP
          </button>
          <button
            className={`${styles["filter-button"]} ${
              !hides.fee ? styles["enabled-btn"] : ""
            }`}
            onClick={() => {
              setHides({ ...hides, fee: !hides.fee });
              saveFilters();
            }}
          >
            <CaretIcon
              className={`${styles["filter-icon"]} ${
                hides.fee ? styles.disable : ""
              }`}
            />
            Fee
          </button>
          <button
            className={`${styles["filter-button"]} ${
              !hides.score ? styles["enabled-btn"] : ""
            }`}
            onClick={() => {
              setHides({ ...hides, score: !hides.score });
              saveFilters();
            }}
          >
            <CaretIcon
              className={`${styles["filter-icon"]} ${
                hides.score ? styles.disable : ""
              }`}
            />
            Score
          </button>
          <button
            className={`${styles["filter-button"]} ${
              !hides.age ? styles["enabled-btn"] : ""
            }`}
            onClick={() => {
              setHides({ ...hides, age: !hides.age });
              saveFilters();
            }}
          >
            <CaretIcon
              className={`${styles["filter-icon"]} ${
                hides.age ? styles.disable : ""
              }`}
            />
            Age
          </button>
          <button
            className={`${styles["filter-button"]} ${
              !(hides.RPC && hides.BFR) ? styles["enabled-btn"] : ""
            }`}
            onClick={() => {
              setHides({
                ...hides,
                RPC: !hides.RPC,
                BFR: !hides.BFR,
              });
              saveFilters();
            }}
          >
            <CaretIcon
              className={`${styles["filter-icon"]} ${
                hides.RPC && hides.BFR ? styles.disable : ""
              }`}
            />
            Health
          </button>
        </div>
      </div>

      <Card imgSrc={ActiveImage.src} title="Active Nodes">
        {loading ? (
          <TableLoader cols={activeCols.map(col => ({ label: col.label, field: col.sortKey || "id" }))} />
        ) : filteredActiveNodes ? (
          <Table
            columns={activeCols}
            data={filteredActiveNodes}
            loading={loading}
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
            enableSort={true}
            enableSelect={false}
            className="vgt-table net-table"
            emptyMessage="No active nodes available"
          />
        ) : null}
      </Card>

      <Card imgSrc={ChurnImage.src} title="Eligible Nodes">
        {loading ? (
          <TableLoader cols={stbCols.map(col => ({ label: col.label, field: col.sortKey || "id" }))} />
        ) : filteredStbNodes ? (
          <Table
            columns={stbCols}
            data={filteredStbNodes}
            loading={loading}
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
            enableSort={true}
            enableSelect={false}
            className="vgt-table net-table"
            emptyMessage="No eligible nodes available"
          />
        ) : null}
      </Card>

      <Card imgSrc={WhitelistImage.src} title="Whitelisted Nodes">
        {loading ? (
          <TableLoader cols={otherCols.map(col => ({ label: col.label, field: col.sortKey || "id" }))} />
        ) : filteredWhiteListedNodes ? (
          <Table
            columns={otherCols}
            data={filteredWhiteListedNodes}
            loading={loading}
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
            enableSort={true}
            enableSelect={false}
            className="vgt-table net-table"
            emptyMessage="No whitelisted nodes available"
          />
        ) : null}
      </Card>
    </PageContainer>
  );
};

export default NodesPage;