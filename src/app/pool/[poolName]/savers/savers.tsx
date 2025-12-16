"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { getChartColor, getCurrentChartTheme, showAsset } from "@/utils/global";

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
  saversData: {
    filled?: number;
    assetPriceUSD?: number;
    asset?: string;
    earned?: number;
    saversCount?: number;
    saversDepth?: number;
    saversReturn?: number;
    [key: string]: any;
  };
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
  formattedValue?: string;
}

interface TableSortOptions {
  enabled: boolean;
  initialSortBy?: {
    field: string;
    type: "asc" | "desc";
  };
}

const SaversContent: React.FC<SaversContentProps> = ({ saversData }) => {
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
  const [lastBlockHeight, setLastBlockHeight] = useState<number>(0);

  const baseAmountFormatOrZero = useCallback((value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return number(value, "0,0.0000");
  }, []);

  const normalFormat = useCallback((value: number) => {
    if (value === undefined || value === null || isNaN(value)) return "-";
    return number(value, "0,0");
  }, []);

  const formatAddress = useCallback((address: string) => {
    if (!address) return "Unknown";
    if (address.length <= 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  }, []);

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
        sortable: true,
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
        sortable: true,
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
        sortable: true,
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
        sortable: true,
        renderCell: (item: SaverDetail) => (
          <span className="mono">{percent(item.growth_pct, 2)}</span>
        ),
      }),
      createCustomColumn<SaverDetail>("Annualised Yield", {
        sortKey: "APR",
        minWidth: 150,
        className: "mono",
        sortable: true,
        renderCell: (item: SaverDetail) => (
          <span className="mono">{percent(item.APR, 2)}</span>
        ),
      }),
      createCustomColumn<SaverDetail>("Last Height Added", {
        sortKey: "last_add_height",
        minWidth: 150,
        className: "mono",
        sortable: true,
        renderCell: (item: SaverDetail) => (
          <span className="mono">{normalFormat(item.last_add_height)}</span>
        ),
      }),
    ];
  }, [baseAmountFormatOrZero, normalFormat]);

  useEffect(() => {
    if (!poolName) {
      setLoading(false);
      setError("Pool name is required");
      return;
    }
    updateSavers();
  }, [poolName]);

  const calcAPR = useCallback((saverDetail: any): number => {
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
    
    const apr = growthRate * periodPerYear * 100;
    return apr > 0 ? apr : 0;
  }, [lastBlockHeight]);

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
        if (btcChainData?.thorchain) {
          setLastBlockHeight(Number(btcChainData.thorchain));
        }
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

        pieData = topSavers.map((item, index) => ({
          name: item.asset_address || "Unknown",
          value: item.value || 0,
          color: item.color || getChartColor(index, getCurrentChartTheme(theme)),
          formattedValue: formatNumberToString(item.value || 0, { notation: 'compact', currency: 'USD' })
        }));

        if (othersValue > 0) {
          pieData.push({
            name: "Others",
            value: othersValue,
            color: getChartColor(10, getCurrentChartTheme(theme)),
            formattedValue: formatNumberToString(othersValue, { notation: 'compact', currency: 'USD' })
          });
        }
      } else {
        pieData = savers.map((item, index) => ({
          name: item.asset_address || "Unknown",
          value: item.value || 0,
          color: item.color || getChartColor(index, getCurrentChartTheme(theme)),
          formattedValue: formatNumberToString(item.value || 0, { notation: 'compact', currency: 'USD' })
        }));
      }

      console.log("Pie chart data created:", pieData);
      setSaversPie(pieData);
    } catch (error) {
      console.error("Error creating pie chart data:", error);
      setSaversPie([]);
    }
  };

  const totalSaverFormatter = (param: any) => {
    try {
      const address = param.name || param.data?.name || "Unknown";
      const value = param.value || param.data?.value || 0;
      const color = param.color || param.data?.color || "#ccc";

      const formattedValue = formatNumberToString(value, {
        decimalScale: 2,
        notation: "compact",
      });

      return `
        <div class="tooltip-header">
          <div class="data-color" style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></div>
          <span class="address-text">${formatAddress(address)}</span>
        </div>
        <div class="tooltip-body">
          <div class="tooltip-row">
            <span class="tooltip-label">Value:</span>
            <span class="tooltip-value">$${formattedValue}</span>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("Error in formatter:", error);
      return `<div>Error loading tooltip</div>`;
    }
  };

  const sortOptions: TableSortOptions = {
    enabled: true,
    initialSortBy: { field: "asset_deposit_value", type: "desc" },
  };

  const paginationOptions = {
    enabled: true,
    perPage: 50,
    perPageDropdownEnabled: true,
    perPageDropdown: [25, 50, 100],
  };

  const customTheme = {
    HeaderCell: `
      font-weight: 600;
      color: var(--sec-font-color);
      padding: 16px 12px;
      border-bottom: 2px solid var(--border-color);
      
      &:last-child {
        text-align: right;
      }
    `,
    Cell: `
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      color: var(--font-color);
      
      &:last-child {
        text-align: right;
      }
    `,
  };

  if (loading && saverDetails.length === 0) {
    return (
      <div className="savers-content">
        <div className="chart-edition savers-distro">
          <Card title="Address Distribution" isLoading={true} className="inner-pie-chart">
            <div className="chart-placeholder"></div>
          </Card>
          {saversData?.filled != null && (
            <Card title="Savers Cap Filled" isLoading={true} className="savers-filled-card">
              <div className="progress-placeholder"></div>
            </Card>
          )}
        </div>
        <Card>
          <TableLoader cols={columns as any} rows={Array(10).fill({})} />
        </Card>
      </div>
    );
  }

  return (
    <div className="savers-content">
      <div className="chart-edition savers-distro">
        <Card
          title="Address Distribution"
          isLoading={loading && saversPie.length === 0}
          className="inner-pie-chart"
        >
          {error ? (
            <div className="error-message">
              <span>Error: {error}</span>
            </div>
          ) : saversPie.length > 0 ? (
            <PieChart 
              pieData={saversPie} 
              formatter={totalSaverFormatter}
              height="300px"
              showLoading={false}
              showLegend={true}
              legendPosition="bottom"
            />
          ) : (
            <div className="no-data-message">
              <p>No saver data available for this pool</p>
            </div>
          )}
        </Card>
        
        {saversData?.filled != null && (
          <Card title="Savers Cap Filled" className="savers-filled-card">
            <div className="progress-container">
              <Progress width={(saversData.filled || 0) * 100} />
              <div className="progress-info">
                <h4>{percent(saversData.filled || 0, 2)} Total Savers Filled</h4>
                <p className="progress-subtitle">
                  {saversData.asset ? `${showAsset(saversData.asset)} Saver Capacity` : 'Saver Capacity'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
      
      <Card>
        {error ? (
          <div className="table-error">
            <span>Error: {error}</span>
            <button 
              onClick={updateSavers} 
              className="retry-button"
            >
              Retry
            </button>
          </div>
        ) : saverDetails.length > 0 ? (
          <Table
            columns={columns}
            data={saverDetails}
            loading={loading}
            onSortChange={(sortBy: any) => {
              console.log("Sort changed:", sortBy);
            }}
            onRowSelectChange={(selectedRows: any) => {
              console.log("Selected rows:", selectedRows);
            }}
            enableSort={true}
            enableSelect={false}
            pagination={paginationOptions}
            sortOptions={sortOptions}
            customTheme={customTheme}
            className="vgt-table net-table"
            rowKey="asset_address"
          />
        ) : (
          <div className="no-savers-message">
            <p>No savers found for pool: {poolName}</p>
            {poolName && (
              <div className="no-savers-actions">
                <p>Try checking if this pool has savers or try refreshing the page.</p>
                <button 
                  onClick={updateSavers} 
                  className="refresh-button"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SaversContent;