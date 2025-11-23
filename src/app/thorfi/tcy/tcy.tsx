"use client";

import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import {
  getTcyInfo,
  getMimir,
  getConstants,
  earnings,
  getChainsHeight,
  getStats,
} from "@/lib/api";
import {
  formatNumber,
  formatTrendNumber,
  formatTrendCurrency,
  formatTrendPercentage,
  formatNumberToString,
} from "@/utils/format";
import { showAsset } from "@/utils/global";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import InfoCard from "@/components/InfoCard";
import AssetIcon from "@/components/AssetIcon";
import TableLoader from "@/components/TableLoader";
import {
  TcyAllocationPieChart,
  TcyEarningsBarChart,
} from "@/components/charts";
import {
  useTheme,
  useRunePrice,
  useChainsHeight,
  useSetChainsHeight,
  useSetRunePrice,
} from "@/lib/store";
import styles from "./tcy.module.css";

import CheckmarkIcon from "@/assets/images/square-checkmark.svg";
import XmarkIcon from "@/assets/images/xmark.svg";
import NetworkIcon from "@/assets/images/network.svg";
import AllocationsIcon from "@/assets/images/allocations.svg";
import AssetIconSvg from "@/assets/images/asset.svg";
import GearIcon from "@/assets/images/gear.svg";

interface TCYInfo {
  claimed_info: {
    count: number;
    total: number;
  };
  unclaim_info: {
    count: number;
    total: number;
    assets: Record<string, number>;
  };
  staker_info: {
    count: number;
    total: number;
  };
  pending_reward: number;
  tcy_in_pool: number;
  claimed_not_staked: number;
  pol_tcy: number;
  total_tcy_locked: number;
  total_tcy_locked_usd: number;
  stcy_minted: number;
  tcy_account_bond: number;
  TCYSupply: number;
  price: number;
  runeSupply: number;
  last_week_earnings: number;
  tcy_stake_eod: number;
  tcy_pool_eod: number;
}

interface Mimir {
  TCYCLAIMINGHALT?: number;
  TCYCLAIMINGSWAPHALT?: number;
  TCYSTAKEDISTRIBUTIONHALT?: number;
  TCYSTAKINGHALT?: number;
  TCYUNSTAKINGHALT?: number;
  HALTTCYTRADING?: number;
}

interface Constants {
  MinTCYForTCYStakeDistribution?: number;
  MinRuneForTCYStakeDistribution?: number;
  TCYStakeSystemIncomeBps?: number;
  int_64_values?: {
    MinTCYForTCYStakeDistribution?: number;
    MinRuneForTCYStakeDistribution?: number;
    TCYStakeSystemIncomeBps?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface EarningsData {
  intervals: Array<{
    startTime: number;
    endTime: number;
    runePriceUSD: number;
    pools: Array<{
      pool: string;
      earnings: number;
      totalLiquidityFeesRune: number;
    }>;
  }>;
}

interface AllocationData {
  name: string;
  value: number;
}

interface AssetDistribution {
  asset: string;
  value: number;
}

const TCYPage: React.FC = () => {
  const [tcyInfo, setTcyInfo] = useState<TCYInfo | null>(null);
  const [mimir, setMimir] = useState<Mimir | null>(null);
  const [networkConst, setNetworkConst] = useState<Constants | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<any>(null);
  const [rawEarningsData, setRawEarningsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const runePrice = useRunePrice();
  const chainsHeight = useChainsHeight();
  const setChainsHeight = useSetChainsHeight();
  const setRunePrice = useSetRunePrice();

  useEffect(() => {
    if (!chainsHeight || !chainsHeight.THOR) {
      const loadChainsHeight = async () => {
        try {
          const response = await fetch("/api/chains-height");
          const data = await response.json();
          if (data.success && data.data) {
            setChainsHeight(data.data);
          }
        } catch (error) {}
      };
      loadChainsHeight();
    }
  }, [chainsHeight, setChainsHeight]);

  const tcyAssetColumns = [
    { label: "Asset", field: "asset" },
    { label: "Value (TCY)", field: "value", type: "number" },
    { label: "Value ($)", field: "usdValue", type: "number", sortable: false },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tcyData, mimirData, constantsData, earningsData, statsData] =
          await Promise.all([
            getTcyInfo(),
            getMimir(),
            getConstants(),
            earnings("day", 30),
            getStats(),
          ]);

        setTcyInfo(tcyData as TCYInfo);
        setMimir(mimirData as Mimir);
        setNetworkConst(constantsData as Constants);

        if (statsData?.data?.runePriceUSD) {
          setRunePrice(Number.parseFloat(statsData.data.runePriceUSD));
        }

        setTcyInfo(tcyData as TCYInfo);
        setMimir(mimirData as Mimir);
        setNetworkConst(constantsData as Constants);
        setRawEarningsData(earningsData as unknown as EarningsData);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setRunePrice]);

  useEffect(() => {
    if (rawEarningsData && runePrice > 0 && tcyInfo) {
      const formattedEarnings = formatEarnings(rawEarningsData, tcyInfo);
      setEarningsHistory(formattedEarnings);
    }
  }, [runePrice, rawEarningsData, tcyInfo]);

  const formatEarnings = (data: EarningsData, tcyData?: TCYInfo) => {
    if (!data?.intervals) return null;

    const xAxis: string[] = [];
    const pe: any[] = [];
    const pf: any[] = [];

    data.intervals.forEach((interval, index) => {
      const startTime = interval.startTime;
      const endTime = interval.endTime;

      if (!startTime || !endTime || isNaN(startTime) || isNaN(endTime)) {
        xAxis.push(moment().format("dddd, MMM D"));
      } else {
        const timestamp = Math.floor((~~endTime + ~~startTime) / 2) * 1e3;
        const dateMoment = moment(timestamp);

        if (dateMoment.isValid()) {
          xAxis.push(dateMoment.format("dddd, MMM D"));
        } else {
          xAxis.push(moment().format("dddd, MMM D"));
        }
      }

      const tcy = interval.pools?.find((p) => p.pool === "THOR.TCY");
      const staked = interval.pools?.find((p) => p.pool === "tcy_stake_reward");
      const earnings =
        (+(staked?.earnings || 0) * +interval.runePriceUSD) / 10 ** 8;
      const liquidityFee =
        (+(tcy?.totalLiquidityFeesRune || 0) * +interval.runePriceUSD) /
        10 ** 8;

      if (index === data.intervals.length - 1) {
        const stakeValue =
          tcyData?.tcy_stake_eod && runePrice && runePrice > 0
            ? (tcyData.tcy_stake_eod / 1e8) * runePrice
            : earnings;
        const poolValue =
          tcyData?.tcy_pool_eod && runePrice && runePrice > 0
            ? (tcyData.tcy_pool_eod / 1e8) * runePrice
            : liquidityFee;

        pe.push({
          value: stakeValue,
          itemStyle: { color: "#F3BA2F" },
        });
        pf.push({
          value: poolValue,
          itemStyle: { color: "#F3BA2F" },
        });
      } else {
        pe.push(earnings);
        pf.push(liquidityFee);
      }
    });

    return {
      xAxis,
      series: [
        {
          type: "bar",
          name: "TCY Pool Fees",
          showSymbol: false,
          data: pf,
        },
        {
          type: "bar",
          name: "Stake Earnings",
          showSymbol: false,
          data: pe,
        },
      ],
    };
  };

  const allocationPie = useMemo((): AllocationData[] => {
    if (!tcyInfo) return [];

    return [
      {
        name: "Staked",
        value: tcyInfo.staker_info.total / 1e8,
      },
      {
        name: "Unclaimed",
        value: tcyInfo.unclaim_info.total / 1e8,
      },
      {
        name: "Pooled",
        value: tcyInfo.tcy_in_pool / 1e8,
      },
      {
        name: "Protocol Owned",
        value: tcyInfo.pol_tcy / 1e8,
      },
      {
        name: "Unstaked",
        value: tcyInfo.claimed_not_staked / 1e8,
      },
    ];
  }, [tcyInfo]);

  const infoCardData = useMemo(() => {
    if (!tcyInfo) return [];

    return [
      {
        title: "Claimed",
        rowStart: 1,
        colSpan: "1",
        items: [
          {
            name: "Number of Wallets",
            value: tcyInfo.claimed_info.count,
            filter: (v: number) => formatNumberToString(v, { decimals: 0 }),
            extraText: formatTrendPercentage(
              (tcyInfo.claimed_info.count / 11614) * 100
            ),
          },
          {
            name: "Supply",
            value: tcyInfo.claimed_info.total,
            filter: (v: number) =>
              `${formatNumberToString(v / 1e8, { decimals: 2 })} TCY`,
            extraText: formatTrendPercentage(
              (tcyInfo.claimed_info.total / 20660654128874864) * 100
            ),
          },
        ],
      },
      {
        title: "Unclaimed",
        rowStart: 1,
        colSpan: "1",
        items: [
          {
            name: "Number of Wallets",
            value: tcyInfo.unclaim_info.count,
            filter: (v: number) => formatNumberToString(v, { decimals: 0 }),
          },
          {
            name: "Supply",
            value: tcyInfo.unclaim_info.total,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
            extraText: formatTrendCurrency(
              (tcyInfo.unclaim_info.total / 1e8) * tcyInfo.price
            ),
          },
        ],
      },
      {
        title: "Stakers",
        rowStart: 2,
        colSpan: "1",
        link: "/stakers",
        items: [
          {
            name: "Number of Wallets",
            value: tcyInfo.staker_info.count,
            filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
          },
          {
            name: "Supply",
            value: tcyInfo.staker_info.total,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
            extraText: formatTrendCurrency(
              (tcyInfo.staker_info.total / 1e8) * tcyInfo.price
            ),
          },
          {
            name: "Pending Reward",
            value: tcyInfo.pending_reward / 1e8,
            usdValue: true,
            filter: (v: number) =>
              `${formatTrendNumber(v, { decimals: 2 })} RUNE`,
          },
          {
            name: "Next Payout",
            value: (() => {
              const thorHeight = chainsHeight?.THOR;
              if (!thorHeight || thorHeight === 0) {
                return undefined;
              }
              const blocksUntilPayout =
                Math.ceil(thorHeight / 14_400) * 14_400 - thorHeight;
              return blocksUntilPayout;
            })(),
            filter: (v: number) => {
              if (v === undefined || v === null) {
                return "Loading...";
              }
              return `${formatTrendNumber(v, { decimals: 0 })} Blocks`;
            },
            extraText: (() => {
              const thorHeight = chainsHeight?.THOR;
              if (!thorHeight || thorHeight === 0) {
                return "Loading...";
              }
              const blocksUntilPayout =
                Math.ceil(thorHeight / 14_400) * 14_400 - thorHeight;
              const timeString = moment
                .duration(blocksUntilPayout * 6, "seconds")
                .humanize();
              return timeString;
            })(),
          },
        ],
      },
      {
        title: "Others",
        rowStart: 2,
        colSpan: "1",
        items: [
          {
            name: "Pooled TCY",
            value: tcyInfo.tcy_in_pool,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 0 })} TCY`,
            extraText: formatTrendCurrency(
              (tcyInfo.tcy_in_pool / 1e8) * tcyInfo.price
            ),
          },
          {
            name: "Not staked",
            value: tcyInfo.claimed_not_staked,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
            extraInfo: `Almost ${formatTrendPercentage(
              (tcyInfo.claimed_not_staked / tcyInfo.claimed_info.total) * 100,
              { decimals: 2 }
            )} of claimers haven't staked`,
            extraText: formatTrendCurrency(
              (tcyInfo.claimed_not_staked / 1e8) * tcyInfo.price
            ),
          },
          {
            name: "Protocol Owned",
            value: tcyInfo.pol_tcy,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
            extraInfo: `Total TCY bought back by the protocol`,
            extraText: formatTrendCurrency(
              (tcyInfo.pol_tcy / 1e8) * tcyInfo.price
            ),
          },
        ],
      },
      {
        title: "Auto Compounding TCY",
        link: "https://tcy.thorchain.org/manage",
        rowStart: 3,
        colSpan: "1",
        items: [
          {
            name: "Total TCY Locked",
            value: tcyInfo.total_tcy_locked,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
            extraText: formatTrendCurrency(tcyInfo.total_tcy_locked_usd / 1e8),
          },
          {
            name: "sTCY Minted",
            value: tcyInfo.stcy_minted,
            filter: (v: number) =>
              `${formatTrendNumber(v / 1e8, { decimals: 2 })} sTCY`,
          },
          {
            name: "Auto Compounding",
            value:
              tcyInfo.total_tcy_locked /
              1e8 /
              (tcyInfo.tcy_account_bond / 1e8 + tcyInfo.total_tcy_locked / 1e8),
            filter: (v: number) =>
              formatTrendPercentage(v * 100, { decimals: 2 }),
          },
        ],
      },
      {
        title: "Economics",
        rowStart: 4,
        colSpan: "1",
        items: [
          {
            name: "Fixed Supply",
            value: tcyInfo.TCYSupply,
            filter: (v: number) =>
              `${formatTrendNumber(v, { decimals: 2 })} TCY`,
          },
          {
            name: "TCY Marketcap",
            value: tcyInfo.TCYSupply * tcyInfo.price,
            filter: (v: number) => formatTrendCurrency(v),
          },
          {
            name: "vs RUNE Marketcap",
            value: runePrice
              ? (tcyInfo.TCYSupply * tcyInfo.price) /
                ((tcyInfo.runeSupply / 1e8) * runePrice)
              : undefined,
            filter: (v: number) =>
              formatTrendPercentage(v * 100, { decimals: 2 }),
          },
          {
            name: "TCY Price",
            value: tcyInfo.price,
            filter: (v: number) => formatTrendCurrency(v),
          },
          {
            name: "Earnings (7d)",
            value: tcyInfo.last_week_earnings / 1e8,
            filter: (v: number) =>
              `${formatNumberToString(v, { decimals: 2 })} RUNE`,
            usdValue: true,
          },
          {
            name: "APR",
            value:
              ((tcyInfo.last_week_earnings / 1e8) * runePrice * 52) /
              tcyInfo.TCYSupply /
              tcyInfo.price,
            filter: (v: number) =>
              formatTrendPercentage(v * 100, { decimals: 2 }),
            extraInfo: `Annualized earnings based on last week's earnings`,
          },
          {
            name: "Multiple",
            value:
              1 /
              (((tcyInfo.last_week_earnings / 1e8) * runePrice * 52) /
                tcyInfo.TCYSupply /
                tcyInfo.price),
            filter: (v: number) => `${formatTrendNumber(v, { decimals: 1 })}x`,
          },
        ],
      },
      {
        title: "Holders",
        rowStart: 5,
        link: "/holders?asset=TCY",
        items: [],
      },
    ];
  }, [tcyInfo, chainsHeight, runePrice]);

  const mimirInfoCard = useMemo(() => {
    if (!mimir || !networkConst) {
      return [];
    }

    const checkHaltStatus = (value: number | undefined) => {
      if (value === undefined) return undefined;
      return value === 0 ? "False" : "True";
    };

    const parseConstant = (key: keyof Constants) => {
      let value = networkConst?.int_64_values?.[key];

      if (value === undefined) {
        value = networkConst?.[key];
      }

      const mimirValue = mimir?.[key as keyof Mimir];
      if (mimirValue !== undefined) {
        value = mimirValue;
      }

      return { value };
    };

    return [
      {
        title: "Status",
        rowStart: 1,
        colSpan: "1",
        items: [
          {
            name: "TCY CLAIMING",
            value: checkHaltStatus(mimir.TCYCLAIMINGHALT),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
          {
            name: "TCY CLAIMING SWAP",
            value: checkHaltStatus(mimir.TCYCLAIMINGSWAPHALT),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
          {
            name: "TCY STAKE DISTRIBUTION",
            value: checkHaltStatus(mimir.TCYSTAKEDISTRIBUTIONHALT),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
          {
            name: "TCY STAKING",
            value: checkHaltStatus(mimir.TCYSTAKINGHALT),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
          {
            name: "TCY UNSTAKING",
            value: checkHaltStatus(mimir.TCYUNSTAKINGHALT),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
          {
            name: "TCY TRADING",
            value: checkHaltStatus(mimir.HALTTCYTRADING),
            filter: (value: string) => (
              <div className={styles.mimirSlot}>
                {value === "False" ? (
                  <CheckmarkIcon className={styles.mimirIcon} />
                ) : (
                  <XmarkIcon className={styles.mimirIcon} />
                )}
              </div>
            ),
          },
        ],
      },
      {
        title: "Economic Settings",
        rowStart: 2,
        colSpan: "1",
        items: [
          {
            ...parseConstant("MinTCYForTCYStakeDistribution"),
            name: "Min TCY For Stake Distribution",
            filter: (v: number) => `${v / 1e8} TCY`,
          },
          {
            ...parseConstant("MinRuneForTCYStakeDistribution"),
            name: "Min Rune For Stake Distribution",
            filter: (v: number) => `${v / 1e8} RUNE`,
          },
          {
            ...parseConstant("TCYStakeSystemIncomeBps"),
            name: "TCY System Income",
            filter: (v: number) => `${v / 1e2}%`,
          },
        ],
      },
    ];
  }, [mimir, networkConst]);

  const assetDistributionData = useMemo((): AssetDistribution[] => {
    if (!tcyInfo?.unclaim_info?.assets) return [];

    return Object.entries(tcyInfo.unclaim_info.assets).map(
      ([asset, value]) => ({
        asset,
        value: value / 1e8,
      })
    );
  }, [tcyInfo]);

  const skeletonInfoCardData = [
    {
      title: "Claimed",
      rowStart: 1,
      colSpan: "1",
      items: [
        {
          name: "Number of Wallets",
          value: undefined,
          filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
        },
        {
          name: "Supply",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
      ],
    },
    {
      title: "Unclaimed",
      rowStart: 1,
      colSpan: "1",
      items: [
        {
          name: "Number of Wallets",
          value: undefined,
          filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
        },
        {
          name: "Supply",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
      ],
    },
    {
      title: "Stakers",
      rowStart: 2,
      colSpan: "1",
      link: "/stakers",
      items: [
        {
          name: "Number of Wallets",
          value: undefined,
          filter: (v: number) => formatTrendNumber(v, { decimals: 0 }),
        },
        {
          name: "Supply",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
        {
          name: "Pending Reward",
          value: undefined,
          usdValue: true,
          filter: (v: number) =>
            `${formatTrendNumber(v, { decimals: 2 })} RUNE`,
        },
        {
          name: "Next Payout",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v, { decimals: 0 })} Blocks`,
        },
      ],
    },
    {
      title: "Others",
      rowStart: 2,
      colSpan: "1",
      items: [
        {
          name: "Pooled TCY",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 0 })} TCY`,
        },
        {
          name: "Not staked",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
        {
          name: "Protocol Owned",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
      ],
    },
    {
      title: "Auto Compounding TCY",
      link: "https://tcy.thorchain.org/manage",
      rowStart: 3,
      colSpan: "1",
      items: [
        {
          name: "Total TCY Locked",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} TCY`,
        },
        {
          name: "sTCY Minted",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v / 1e8, { decimals: 2 })} sTCY`,
        },
        {
          name: "Auto Compounding",
          value: undefined,
          filter: (v: number) =>
            formatTrendPercentage(v * 100, { decimals: 2 }),
        },
      ],
    },
    {
      title: "Economics",
      rowStart: 4,
      colSpan: "1",
      items: [
        {
          name: "Fixed Supply",
          value: undefined,
          filter: (v: number) => `${formatTrendNumber(v, { decimals: 2 })} TCY`,
        },
        {
          name: "TCY Marketcap",
          value: undefined,
          filter: (v: number) => formatTrendCurrency(v),
        },
        {
          name: "vs RUNE Marketcap",
          value: undefined,
          filter: (v: number) =>
            formatTrendPercentage(v * 100, { decimals: 2 }),
        },
        {
          name: "TCY Price",
          value: undefined,
          filter: (v: number) => formatTrendCurrency(v),
        },
        {
          name: "Earnings (7d)",
          value: undefined,
          filter: (v: number) =>
            `${formatTrendNumber(v, { decimals: 2 })} RUNE`,
          usdValue: true,
        },
        {
          name: "APR",
          value: undefined,
          filter: (v: number) =>
            formatTrendPercentage(v * 100, { decimals: 2 }),
        },
        {
          name: "Multiple",
          value: undefined,
          filter: (v: number) => `${formatTrendNumber(v, { decimals: 1 })}x`,
        },
      ],
    },
    {
      title: "Holders",
      rowStart: 5,
      link: "/holders?asset=TCY",
      items: [],
    },
  ];

  const skeletonMimirInfoCard = [
    {
      title: "Status",
      rowStart: 1,
      colSpan: "1",
      items: [
        {
          name: "TCY CLAIMING",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
        {
          name: "TCY CLAIMING SWAP",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
        {
          name: "TCY STAKE DISTRIBUTION",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
        {
          name: "TCY STAKING",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
        {
          name: "TCY UNSTAKING",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
        {
          name: "TCY TRADING",
          value: undefined,
          filter: (value: string) => (
            <div className={styles.mimirSlot}>
              <div className={styles.mimirIcon} style={{ opacity: 0.3 }}>
                ⏳
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Economic Settings",
      rowStart: 2,
      colSpan: "1",
      items: [
        {
          name: "Min TCY For Stake Distribution",
          value: undefined,
          filter: (v: number) => `${v / 1e8} TCY`,
        },
        {
          name: "Min Rune For Stake Distribution",
          value: undefined,
          filter: (v: number) => `${v / 1e8} RUNE`,
        },
        {
          name: "TCY System Income",
          value: undefined,
          filter: (v: number) => `${v / 1e2}%`,
        },
      ],
    },
  ];

  return (
    <Page error={false} fluid={false}>
      <div className={styles.tcyCard}>
        <Card title="TCY Overview" imgSrc={NetworkIcon}>
          <InfoCard
            options={loading ? skeletonInfoCardData : infoCardData}
            inner={true}
            nested={true}
            runePrice={runePrice}
            tcyPrice={tcyInfo?.price || 0}
          />
        </Card>

        <Card
          title="Allocation & Earnings"
          imgSrc={AllocationsIcon}
          isChart={true}
        >
          <div className={styles.chartContainer}>
            <TcyAllocationPieChart
              allocationPie={allocationPie}
              loading={loading}
            />
          </div>

          <TcyEarningsBarChart
            earningsHistory={earningsHistory}
            loading={loading}
          />
        </Card>
      </div>

      <div className={styles.tcyCard}>
        <Card title="TCY Unclaimed asset distribution" imgSrc={AssetIconSvg}>
          <div className={styles.tableContainer}>
            {loading ? (
              <TableLoader cols={tcyAssetColumns} />
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {tcyAssetColumns.map((col) => (
                      <th key={col.field}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assetDistributionData.length > 0 ? (
                    assetDistributionData.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <div className={styles.assetItem}>
                            <AssetIcon
                              asset={row.asset}
                              height="1.2rem"
                              chainHeight="0.5rem"
                            />
                            <span>{showAsset(row.asset)}</span>
                          </div>
                        </td>
                        <td>
                          {formatTrendNumber(row.value, { decimals: 2 })}{" "}
                          <small>TCY</small>
                        </td>
                        <td>
                          $
                          {formatNumberToString(
                            row.value * (tcyInfo?.price || 0)
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        style={{ textAlign: "center", opacity: 0.5 }}
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card title="TCY Mimirs" imgSrc={GearIcon}>
          <InfoCard
            options={loading ? skeletonMimirInfoCard : mimirInfoCard}
            inner={true}
            nested={true}
            runePrice={runePrice}
            tcyPrice={tcyInfo?.price || 0}
          />
        </Card>
      </div>
    </Page>
  );
};

export default TCYPage;
