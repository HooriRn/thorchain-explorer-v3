"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { orderBy, sumBy } from "lodash";
import Address from "@/components/transactions/Address";
import Card from "@/components/ui/Card";
import PieChart from "@/components/PieChart";
import { Progress } from "@/components/ui/progressBar";
import TableLoader from "@/components/TableLoader";
import { Table, TableColumn, createCustomColumn } from "@/components/table";
import { number, percent, formatNumberToString } from "@/utils/format";
import { getLastBlockHeight, getSavers } from "@/lib/api";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme } from "@/utils/global";

interface SaverDetail {
  asset_address: string;
  asset_deposit_value: number;
  asset_redeem_value: number;
  asset_earned: number;
  growth_pct: number;
  APR: number;
  last_add_height: number;
  asset: string;
  value: number;
  name: string;
  color?: string;
}

interface SaversContentProps {
  saversData?: {
    filled?: number;
    assetPriceUSD?: number;
  };
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

const SaversContent: React.FC<SaversContentProps> = ({ saversData = {} }) => {
  const params = useParams();
  const theme = useTheme();
  
  const poolName = useMemo(() => {
    if (!params?.poolName) return "";
    return Array.isArray(params.poolName) ? params.poolName[0] : params.poolName;
  }, [params?.poolName]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saverDetails, setSaverDetails] = useState<SaverDetail[]>([]);
  const [saversPie, setSaversPie] = useState<PieChartData[]>([]);
  const [lastBlockHeight, setLastBlockHeight] = useState<number>();

  const columns = useMemo((): TableColumn<SaverDetail>[] => {
    return [
      createCustomColumn<SaverDetail>("Address", {
        sortKey: "asset_address",
        minWidth: 200,
        className: "mono clickable",
        renderCell: (item: SaverDetail) => (
          <Address address={item.asset_address} />
        ),
      }),
      createCustomColumn<SaverDetail>("Member Deposit", {
        sortKey: "asset_deposit_value",
        minWidth: 150,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_deposit_value)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>("Member Redeem", {
        sortKey: "asset_redeem_value",
        minWidth: 150,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_redeem_value)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>("Earned", {
        sortKey: "asset_earned",
        minWidth: 120,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_earned)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>("Growth Percentage", {
        sortKey: "growth_pct",
        minWidth: 150,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">{percent(item.growth_pct, 2)}</span>
        ),
      }),
      createCustomColumn<SaverDetail>("Annualised Yield", {
        sortKey: "APR",
        minWidth: 150,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">{percent(item.APR, 2)}</span>
        ),
      }),
      createCustomColumn<SaverDetail>("Last Height Added", {
        sortKey: "last_add_height",
        minWidth: 150,
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span className="mono">{normalFormat(item.last_add_height)}</span>
        ),
      }),
    ];
  }, []);

  useEffect(() => {
    if (!poolName) {
      setLoading(false);
      setError("Pool name is required");
      return;
    }
    updateSavers();
  }, [poolName]);

  const updateSavers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching data for pool:", poolName);

      const [blockHeightResult, saversResult] = await Promise.all([
        getLastBlockHeight().catch(err => {
          console.warn("Failed to fetch block height:", err);
          return null;
        }),
        getSavers(poolName).catch(err => {
          console.error("Failed to fetch savers:", err);
          throw new Error(`Failed to fetch savers: ${err.message}`);
        })
      ]);

      if (blockHeightResult?.data) {
        const btcChainData = Array.isArray(blockHeightResult.data) 
          ? blockHeightResult.data.find((e: any) => e.chain === "BTC")
          : null;
        setLastBlockHeight(btcChainData?.thorchain);
        console.log("Block height data:", btcChainData);
      }

      if (!saversResult?.data) {
        throw new Error("No savers data received");
      }

      const savers = Array.isArray(saversResult.data) ? saversResult.data : [];
      console.log("Savers data received:", savers.length, "items");

      if (savers.length === 0) {
        setSaverDetails([]);
        setSaversPie([]);
        setLoading(false);
        return;
      }

      formatSaversData(savers);
    } catch (error: any) {
      console.error("Error loading savers data:", error);
      setError(error.message || "Failed to load savers data");
      setLoading(false);
    }
  };

  const formatSaversData = (savers: any[]) => {
    try {
      console.log("Formatting savers data:", savers.length);

      const formattedSaverDetails = orderBy(
        savers,
        [(o) => Number(o.asset_redeem_value || 0)],
        ["desc"]
      ).map((saverDetail: any, index: number) => {
        const depositValue = Number(saverDetail.asset_deposit_value || 0);
        const redeemValue = Number(saverDetail.asset_redeem_value || 0);
        const asset_earned = redeemValue - depositValue;
        const growth_pct = depositValue > 0 ? (asset_earned / depositValue) * 100 : 0;
        
        const APR = calcAPR(saverDetail);
        const color = getChartColor(
          Math.min(index, 6),
          getCurrentChartTheme(theme)
        );

        const value = (redeemValue * (saversData?.assetPriceUSD || 0)) / 10 ** 8;

        return {
          ...saverDetail,
          asset_deposit_value: depositValue,
          asset_redeem_value: redeemValue,
          asset_earned,
          growth_pct,
          APR,
          value,
          name: saverDetail.asset_address || `Saver ${index + 1}`,
          color,
        };
      });

      console.log("Formatted saver details:", formattedSaverDetails);
      setSaverDetails(formattedSaverDetails);
      createPieChartData(formattedSaverDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error formatting savers data:", error);
      setError("Error processing savers data");
      setLoading(false);
    }
  };

  const createPieChartData = (savers: SaverDetail[]) => {
    try {
      let pieData: PieChartData[] = [];

      if (savers.length === 0) {
        setSaversPie([]);
        return;
      }

      if (savers.length > 1) {
        const topSavers = savers.slice(0, 10);
        const othersValue = sumBy(savers.slice(10), (o: SaverDetail) => o.value || 0);

        pieData = [
          ...topSavers.map((item) => ({
            name: item.asset_address || "Unknown",
            value: item.value || 0,
            color: item.color,
          })),
        ];

        if (othersValue > 0) {
          pieData.push({
            name: "Others",
            value: othersValue,
            color: getChartColor(6, getCurrentChartTheme(theme)),
          });
        }
      } else {
        pieData = savers.map((item) => ({
          name: item.asset_address || "Unknown",
          value: item.value || 0,
          color: item.color,
        }));
      }

      console.log("Pie chart data created:", pieData);
      setSaversPie(pieData);
    } catch (error) {
      console.error("Error creating pie chart data:", error);
      setSaversPie([]);
    }
  };

  const calcAPR = (saverDetail: any) => {
    if (!lastBlockHeight || !saverDetail.last_add_height) {
      return 0;
    }
    
    const lastAddHeight = Number(saverDetail.last_add_height);
    if (!lastAddHeight) return 0;
    
    const diffHeight = lastBlockHeight - lastAddHeight;
    if (diffHeight <= 0) return 0;
    
    const depositValue = Number(saverDetail.asset_deposit_value || 0);
    const redeemValue = Number(saverDetail.asset_redeem_value || 0);
    
    if (depositValue <= 0) return 0;
    
    const growthRate = (redeemValue / depositValue) - 1;
    const periodPerYear = 5256000 / diffHeight;
    
    return growthRate * periodPerYear * 100; 
  };

  const totalSaverFormatter = (param: any) => {
    try {
      const formatNumber = (value: number) => {
        return formatNumberToString(value || 0, {
          decimalScale: 2,
          notation: "compact",
        });
      };

      const address = param.name || param.data?.name || "Unknown";
      const value = param.value || param.data?.value || 0;
      const color = param.color || param.data?.color || "#ccc";

      return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${color}"></div>
          ${formatAddress(address)}
        </div>
        <div class="tooltip-body">
          <span>
            <span>Value</span>
            <b>$${formatNumber(value)}</b>
          </span>
        </div>
      `;
    } catch (error) {
      console.error("Error in formatter:", error);
      return `<div>Error loading tooltip</div>`;
    }
  };

  const baseAmountFormatOrZero = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return number(value, "0,0.0000");
  };

  const normalFormat = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return number(value, "0,0");
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return address.length > 20 ? `${address.substring(0, 10)}...${address.substring(address.length - 10)}` : address;
  };

  const customTheme = {
    HeaderCell: `
      &:last-child {
        text-align: right;
      }
    `,
    Cell: `
      &:last-child {
        text-align: right;
      }
    `,
  };

  console.log("Component state:", {
    loading,
    error,
    saverDetailsCount: saverDetails.length,
    saversPieCount: saversPie.length,
    poolName,
    hasSaversData: !!saversData,
  });

  return (
    <div>
      <div className="chart-edition savers-distro">
        <Card
          title="Address Distribution"
          isLoading={loading}
          className="inner-pie-chart"
        >
          {error ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#ff6b6b" }}>
              <span>Error: {error}</span>
            </div>
          ) : loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <span>Loading chart data...</span>
            </div>
          ) : saversPie.length > 0 ? (
            <PieChart 
              pieData={saversPie} 
              formatter={totalSaverFormatter}
              height="200px"
              showLoading={false}
              showLegend={false}
            />
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
              <p>No saver data available for this pool</p>
            </div>
          )}
        </Card>
        
        {saversData?.filled != null && (
          <Card title="Savers Cap Filled" className="savers-filled-card">
            <Progress width={(saversData.filled || 0) * 100} />
            <h4>
              {percent(saversData.filled || 0, 2)}
              Total Savers Filled
            </h4>
          </Card>
        )}
      </div>
      
      <Card>
        {error ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <span style={{ color: "#ff6b6b" }}>Error: {error}</span>
          </div>
        ) : loading ? (
          <TableLoader cols={columns as any} rows={Array(10).fill({})} />
        ) : saverDetails.length > 0 ? (
          <Table
            columns={columns}
            data={saverDetails}
            loading={loading}
            onSortChange={() => {}}
            onRowSelectChange={() => {}}
            enableSort={true}
            enableSelect={false}
            pagination={{
              enabled: true,
              perPage: 50,
              perPageDropdownEnabled: true,
            }}
            sortOptions={{
              enabled: true,
              initialSortBy: { field: "asset_deposit_value", type: "desc" },
            }}
            customTheme={customTheme}
            className="vgt-table net-table"
          />
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            <p>No savers found for pool: {poolName}</p>
            {poolName && <p style={{ fontSize: "0.9em", marginTop: "10px" }}>
              Try checking if this pool has savers or try refreshing the page.
            </p>}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SaversContent;