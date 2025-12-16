"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import { useRunePrice } from "@/lib/store";
import CardsHeader from '@/components/CardsHeader';
import SaversContent from '@/app/pool/[poolName]/savers/savers';
import {
  formatNumberToString,
  formatTrendPercentage,
} from "@/utils/format";
import { showAsset } from "@/utils/global";
import { getSaversInfo } from "@/lib/api";

interface GeneralStat {
  name: string;
  value: string;
  hide?: boolean;
  extraText?: string;
}

const PoolSavers = () => {
  const { poolName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saversExtraData, setSaversExtraData] = useState<any>(null);
  const [saversGeneralStats, setSaversGeneralStats] = useState<GeneralStat[]>([
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

  const computedPoolName = useMemo(() => {
    if (!poolName) return "";
    return Array.isArray(poolName) ? poolName[0] : poolName;
  }, [poolName]);

  const computedSaversGeneralStats = useMemo(() => 
    saversGeneralStats.filter((s) => !s.hide),
    [saversGeneralStats]
  );

  useEffect(() => {
    document.title = 'THORChain Network Explorer | Saver Pool';
  }, []);

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

        const saversData = response.data[computedPoolName]?.savers;
        
        console.log("Savers data received:", saversData);
        
        if (!saversData || 
            (!saversData.earned && 
             !saversData.saversCount && 
             !saversData.saversDepth)) {
          setError("There are no savers for this pool");
          setSaversExtraData(null);
        } else {
          setSaversExtraData(saversData);
          updateGeneralStats(saversData);
        }
      } catch (error: any) {
        console.error("Error fetching savers data:", error);
        setError(error.message || "Failed to fetch savers data");
        setSaversExtraData(null);
      } finally {
        setLoading(false);
      }
    };

    if (computedPoolName) {
      fetchSaversData();
    }
  }, [computedPoolName]);

  const updateGeneralStats = (saversData: any) => {
    if (!saversData) return;

    const updatedStats: GeneralStat[] = [
      {
        name: 'Total Earned',
        value: '$' + formatNumberToString(
          (+saversData?.earned * +saversData?.assetPriceUSD) / 1e8 || 0,
          '0,0a'
        ),
        hide: !saversData?.earned,
      },
      {
        name: 'Total Annualised Return',
        value: formatTrendPercentage(saversData.saversReturn, 2) || '0.00%',
      },
      {
        name: 'Savers Count',
        value: formatNumberToString(saversData.saversCount, '0,0') || '0',
      },
      {
        name: 'Savers Depth',
        value: '$' + formatNumberToString(
          (saversData.saversDepth * saversData.assetPriceUSD) / 1e8 || 0,
          '0,0a'
        ),
        extraText: saversData.asset ? 
          `(${formatNumberToString(saversData.saversDepth / 1e8, '0,0.00a')} ${showAsset(saversData.asset)})` : '',
      },
    ];

    setSaversGeneralStats(updatedStats);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading savers data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <h4>{error}</h4>
          <p>Please check the pool name and try again.</p>
        </div>
      );
    }

    if (!saversExtraData) {
      return (
        <div className="no-data-container">
          <h4>No savers data available</h4>
        </div>
      );
    }

    return (
      <>
        <CardsHeader 
          tableGeneralStats={computedSaversGeneralStats} 
          loading={loading}
        />
        
        <div className="savers-content-wrapper">
          <SaversContent saversData={saversExtraData} />
        </div>
      </>
    );
  };

  return (
    <div className="pool-savers-container">
      <div className="nav-pool-header">
        <a href={`/pool/${computedPoolName}`} className="nav-link">
          Pool Overview
        </a>
        <a href={`/savers/${computedPoolName}`} className="nav-link active">
          Savers
        </a>
        <a href={`/swap/${computedPoolName}`} className="nav-link">
          Swaps
        </a>
        <a href={`/liquidity/${computedPoolName}`} className="nav-link">
          Liquidity
        </a>
      </div>

      <div className="pool-header">
        <h1>Savers for {computedPoolName}</h1>
        <p className="pool-subtitle">Track saver deposits, earnings, and distributions</p>
      </div>

      {renderContent()}
    </div>
  );
};

export default PoolSavers;