"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gt, rsort, valid } from "semver";
import moment from "moment";
import Checkmark from "@/assets/images/check-mark.svg";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import InfoCard from "@/components/InfoCard";
import ChartLoader from "@/components/ChartLoader";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import { Progress } from "@/components/ui/progressBar";

import AllocationsCard from "./components/AllocationsChart";
import ReserveBreakdownCard from "./components/ReserveBreakdownChart";
import ChainStatusTable from "./components/ChainStatusTable";

import { formatRune, isMainnet } from "@/utils/global";
import { formatTrendCurrency, formatTrendNumber } from "@/utils/format";
import { blockTime } from "@/lib/utils";
import { useTheme, useAppStore } from "@/lib/store";

import {
  getLastBlockHeight,
  getThorNetwork,
  getInboundAddresses,
  getNetworkAllocation,
  getBlockChainVersion,
  getThorVersion,
  getNetwork,
  getNodes,
  getReserveHistory,
  getMimir,
  getChainsHeight,
} from "@/lib/api";

import styles from "./network.module.css";

interface NetworkData {
  loading: boolean;
  network: any;
  rune: any[];
  lastblock: any;
  thorNetwork: any;
  blockchainVersion: any;
  nodes: any;
  activeNodes: any;
  uptodateNodes: any;
  thorVersion: any;
  inboundInfo: any;
  metaReserve: any;
  reserveHistory: any;
  earningHistory: any;
  networkAllocations: any;
  inAddresses: any[];
  chainsHeight: any;
}

interface Column {
  label: string;
  field: string;
  type: string;
  formatFn?: (value: any) => string;
  tdClass?: string;
  thClass?: string;
}

const NetworkPage: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const runePrice = useAppStore((state) => state.runePrice);

  const numberFormat = (value: any): string => {
    if (value > 1) return value.toString();
    return value === 1 ? "Mimir halt" : "OK";
  };

  const normalFormat = (value: any): string => {
    return value?.toString() || "";
  };

  const [state, setState] = useState<NetworkData>({
    loading: true,
    network: {},
    rune: [],
    lastblock: undefined,
    thorNetwork: undefined,
    blockchainVersion: undefined,
    nodes: undefined,
    activeNodes: undefined,
    uptodateNodes: undefined,
    thorVersion: undefined,
    inboundInfo: undefined,
    metaReserve: undefined,
    reserveHistory: undefined,
    earningHistory: undefined,
    networkAllocations: undefined,
    inAddresses: [],
    chainsHeight: undefined,
  });

  const extraSeries = {
    center: ["55%", "50%"],
    radius: ["40%", "70%"],
    nodeClick: "link",
    label: {
      formatter: (a: any) => {
        return `${a.name}: ${numberFormat(a?.data?.value)} RUNE`;
      },
      distanceToLabelLine: 5,
      fontFamily: "Montserrat",
    },
  };

  const uptodateNodeVersion = useCallback((nodes: any[]) => {
    if (nodes && nodes.length > 0) {
      const nodesVersion = nodes.map((n) => n.version);
      return rsort(nodesVersion)[0];
    }
    return undefined;
  }, []);

  const extra = useMemo(
    () => ({
      legend: {
        show: true,
        type: "scroll",
        orient: "vertical",
        x: "left",
        y: "top",
        icon: "circle",
        textStyle: {
          color: "var(--font-color)",
        },
      },
      tooltip: {
        formatter: (a: any) => {
          return `${a.name}: ${numberFormat(a?.data?.value)} RUNE`;
        },
      },
    }),
    []
  );

  const versionProgress = useMemo(() => {
    if (!!state.nodes && state.blockchainVersion) {
      return Math.ceil(
        ((state.uptodateNodes?.length || 0) /
          (state.activeNodes?.length || 1)) *
          100
      );
    }
    return 1;
  }, [
    state.nodes,
    state.blockchainVersion,
    state.uptodateNodes,
    state.activeNodes,
  ]);

  const networkOverview = useMemo(() => {
    let revenueOverview: any[] = [];
    if (isMainnet()) {
      revenueOverview = [
        {
          name: "Outbound Fee (30D)",
          value: state.metaReserve?.gasFeeOutbound / 1e8,
          filter: (v: any) => `${formatTrendNumber(v, { decimals: 1 })} RUNE`,
          usdValue: runePrice
            ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
            : () => "$0",
        },
        {
          name: "Network Fee (30D)",
          value: state.metaReserve?.networkFee / 1e8,
          filter: (v: any) => `${formatTrendNumber(v, { decimals: 1 })} RUNE`,
          usdValue: runePrice
            ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
            : () => "$0",
        },
        {
          name: "Gas Reimbursement (30D)",
          value: state.metaReserve?.gasReimbursement / 1e8,
          filter: (v: any) => `${formatTrendNumber(v, { decimals: 1 })} RUNE`,
          usdValue: runePrice
            ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
            : () => "$0",
        },
      ];
    }

    return [
      {
        title: "Network Overview",
        rowStart: 1,
        colSpan: "1",
        icon: "/assets/images/network.svg",
        items: [
          {
            name: "Blockchain Version",
            value: state.blockchainVersion?.current,
          },
          {
            name: "Version Age",
            value:
              state.chainsHeight?.THOR - state.thorVersion?.next_since_height,
            filter: (v: any) => blockTime(v, true),
          },
          {
            name: "TOR Price in RUNE",
            value: state.thorNetwork?.tor_price_in_rune / 1e8,
            filter: (v: any) => `${formatTrendNumber(v, { decimals: 4 })} RUNE`,
            usdValue: true,
          },
          {
            name: "Vaults Migrating",
            value: state.thorNetwork?.vaults_migrating ? "Yes" : "No",
          },
          {
            name: "Effective Security Bond",
            value: state.thorNetwork?.effective_security_bond / 1e8,
            filter: (v: any) => `${formatTrendNumber(v, { decimals: 1 })} RUNE`,
            usdValue: runePrice
              ? (v: any) => formatTrendCurrency(v * runePrice, { decimals: 2 })
              : () => "$0",
          },
          ...revenueOverview,
        ],
      },
    ];
  }, [
    state.metaReserve,
    state.blockchainVersion,
    state.chainsHeight,
    state.thorVersion,
    state.thorNetwork,
    runePrice,
  ]);

  const newStandByVersion = useMemo(() => {
    if (!state.blockchainVersion || !state.nodes) {
      return;
    }
    const currentVer = state.blockchainVersion.current;
    const node = state.nodes
      ?.filter((n: any) => valid(n.version) && gt(n.version, currentVer))
      .map((n: any) => n.version);
    if (node && node.length > 0) {
      return rsort(node)[0].version;
    }
    return null;
  }, [state.blockchainVersion, state.nodes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          getLastBlockHeight(),
          getThorNetwork(),
          getInboundAddresses(),
          getNetworkAllocation(),
          getBlockChainVersion(),
          getThorVersion(),
          getNetwork(),
          getNodes(),
          getReserveHistory(),
          getChainsHeight(),
        ]);

        const [
          lastBlockRes,
          thorNetworkRes,
          inboundAddressesRes,
          networkAllocationsRes,
          blockchainVersionRes,
          thorVersionRes,
          networkRes,
          nodesRes,
          reserveHistoryRes,
          chainsHeightRes,
        ] = results.map((res) => (res.status === "fulfilled" ? res : null));

        if (!lastBlockRes || !thorNetworkRes || !inboundAddressesRes) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const lastblock = lastBlockRes.value;
        const thorNetwork = thorNetworkRes.value;
        const inAddresses = inboundAddressesRes.value;

        let inboundInfo = inAddresses;

        try {
          const mimirData = await getMimir();

          inboundInfo = inAddresses.map((chain: any) => ({
            ...chain,
            haltHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`.*HALT.*${chain.chain}CHAIN`).test(key) ||
                      key === "HALTCHAINGLOBAL") &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltTradingHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`HALT${chain.chain}TRADING`).test(key) ||
                      key === "HALTTRADING") &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltSigningHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    (new RegExp(`HALTSIGNING${chain.chain}`).test(key) ||
                      key === "HALTSIGNING") &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            haltLPHeight: Math.max(
              ...Object.keys(mimirData)
                .filter(
                  (key) =>
                    new RegExp(`PAUSELP${chain.chain}`).test(key) &&
                    mimirData[key] !== 0
                )
                .map((key) => mimirData[key])
            ),
            last_observed_in:
              lastblock?.find((b: any) => b.chain === chain.chain)
                ?.last_observed_in ?? 0,
          }));
        } catch (error) {}

        const activeNodes =
          nodesRes?.value?.filter((n: any) => n.status === "Active") || [];
        const uptodateNodes = activeNodes.filter(
          (n: any) => n.version === uptodateNodeVersion(activeNodes)
        );

        const newState = {
          ...state,
          lastblock,
          thorNetwork,
          inAddresses,
          inboundInfo,
          networkAllocations: networkAllocationsRes?.value || {},
          blockchainVersion: blockchainVersionRes?.value || {},
          thorVersion: thorVersionRes?.value || {},
          network: networkRes?.value || {},
          nodes: nodesRes?.value || [],
          activeNodes,
          uptodateNodes,
          metaReserve: reserveHistoryRes?.value?.meta || {},
          reserveHistory: reserveHistoryRes?.value || null,
          earningHistory: null,
          chainsHeight: chainsHeightRes?.value || {},
          loading: false,
        };

        try {
          const earningHistoryResponse = await fetch(
            "/api/earning-history?count=30"
          );

          const earningHistoryData = await earningHistoryResponse.json();

          if (earningHistoryData.success) {
            const rewards = earningHistoryData.data;

            if (reserveHistoryRes?.value) {
              newState.metaReserve = reserveHistoryRes.value?.meta || {};
              newState.reserveHistory = reserveHistoryRes.value;
              newState.earningHistory = rewards;
            } else {
            }
          } else {
          }
        } catch (error) {}

        setState(newState);
      } catch (error) {
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  return (
    <Page error={null} fluid={false}>
      <div className={styles["grid-network"]}>
        <ReserveBreakdownCard
          reserveHistory={state.reserveHistory}
          earningHistory={state.earningHistory}
          loading={state.loading}
        />
        <AllocationsCard
          networkAllocations={state.networkAllocations}
          network={state.network}
        />
      </div>

      <div className={styles["grid-network"]}>
        <InfoCard
          options={networkOverview}
          inner={true}
          runePrice={runePrice}
        />
        <Card
          title="THORChain version upgrade progress"
          imgSrc="/assets/images/time.svg"
          imgStyle={{
            width: "36px",
            height: "36px",
          }}
          extraClass={styles["progress-card"]}
        >
          {versionProgress && (
            <div className={styles["progress-container"]}>
              <Progress
                width={versionProgress}
                height="12px"
                color="linear-gradient(to right, #00c0ff, #00ff9f)"
              />
            </div>
          )}
          <h3 style={{ textAlign: "center" }}>
            <span className={styles["sec-color"]}>
              {state.uptodateNodes ? state.uptodateNodes.length : "*"}
            </span>
            {" of "}
            <span className={styles["sec-color"]}>
              {state.activeNodes ? state.activeNodes.length : "*"}
            </span>
            {" nodes upgraded to "}
            <span className={styles["sec-color"]}>
              {state.activeNodes ? uptodateNodeVersion(state.activeNodes) : "*"}
            </span>
          </h3>
          {(newStandByVersion ||
            (state.uptodateNodes && state.uptodateNodes.length == 1)) && (
            <p style={{ textAlign: "center", color: "var(--primary)" }}>
              ✨ New version detected! (
              {newStandByVersion || uptodateNodeVersion(state.activeNodes)})
            </p>
          )}
          {versionProgress === 100 && (
            <p className={styles["version-progress"]}>
              All nodes are updated to the latest.
              <Checkmark className={styles.checkmark} />
            </p>
          )}
        </Card>
      </div>

      <ChainStatusTable
        inboundInfo={state.inboundInfo || []}
        loading={state.loading}
      />
    </Page>
  );
};

export default NetworkPage;
