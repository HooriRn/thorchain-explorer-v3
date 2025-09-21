import React from "react";
import LeaderboardCard from "./LeaderboardCard";
import { nameMapping } from "@/lib/utils";
import "./AffiliateLeaderboard.css";
import { formatNumberToString, formatPercentToString } from "@/utils/format";

interface AffiliateData {
  affiliate: string;
  affiliate_fees_usd: number;
  total_swaps: number;
  total_volume_usd: number;
  vc: number;
  avg_bps: number;
  multi?: boolean;
}

interface AffiliateLeaderboardProps {
  affiliateData: AffiliateData[];
  isOverview?: boolean;
  limit?: number;
}

const AffiliateLeaderboard: React.FC<AffiliateLeaderboardProps> = ({
  affiliateData,
  isOverview = false,
  limit = 30,
}) => {
  const getAffiliateNames = (name: string): string => {
    const affiliates = nameMapping[name as keyof typeof nameMapping];
    if (affiliates && affiliates.length > 0) {
      return affiliates.join(",");
    }
    return name;
  };

  return (
    <div className="leaderboard-container">
      <LeaderboardCard
        title=" Affiliate Collected- AVG affiliate bps"
        data={affiliateData}
        sortKey="affiliate_fees_usd"
        limit={limit}
        isLoading={!affiliateData || affiliateData.length === 0}
      >
        {(row) => (
          <>
            {formatNumberToString(row.row.affiliate_fees_usd, "0.00a")}
            <small>- {formatPercentToString(row.row.avg_bps)}</small>
          </>
        )}
      </LeaderboardCard>

      <LeaderboardCard
        title="Swap Volume"
        data={affiliateData}
        sortKey="total_volume_usd"
        limit={limit}
        isLoading={!affiliateData || affiliateData.length === 0}
      >
        {(row) => formatNumberToString(row.row.total_volume_usd, "0.00a")}
      </LeaderboardCard>

      <LeaderboardCard
        title="Swap Count"
        data={affiliateData}
        sortKey="total_swaps"
        limit={limit}
        isLoading={!affiliateData || affiliateData.length === 0}
      >
        {(row) => formatNumberToString(row.row.total_swaps, "0,0")}
      </LeaderboardCard>

      <LeaderboardCard
        title="Volume / Swap Count"
        data={affiliateData}
        sortKey="vc"
        limit={limit}
        isLoading={!affiliateData || affiliateData.length === 0}
      >
        {(row) => formatNumberToString(row.row.vc, "0,0")}
      </LeaderboardCard>
    </div>
  );
};

export default AffiliateLeaderboard;
