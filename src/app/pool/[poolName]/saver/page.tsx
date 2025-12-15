"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import { useRunePrice} from "@/lib/store";
import CardsHeader from '@/components/CardsHeader';
import {
  formatNumberToString,
  formatPercentToString,
  number,
  formatTrendNumber,
  formatTrendCurrency,
  formatTrendPercentage,
} from "@/utils/format";
import { showAsset} from "@/utils/global";
import { getSaversInfo } from "@/lib/api"; 

const PoolSavers = () => {
  const { poolName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saversExtraData, setSaversExtraData] = useState<any>(null);
  const [saversGeneralStats, setSaversGeneralStats] = useState([
    {
      name: 'Total Earned',
      value: '-',
    },
    {
      name: 'Total Annualised Return',
      value: '-',
    },
    {
      name: 'Savers Count',
      value: '-',
    },
    {
      name: 'Savers Depth',
      value: '-',
    },
  ]);

  const runePrice = useRunePrice();
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

  const computedPoolName = useMemo(() => {
    if (!poolName) return "";
    return Array.isArray(poolName) ? poolName[0] : poolName;
  }, [poolName]);

  const computedSaversGeneralStats = saversGeneralStats.filter((s) => !s.hide);

  useEffect(() => {
    const fetchSaversData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!computedPoolName) {
          setError("Pool name is required");
          setLoading(false);
          return;
        }

        console.log("Fetching savers data for pool:", computedPoolName);
        
        const response = await getSaversInfo();
        
        if (!response?.data) {
          throw new Error("No data received from API");
        }

        const saversExtraData = response.data[computedPoolName]?.savers || response.data;
        
        console.log("Savers data received:", saversExtraData);
        
        if (!saversExtraData || 
            (!saversExtraData.earned && 
             !saversExtraData.saversCount && 
             !saversExtraData.saversDepth)) {
          setError("There are no savers for this pool");
          setSaversExtraData(null);
        } else {
          setSaversExtraData(saversExtraData);
          updateGeneralStats(saversExtraData);
        }
      } catch (error: any) {
        console.error("Error fetching savers data:", error);
        setError(error.message || "Failed to fetch savers data");
        setSaversExtraData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSaversData();

    document.title = 'THORChain Network Explorer | Saver Pool';
  }, [computedPoolName]);

  const updateGeneralStats = (saversExtraData: any) => {
    if (!saversExtraData) {
      return;
    }

    const updatedStats = [
      {
        name: 'Total Earned',
        value: '$' + formatNumberToString(
          (+saversExtraData?.earned * +saversExtraData?.assetPriceUSD) / 1e8 || 0,
          '0,0a'
        ),
        hide: !saversExtraData?.earned,
      },
      {
        name: 'Total Annualised Return',
        value: formatTrendPercentage(saversExtraData.saversReturn, 2) || '0.00%',
      },
      {
        name: 'Savers Count',
        value: formatNumberToString(saversExtraData.saversCount, '0,0') || '0',
      },
      {
        name: 'Savers Depth',
        value: '$' + formatNumberToString(
          (saversExtraData.saversDepth * saversExtraData.assetPriceUSD) / 1e8 || 0,
          '0,0a'
        ),
        extraText: saversExtraData.asset ? `(${formatNumberToString(saversExtraData.saversDepth / 1e8, '0,0.00a')} ${showAsset(saversExtraData.asset)})` : '',
      },
    ];

    setSaversGeneralStats(updatedStats);
  };

  return (
    <div>
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Loading savers data...</p>
        </div>
      ) : error ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#ff6b6b" }}>
          <h4>{error}</h4>
        </div>
      ) : null}
      
      {saversExtraData && (
        <CardsHeader 
          tableGeneralStats={computedSaversGeneralStats} 
          loading={loading}
        />
      )}
      
      {saversExtraData && (
        <div>
          <div style={{ marginTop: "20px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
            <p>Savers content will be displayed here</p>
            <p><strong>Pool:</strong> {computedPoolName}</p>
            <p><strong>Savers Count:</strong> {saversExtraData.saversCount || 0}</p>
            <p><strong>Savers Depth:</strong> {saversExtraData.saversDepth || 0}</p>
            <p><strong>Earned:</strong> {saversExtraData.earned || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolSavers;