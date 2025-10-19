"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import CardsHeader from "@/components/CardsHeader";
import AffiliateTables from "../component/affiliateTables";
import {
  formatNumberToString,
  formatPercentToString,
  formatTrendCurrency,
  formatTrendNumber,
} from "@/utils/format";
import styles from "./leaderboard.module.css";

interface AffiliateData {
  affiliate: string;
  affiliate_fees_usd: number;
  total_swaps: number;
  total_volume_usd: number;
  vc: number;
  avg_bps: number;
  multi?: boolean;
}

interface OverallInfo {
  name: string;
  value: string;
}

interface PeriodItem {
  text: string;
  mode: string;
}

const Leaderboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [affiliateDataMonthly, setAffiliateDataMonthly] = useState<
    AffiliateData[]
  >([]);
  const [affiliateDataWeekly, setAffiliateDataWeekly] = useState<
    AffiliateData[]
  >([]);
  const [affiliateDataDaily, setAffiliateDataDaily] = useState<AffiliateData[]>(
    []
  );
  const [overallInfoMonthly, setOverallInfoMonthly] = useState<
    OverallInfo[] | null
  >(null);
  const [overallInfoWeekly, setOverallInfoWeekly] = useState<
    OverallInfo[] | null
  >(null);
  const [overallInfoDaily, setOverallInfoDaily] = useState<
    OverallInfo[] | null
  >(null);
  const [period, setPeriod] = useState<string>("month");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const periods: PeriodItem[] = [
    { text: "24 Hours", mode: "day" },
    { text: "1 Week", mode: "week" },
    { text: "1 Month", mode: "month" },
  ];

  const getOverallInfo = (currentPeriod: string): OverallInfo[] | null => {
    switch (currentPeriod) {
      case "month":
        return overallInfoMonthly;
      case "week":
        return overallInfoWeekly;
      case "day":
        return overallInfoDaily;
      default:
        return null;
    }
  };

  const mapMissing = (item: any): string => {
    switch (item.affiliate) {
      case "Edge Wallet":
        return "edge";
      case "OneKey Wallet":
        return "oneKey";
      case "ELD":
        return "Eldorito";
      case "dcf":
        return "Decentralfi";
      default:
        return item.affiliate;
    }
  };

  const calculateOverallInfo = (data: any[]): OverallInfo[] => {
    const totalAffiliates = data.reduce(
      (sum, item) => sum + item.affiliate_fees_usd,
      0
    );

    const nonMultiData = data.filter((item) => item.multi === false);

    const totalSwaps = nonMultiData.reduce(
      (sum, item) => sum + item.total_swaps,
      0
    );
    const totalVolume = nonMultiData.reduce(
      (sum, item) => sum + +item.total_volume_usd,
      0
    );

    const avgFee = nonMultiData.reduce((sum, item) => {
      const volumeRatio = item.total_volume_usd / totalVolume;
      return sum + item.avg_bps * volumeRatio;
    }, 0);

    const volumePerSwap = totalVolume / totalSwaps;

    return [
      {
        name: "Affiliates Collected",
        value: `${formatTrendCurrency(totalAffiliates)}`,
      },
      {
        name: "AVG Fee",
        value: `${formatPercentToString(avgFee)}`,
      },
      {
        name: "Swap Count",
        value: formatTrendNumber(totalSwaps),
      },
      {
        name: "Volume / Count",
        value: `${formatTrendCurrency(volumePerSwap)}`,
      },
    ];
  };

  const formatData = (data: any[]): AffiliateData[] => {
    return data
      .map((item) => {
        return {
          affiliate: mapMissing(item),
          affiliate_fees_usd: +(item.earnings ?? 0),
          total_swaps: +(item.count ?? 0),
          total_volume_usd: +(item.volume ?? 0),
          vc: +(item.volume ?? 0) / +(item.count ?? 1),
          avg_bps: +(item.volume ?? 0)
            ? +(item.earnings ?? 0) / +(item.volume ?? 0)
            : 0,
          multi: item.multi || false,
        };
      })
      .filter((item) => item.affiliate !== "");
  };

  const fetchAffiliateData = async () => {
    try {
      setIsLoading(true);

      if (period === "month") {
        const response = await fetch("/api/affiliate-swaps-by-wallet");
        if (response.ok) {
          const { data } = await response.json();
          const formattedData = formatData(data);
          setAffiliateDataMonthly(formattedData);
          setOverallInfoMonthly(calculateOverallInfo(formattedData));
        }
      } else if (period === "week") {
        const response = await fetch("/api/affiliate-swaps-weekly");
        if (response.ok) {
          const { data } = await response.json();
          const formattedData = formatData(data);
          setAffiliateDataWeekly(formattedData);
          setOverallInfoWeekly(calculateOverallInfo(formattedData));
        }
      } else if (period === "day") {
        const response = await fetch("/api/affiliate-swaps-daily");
        if (response.ok) {
          const { data } = await response.json();
          const formattedData = formatData(data);
          setAffiliateDataDaily(formattedData);
          setOverallInfoDaily(calculateOverallInfo(formattedData));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${period} affiliate data:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (newPeriod === period) return;

    setPeriod(newPeriod);
    router.push(`?period=${newPeriod}`);
    fetchAffiliateData();
  };

  useEffect(() => {
    const urlPeriod = searchParams.get("period");
    if (urlPeriod) {
      setPeriod(urlPeriod);
    } else {
      router.push(`?period=${period}`);
    }
    fetchAffiliateData();
  }, []);

  useEffect(() => {
    fetchAffiliateData();
  }, [period]);

  const getCurrentAffiliateData = () => {
    switch (period) {
      case "month":
        return affiliateDataMonthly;
      case "week":
        return affiliateDataWeekly;
      case "day":
        return affiliateDataDaily;
      default:
        return [];
    }
  };

  const currentAffiliateData = getCurrentAffiliateData();
  const currentOverallInfo = getOverallInfo(period);

  return (
    <div className={styles.leaderboardContainer}>
      <Nav
        activeMode={period}
        navItems={periods}
        preText="Period :"
        onActiveModeChange={handlePeriodChange}
      />

      {/* Only show CardsHeader when data is available and not loading */}
      {!isLoading && currentOverallInfo && currentOverallInfo.length > 0 && (
        <CardsHeader tableGeneralStats={currentOverallInfo} />
      )}

      {/* Show loading state */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading {period} data...</div>
        </div>
      )}

      {/* Only show tables when data is available and not loading */}
      {!isLoading &&
        currentAffiliateData &&
        currentAffiliateData.length > 0 && (
          <>
            {period === "month" && (
              <>
                <AffiliateTables
                  affiliateData={affiliateDataMonthly}
                  isOverview={false}
                  limit={30}
                />
              </>
            )}

            {period === "week" && (
              <>
                <AffiliateTables
                  affiliateData={affiliateDataWeekly}
                  isOverview={false}
                  limit={30}
                />
              </>
            )}

            {period === "day" && (
              <>
                <AffiliateTables
                  affiliateData={affiliateDataDaily}
                  isOverview={false}
                  limit={30}
                />
              </>
            )}
          </>
        )}

      {/* Show message when no data is available */}
      {!isLoading &&
        (!currentAffiliateData || currentAffiliateData.length === 0) && (
          <div className={styles.noDataContainer}>
            <div className={styles.noDataText}>
              No data available for {period} period
            </div>
          </div>
        )}
    </div>
  );
};

export default Leaderboard;
