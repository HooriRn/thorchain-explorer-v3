"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./Pendulum.module.css";
import { useRunePrice } from "@/lib/store";
import Card from "@/components/ui/Card";
import CardsHeader from "@/components/CardsHeader";
import { getAsgard, getThorPools, getMimir, thornodeAPI } from "@/lib/api";
import Rune from "@/assets/images/rune.svg";

import {
  number as fmtNumber,
  formatPercent as fmtPercent,
  formatUSDValue,
} from "@/utils/format";
const Pendulum = () => {
  const [loading, setLoading] = useState(true);
  const [securityBudget, setSecurityBudget] = useState<number | undefined>(
    undefined
  );
  const [effectiveBond, setEffectiveBond] = useState<number | undefined>(
    undefined
  );
  const [totalSecuredValue, setTotalSecuredValue] = useState<
    number | undefined
  >(undefined);
  const [adjustedSecuredTotal, setAdjustedSecuredTotal] = useState<
    number | undefined
  >(undefined);
  const [assetBalancePoints, setAssetBalancePoints] = useState<number>(10000);
  const [tvlBasisPoints, setTvlBasisPoints] = useState<number>(0);
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(true);
  const [totalVaultValue, setTotalVaultValue] = useState<number | undefined>(
    undefined
  );
  const [poolShare, setPoolShare] = useState<number | undefined>(undefined);
  const [nodeShare, setNodeShare] = useState<number | undefined>(undefined);
  const [pendulumUseEffectiveSecurity, setPendulumUseEffectiveSecurity] =
    useState<number | undefined>(undefined);
  const [currentNetworkState, setCurrentNetworkState] = useState<string>("");
  const [securityDelta, setSecurityDelta] = useState<number | undefined>(
    undefined
  );

  const runePrice = useRunePrice();

  const [securityBudgetInfo, setSecurityBudgetInfo] = useState(
    "Total bond of the bottom 2/3 of the nodes in the network"
  );

  interface TableGeneralStat {
    name: string;
    value?: string | number;
    extraText?: string;
    description?: string;
    link?: string;
    change?: number;
    isDown?: boolean;
  }

  const [generalStatsDetails, setGeneralStatsDetails] = useState<
    TableGeneralStat[]
  >([
    { name: "Total Active Bond" },
    { name: "Total Secured Value" },
    { name: "Node Reward Share" },
    { name: "Pool Reward Share" },
  ]);
  const [securityStats, setSecurityStats] = useState<TableGeneralStat[]>([
    { name: "Total Vault Value" },
    { name: "Security Budget", description: securityBudgetInfo },
    { name: "Security Delta" },
  ]);

  const runeCur = () => "RUNE";

  const scalePosition = useCallback(() => {
    if (nodeShare === undefined) return 0;

    const maxTilt = 15;
    const midpoint = 50;
    const tiltPercentage = (nodeShare * 100 - midpoint) / midpoint;
    return Math.max(Math.min(tiltPercentage * maxTilt, maxTilt), -maxTilt);
  }, [nodeShare]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const mimirData = await getMimir();
      console.log("MimirData", mimirData);

      const currentAssetBalancePoints =
        typeof mimirData.DERIVEDDEPTHBASISPTS !== "undefined" &&
        mimirData.DERIVEDDEPTHBASISPTS > 0
          ? mimirData.DERIVEDDEPTHBASISPTS
          : 10000;
      setAssetBalancePoints(currentAssetBalancePoints);
      const currentPendulumUseEffectiveSecurity =
        mimirData.PENDULUMUSEEFFECTIVESECURITY;
      setPendulumUseEffectiveSecurity(currentPendulumUseEffectiveSecurity);
      const currentTvlBasisPoints =
        mimirData.TVLCAPBASISPOINTS > 0 ? mimirData.TVLCAPBASISPOINTS : 0;
      setTvlBasisPoints(currentTvlBasisPoints);

      console.log("Mimir data loaded. Proceeding to parallel network calls...");
      const [vaultValue, nodesContext, poolsContext] = await Promise.all([
        fetchVaultData(),
        loadNodesData(),
        loadPoolsData(),
      ]);
      console.log("All data loads complete:", {
        vaultValue,
        nodesContext,
        poolsContext,
      });

      const activeNodes = nodesContext.filter(
        (node: any) => node.status === "Active"
      );
      activeNodes.sort(
        (a: any, b: any) => Number(b.total_bond) - Number(a.total_bond)
      );
      const cutoffIndex = Math.floor(activeNodes.length / 3);
      const bottomTwoThirds = activeNodes.slice(cutoffIndex);
      const securityBudgetBottom = bottomTwoThirds.reduce(
        (sum: number, node: any) => sum + Number(node.total_bond) / 1e8,
        0
      );
      const totalBond = activeNodes.reduce(
        (sum: number, node: any) => sum + Number(node.total_bond) / 1e8,
        0
      );

      let effBond =
        currentPendulumUseEffectiveSecurity === 1
          ? securityBudgetBottom
          : totalBond;
      let secBudget = securityBudgetBottom;
      let secBudgetInfo =
        "Total bond of the bottom 2/3 of the nodes in the network";
      if (currentTvlBasisPoints > 0) {
        secBudgetInfo = `Effective Bond is at ${
          currentTvlBasisPoints / 100
        }% TVL Basis Point`;
        secBudget = totalBond;
      }

      const totalSecuredVal = poolsContext.reduce(
        (sum: number, pool: any) => sum + Number(pool.balance_rune) / 1e8,
        0
      );
      const poolsForPrices = poolsContext;
      const assetPrices = poolsForPrices.reduce(
        (prices: Record<string, number>, pool: any) => {
          prices[pool.asset] = +pool.balance_rune / +pool.balance_asset;
          return prices;
        },
        {} as Record<string, number>
      );
      const assets = new Map<string, { amount: number; asset: string }>();
      vaultValue.forEach((vault: any) => {
        vault.coins.forEach((coin: any) => {
          const currentAmount = assets.get(coin.asset)?.amount || 0;
          assets.set(coin.asset, {
            amount: currentAmount + +coin.amount,
            asset: coin.asset,
          });
        });
      });
      const vaultAssets = Array.from(assets.values()).map((asset) => {
        const amountInBase = asset.amount / 1e8;
        const assetPrice = assetPrices[asset.asset] || 0;
        const runeValue = amountInBase * assetPrice;
        return {
          asset: asset.asset,
          amount: amountInBase,
          runeValue,
        };
      });
      const totalVaultVal = vaultAssets.reduce(
        (sum: number, asset: { runeValue: number }) => sum + asset.runeValue,
        0
      );
      const adjustedSecured =
        totalSecuredVal * (currentAssetBalancePoints / 10000);
      const eff = effBond || 1e-8;
      let poolShareValue = (eff - adjustedSecured) / eff;
      let nodeShareValue = 1 - poolShareValue;
      if (poolShareValue < 0) poolShareValue = 0;
      if (nodeShareValue < 0) nodeShareValue = 0;
      if (poolShareValue > 1) poolShareValue = 1;
      if (nodeShareValue > 1) nodeShareValue = 1;
      const delta = (secBudget ?? 0) - (totalVaultVal ?? 0);
      const nodeSharePct = nodeShareValue * 100;
      let netState = "";
      if (Math.abs(nodeSharePct - 50) < 10) netState = "Normal";
      else if (nodeSharePct < 50) netState = "Overbonded";
      else netState = "Underbonded";

      setEffectiveBond(effBond);
      setSecurityBudget(secBudget);
      setTotalSecuredValue(totalSecuredVal);
      setAdjustedSecuredTotal(adjustedSecured);
      setTotalVaultValue(totalVaultVal);
      setPoolShare(poolShareValue);
      setNodeShare(nodeShareValue);
      setCurrentNetworkState(netState);
      setSecurityDelta(delta);
      setSecurityBudgetInfo(secBudgetInfo);

      setGeneralStatsDetails([
        {
          name: "Effective Bond",
          value: `${fmtNumber(effBond ?? 0, "0.00a")} ${runeCur()}`,
          extraText: formatUSDValue((effBond ?? 0) * (runePrice || 0)),
        },
        {
          name: "Total Secured Value",
          value: `${fmtNumber(adjustedSecured ?? 0, "0.00a")} ${runeCur()}`,
          extraText: formatUSDValue((adjustedSecured ?? 0) * (runePrice || 0)),
        },
        {
          name: "Node Reward Share",
          value: fmtPercent(nodeShareValue ?? 0, 2),
        },
        {
          name: "Pool Reward Share",
          value: fmtPercent(poolShareValue ?? 0, 2),
        },
      ]);
      setSecurityStats([
        {
          name: "Total Vault Value",
          value: `${fmtNumber(totalVaultVal ?? 0, "0.00a")} ${runeCur()}`,
          extraText: formatUSDValue((totalVaultVal ?? 0) * (runePrice || 0)),
        },
        {
          name: "Security Budget",
          value: `${fmtNumber(secBudget ?? 0, "0.00a")} ${runeCur()}`,
          extraText: formatUSDValue((secBudget ?? 0) * (runePrice || 0)),
          description: secBudgetInfo,
        },
        {
          name: "Security Delta",
          value: `${fmtNumber(delta ?? 0, "0.00a")} ${runeCur()}`,
          extraText: formatUSDValue((delta ?? 0) * (runePrice || 0)),
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Error during initial load:", error);
      setLoading(false);
    }
  }, [runePrice]);

  useEffect(() => {
    let isMounted = true;
    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [loadAllData]);

  const fetchVaultData = async () => {
    const vaults = await getAsgard();
    console.log("Vaults", vaults);
    return vaults;
  };
  const loadPoolsData = async () => {
    const poolsData = await getThorPools();
    console.log("Pools for totalSecuredValue", poolsData);
    return poolsData;
  };
  const loadNodesData = async () => {
    const nodesData = await thornodeAPI.getNodes();
    console.log("NodesData", nodesData);
    return nodesData;
  };

  const loadMimirData = async () => {
    try {
      const mimirData = await getMimir();
      console.log("MimirData", mimirData);
      if (
        typeof mimirData.DERIVEDDEPTHBASISPTS !== "undefined" &&
        mimirData.DERIVEDDEPTHBASISPTS > 0
      ) {
        setAssetBalancePoints(mimirData.DERIVEDDEPTHBASISPTS);
      } else {
        setAssetBalancePoints(10000);
      }
      setPendulumUseEffectiveSecurity(mimirData.PENDULUMUSEEFFECTIVESECURITY);
      setTvlBasisPoints(
        mimirData.TVLCAPBASISPOINTS > 0 ? mimirData.TVLCAPBASISPOINTS : 0
      );
    } catch (error) {
      console.error("Error fetching mimir data:", error);
    }
  };

  const currentScalePosition = scalePosition();

  return (
    <div className={styles["pendulum-view"]}>
      <Card extraClass={styles["network-balance-card"]} isLoading={loading}>
        <svg
          className={styles["balance-svg"]}
          viewBox="40 0 220 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="148"
            y="30"
            width="4"
            height="125"
            rx="2"
            ry="2"
            fill="var(--primary)"
          />
          <rect
            x="145"
            y="125"
            width="10"
            height="50"
            rx="5"
            ry="5"
            fill="var(--border)"
          />
          <rect
            x="110"
            y="170"
            width="80"
            height="20"
            rx="2"
            ry="2"
            fill="var(--border)"
          />

          <g
            transform={`translate(0, ${currentScalePosition})`}
            style={{ transformOrigin: "150px 50px" }}
          >
            <line
              x1="78"
              y1={50 + currentScalePosition}
              x2="150"
              y2="50"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <line
              x1="80"
              y1={50 + currentScalePosition}
              x2="60"
              y2="90"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="80"
              y1={50 + currentScalePosition}
              x2="100"
              y2="90"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 60 90 A 18 18 0 0 0 100 90"
              fill="var(--border)"
              stroke="var(--border)"
              strokeWidth="2"
            />
            <text
              x="80"
              y="103"
              textAnchor="middle"
              fontSize="10"
              fill="var(--sec-font-color)"
            >
              {fmtNumber(effectiveBond ?? 0, "0.0a")}
            </text>

            <rect
              x="55"
              y="125"
              width="48"
              height="18"
              fill="var(--gradient-left)"
              rx="5"
            />
            <text
              x="79"
              y="136"
              textAnchor="middle"
              fontSize="8"
              fill="var(--sec-font-color)"
            >
              Security
            </text>
          </g>

          <g
            transform={`translate(0, ${currentScalePosition * -1})`}
            style={{ transformOrigin: "150px 50px" }}
          >
            <line
              x1="151"
              y1={50 + currentScalePosition}
              x2="222"
              y2="50"
              stroke="var(--primary)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <line
              x1="220"
              y1={50}
              x2="200"
              y2="90"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="220"
              y1={50}
              x2="240"
              y2="90"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 198 90 A 18 18 0 0 0 241 90"
              fill="var(--border)"
              stroke="var(--border)"
              strokeWidth="2"
            />
            <text
              x="220"
              y="102"
              textAnchor="middle"
              fontSize="10"
              fill="var(--sec-font-color)"
            >
              {fmtNumber(adjustedSecuredTotal ?? 0, "0.0a")}
            </text>

            <rect
              x="198"
              y="125"
              width="50"
              height="18"
              fill="var(--gradient-left)"
              rx="5"
            />
            <text
              x="223"
              y="137"
              textAnchor="middle"
              fontSize="8"
              fill="var(--sec-font-color)"
            >
              Liquidity
            </text>
          </g>
        </svg>

        <div className={styles["network-status"]}>
          <span className={styles["status-text"]}>{currentNetworkState}</span>
        </div>
        <div className={styles["reward-summary"]}>
          {nodeShare !== undefined && poolShare !== undefined ? (
            nodeShare > poolShare ? (
              <span>
                Security earning {fmtPercent(nodeShare, 2)} of rewards
              </span>
            ) : poolShare > nodeShare ? (
              <span>
                Liquidity earning {fmtPercent(poolShare, 2)} of rewards
              </span>
            ) : (
              <span>Equal reward distribution</span>
            )
          ) : (
            <span>Equal reward distribution</span>
          )}
        </div>
      </Card>
      <div className={styles["balance-details"]}>
        <CardsHeader tableGeneralStats={generalStatsDetails} />
        <hr className="info-hr" />
        <CardsHeader tableGeneralStats={securityStats} />
      </div>
    </div>
  );
};

export default Pendulum;
