"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { orderBy, sumBy } from "lodash";
import Card from "@/components/ui/Card";
import PieChart from "@/components/PieChart";
import { Progress } from "@/components/ui/progressBar";
import TableLoader from "@/components/TableLoader";
import { Table, TableColumn, TableData } from "@/components/table";
import Address from "@/components/transactions/Address";
import Avatar from "@/components/Avatar";
import { number, formatTrendPercentage, formatNumberToString } from "@/utils/format";
import { getLastBlockHeight, getSavers } from "@/lib/api";
import { useTheme } from "@/lib/store";
import { getChartColor, getCurrentChartTheme, showAsset, addressFormatV2 } from "@/utils/global";

interface SaverDetail extends TableData {
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
  ownership?: number;
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

  const columns = useMemo((): TableColumn<SaverDetail>[] => {
    return [
      {
        label: "Address",
        sortKey: "asset_address",
        renderCell: (item: SaverDetail) => (
          <div className="address-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar name={item.asset_address} small={true} />
            <Address address={item.asset_address} useCustomName={true} />
          </div>
        ),
      },
      {
        label: "Member Deposit",
        sortKey: "asset_deposit_value",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{number(item.asset_deposit_value, "0,0.0000")}</span>
        ),
      },
      {
        label: "Member Redeem",
        sortKey: "asset_redeem_value",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{number(item.asset_redeem_value, "0,0.0000")}</span>
        ),
      },
      {
        label: "Earned",
        sortKey: "asset_earned",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{number(item.asset_earned, "0,0.0000")}</span>
        ),
      },
      {
        label: "Growth Percentage",
        sortKey: "growth_pct",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{formatTrendPercentage(item.growth_pct, 2)}</span>
        ),
      },
      {
        label: "Annualised Yield",
        sortKey: "APR",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{formatTrendPercentage(item.APR, 2)}</span>
        ),
      },
      {
        label: "Last Height Added",
        sortKey: "last_add_height",
        className: "mono",
        renderCell: (item: SaverDetail) => (
          <span>{number(item.last_add_height, "0,0")}</span>
        ),
      },
    ];
  }, []);

  const formatAddress = useCallback((address: string) => {
    if (!address) return "Unknown";
    return addressFormatV2(address);
  }, []);

  useEffect(() => {
    if (!poolName || !saversData) {
      setLoading(false);
      setError("Pool data is required");
      return;
    }
    updateSavers();
  }, [poolName, saversData]);

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
    
    return growthRate * periodPerYear;
  }, [lastBlockHeight]);

  const createSaversPieData = (saversList: SaverDetail[]): PieChartData[] => {
    if (saversList.length === 0) return [];
    
    const totalValue = sumBy(saversList, 'value');
    
    const topSavers = orderBy(saversList, 'value', 'desc').slice(0, 10);
    const othersValue = sumBy(saversList.slice(10), 'value');
    
    const pieData: PieChartData[] = [
      ...topSavers.map((item, index) => ({
        name: item.asset_address,
        value: item.value,
        ownership: item.value / totalValue,
        color: getChartColor(index, getCurrentChartTheme(theme))
      })),
      ...(othersValue > 0 ? [{
        name: 'Others',
        value: othersValue,
        ownership: othersValue / totalValue,
        color: getChartColor(10, getCurrentChartTheme(theme))
      }] : [])
    ];
    
    return pieData;
  };

  const totalSaverFormatter = (param: any) => {
    const formatNumber = (value: number) => {
      return formatNumberToString(value, {
        decimalScale: 2,
        notation: "compact",
      });
    };

    const color = param.color || '#ccc';
    const value = param.value || param.data?.value || 0;
    const address = param.name || param.data?.name || "Unknown";
    const ownership = param.ownership || param.data?.ownership || 0;
    
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
        ${ownership > 0 ? `
        <span>
          <span>Ownership</span>
          <b>${formatTrendPercentage(ownership * 100, 2)}</b>
        </span>
        ` : ''}
      </div>
    `;
  };

  const updateSavers = async () => {
    setLoading(true);
    setError(null);

    try {
      let blockHeight = 0;
      try {
        const blockHeightResult = await getLastBlockHeight();
        console.log("Block height response:", blockHeightResult);
        
        let data = blockHeightResult;
        if (blockHeightResult && typeof blockHeightResult === 'object' && 'data' in blockHeightResult) {
          data = blockHeightResult.data;
        }
        
        if (data) {
          const btcChainData = Array.isArray(data) 
            ? data.find((e: any) => e.chain === "BTC")
            : null;
          if (btcChainData?.thorchain) {
            blockHeight = Number(btcChainData.thorchain);
            setLastBlockHeight(blockHeight);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch block height:", err);
      }

      const saversResult = await getSavers(poolName);
      console.log("Savers result:", saversResult);
      
      let savers: any[] = [];
      
      if (Array.isArray(saversResult)) {
        savers = saversResult;
      } else if (saversResult && typeof saversResult === 'object') {
        if ('data' in saversResult && Array.isArray(saversResult.data)) {
          savers = saversResult.data;
        } else if (Array.isArray(saversResult)) {
          savers = saversResult;
        }
      }
      
      console.log("Processed savers:", savers);
      
      if (savers.length === 0) {
        console.log("No savers found for pool:", poolName);
        setSaverDetails([]);
        setSaversPie([]);
        setLoading(false);
        return;
      }

      const formattedSaverDetails: SaverDetail[] = orderBy(
        savers,
        [(o) => Number(o.asset_redeem_value || 0)],
        ['desc']
      ).map((saverDetail: any, index: number) => {
        const depositValue = Number(saverDetail.asset_deposit_value || 0);
        const redeemValue = Number(saverDetail.asset_redeem_value || 0);
        const asset_earned = redeemValue - depositValue;
        const growth_pct = depositValue > 0 ? (asset_earned / depositValue) * 100 : 0;
        
        const APR = calcAPR({ ...saverDetail, last_add_height: saverDetail.last_add_height });

        const value = (redeemValue * (saversData?.assetPriceUSD || 0)) / 10 ** 8;

        return {
          id: `${saverDetail.asset_address}_${index}`,
          asset_address: saverDetail.asset_address,
          asset_deposit_value: depositValue,
          asset_redeem_value: redeemValue,
          asset_earned,
          growth_pct,
          APR,
          last_add_height: saverDetail.last_add_height,
          asset: saversData?.asset || poolName.split('.')[0],
          value,
          name: saverDetail.asset_address,
        };
      });

      console.log("Formatted saver details:", formattedSaverDetails);
      setSaverDetails(formattedSaverDetails);
      
      const pieData = createSaversPieData(formattedSaverDetails);
      console.log("Pie chart data:", pieData);
      setSaversPie(pieData);
      setLoading(false);
      
    } catch (error: any) {
      console.error("Error loading savers data:", error);
      setError(error.message || "Failed to load savers details");
      setLoading(false);
    }
  };

  if (!saversData || saversData.saversCount === 0) {
    return (
      <div className="savers-content">
        <Card>
          <div className="no-savers-message">
            <p>No savers found for this pool</p>
          </div>
        </Card>
      </div>
    );
  }

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
          <TableLoader
            cols={columns.map(col => ({
              label: col.label,
              field: col.sortKey || col.label.toLowerCase(),
              type: "text"
            }))}
          />
        </Card>
      </div>
    );
  }

  const progressPercentage = Math.round((saversData.filled || 0) * 100);

  const pieChartExtra = {
    center: ["50%", "50%"],
    label: {
      show: true,
      position: "outside",
      formatter: function (params: any) {
        const name = params.name;
        return addressFormatV2(name);
      },
      fontSize: 12,
      color: theme === "dark" || theme === "BlueElectra" ? "#e6e6e6" : "#333333",
    },
    labelLine: {
      show: true,
      length: 15,
      length2: 10,
      lineStyle: {
        color: theme === "dark" || theme === "BlueElectra" ? "#999999" : "#cccccc",
        width: 1,
      },
    },
  };

  return (
    <div className="savers-content">
      <div className="chart-edition savers-distro">
        <Card
          title="Address Distribution"
          isLoading={loading && saversPie.length === 0}
          className="inner-pie-chart"
        >
          {saversPie.length > 0 ? (
            <PieChart 
              pieData={saversPie} 
              formatter={totalSaverFormatter}
              height="300px"
              showLoading={false}
              showLegend={false}
              extra={pieChartExtra}
            />
          ) : (
            <div className="no-data-message">
              <p>No saver data available for chart</p>
            </div>
          )}
        </Card>
        
        {saversData?.filled != null && (
          <Card title="Savers Cap Filled" className="savers-filled-card">
            <div className="progress-container">
              <div className="progress-wrapper" style={{ marginBottom: '10px' }}>
                <Progress
                  width={progressPercentage}
                  height="12px"
                  color="var(--primary)"
                  className="savers-progress-bar"
                />
              </div>
              <h4 style={{ textAlign: 'center', margin: '0' }}>
                {formatTrendPercentage(saversData.filled || 0, 2)}
                <span style={{ fontSize: '0.9em', color: 'var(--font-color-secondary)' }}>
                  Total Savers Filled
                </span>
              </h4>
            </div>
          </Card>
        )}
      </div>
      
      <Card>
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={updateSavers} className="retry-button">
              Retry
            </button>
          </div>
        ) : saverDetails.length > 0 ? (
          <Table
            columns={columns}
            data={saverDetails}
            loading={loading}
            enableSort={true}
            enableSelect={false}
            className="vgt-table net-table"
            onSortChange={(sortKey, sortDirection) => {
              console.log("Sort changed:", sortKey, sortDirection);
            }}
            onRowSelectChange={(selectedRows) => {
              console.log("Selected rows:", selectedRows);
            }}
          />
        ) : (
          <div className="no-savers-message">
            <p>No savers found for pool: {poolName}</p>
            <button onClick={updateSavers} className="refresh-button">
              Refresh
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SaversContent;