"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import CardsHeader from '@/components/CardsHeader';
import SaversContent from '@/app/pool/[poolName]/savers/savers/page';
import {
  formatNumberToString,
  formatTrendPercentage,
} from "@/utils/format";
import { showAsset } from "@/utils/global";
import { getSaversInfo, getSavers } from "@/lib/api";
import styles from "./Savers.module.css";


interface GeneralStat {
  name: string;
  value: string;
  hide?: boolean;
  extraText?: string;
}

interface SaverData {
  earned: number;
  saversCount: number;
  saversDepth: number;
  saversReturn: number;
  assetPriceUSD: number;
  asset: string;
  filled?: number;
  [key: string]: any;
}

const PoolSavers = () => {
  const { poolName } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saversExtraData, setSaversExtraData] = useState<SaverData | null>(null);
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

  const processSaversData = (saversData: any) => {
    console.log("Processing savers data:", saversData);
    
    const processedData: SaverData = {
      earned: Number(saversData.earned) || 0,
      saversCount: Number(saversData.saversCount) || 0,
      saversDepth: Number(saversData.saversDepth) || 0,
      saversReturn: Number(saversData.saversReturn) || Number(saversData.APR) || 0,
      assetPriceUSD: Number(saversData.assetPriceUSD) || 0,
      asset: saversData.asset || computedPoolName.split('.')[0],
      filled: Number(saversData.filled) || 0,
    };
    
    console.log("Processed data:", processedData);
    
    const hasMeaningfulData = 
      processedData.earned > 0 ||
      processedData.saversCount > 0 ||
      processedData.saversDepth > 0;
    
    console.log("Has meaningful data?", hasMeaningfulData);
    
    if (!hasMeaningfulData) {
      throw new Error("There are no savers for this pool");
    }
    
    setSaversExtraData(processedData);
    updateGeneralStats(processedData);
  };

  const updateGeneralStats = (saversData: SaverData) => {
    if (!saversData) return;

    console.log("Updating general stats with:", saversData);

    const updatedStats: GeneralStat[] = [
      {
        name: 'Total Earned',
        value: saversData.earned > 0 ? 
          '$' + formatNumberToString((saversData.earned * saversData.assetPriceUSD) / 1e8 || 0, '0,0a') : 
          '$0',
        hide: saversData.earned === 0,
      },
      {
        name: 'Total Annualised Return',
        value: formatTrendPercentage(saversData.saversReturn, 2) || '0.00%',
      },
      {
        name: 'Savers Count',
        value: formatNumberToString(saversData.saversCount, '0,0'),
      },
      {
        name: 'Savers Depth',
        value: '$' + formatNumberToString((saversData.saversDepth * saversData.assetPriceUSD) / 1e8 || 0, '0,0a'),
        extraText: saversData.asset ? 
          `(${formatNumberToString(saversData.saversDepth / 1e8, '0,0.00a')} ${showAsset(saversData.asset)})` : '',
      },
    ];

    console.log("Updated stats:", updatedStats);
    setSaversGeneralStats(updatedStats);
  };

  const calculateDataFromSaversList = (saversList: any[], poolName: string): SaverData => {
    let totalEarned = 0;
    let totalDepth = 0;
    
    saversList.forEach((saver: any) => {
      const deposit = Number(saver.asset_deposit_value) || 0;
      const redeem = Number(saver.asset_redeem_value) || 0;
      totalEarned += (redeem - deposit);
      totalDepth += redeem;
    });
    
    
    const asset = poolName.split('.')[0];
    const assetUpper = asset.toUpperCase();
  };

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
        
        try {
          const response = await getSaversInfo();
          console.log("API Response received:", response);
          
          if (!response) {
            console.log("No response from API");
            throw new Error("No data received from API");
          }
          
          console.log("Response type:", typeof response);
          console.log("Is array?", Array.isArray(response));
          
          if (Array.isArray(response)) {
            console.log("Response is an array, length:", response.length);
            
            const poolItem = response.find((item: any) => {
              return item.pool === computedPoolName || 
                     item.asset === computedPoolName ||
                     item.poolName === computedPoolName ||
                     (item.asset && item.asset.toUpperCase() === computedPoolName.toUpperCase());
            });
            
            if (poolItem) {
              console.log("Found pool in array:", poolItem);
              processSaversData(poolItem);
              return;
            } else {
              console.log("Pool not found in array");
              throw new Error(`Pool ${computedPoolName} not found in savers data`);
            }
          }
          
          if (response && typeof response === 'object') {
            console.log("Response is an object, keys:", Object.keys(response));
            
            const responseKeys = Object.keys(response);
            const matchingKey = responseKeys.find(key => 
              key.toUpperCase() === computedPoolName.toUpperCase()
            );
            
            if (matchingKey) {
              console.log(`Found matching key: ${matchingKey}`);
              const poolData = response[matchingKey];
              console.log("Pool data:", poolData);
              
              if (!poolData) {
                throw new Error("No pool data available");
              }
              
              const saversData = poolData.savers || poolData;
              processSaversData(saversData);
              return;
            } else {
              console.log(`Pool ${computedPoolName} not found in object keys`);
              console.log("Available pools:", responseKeys);
              throw new Error(`Pool ${computedPoolName} not found in savers data`);
            }
          }
          
          throw new Error("Invalid response format from API");
          
        } catch (apiError: any) {
          console.error("Error in getSaversInfo:", apiError);
          
          console.log("Trying getSavers as fallback...");
          try {
            const saversResponse = await getSavers(computedPoolName);
            console.log("getSavers response:", saversResponse);
            
            let saversList: any[] = [];
            
            if (Array.isArray(saversResponse)) {
              saversList = saversResponse;
            } else if (saversResponse && typeof saversResponse === 'object') {
              if ('data' in saversResponse && Array.isArray(saversResponse.data)) {
                saversList = saversResponse.data;
              } else if (Array.isArray(saversResponse)) {
                saversList = saversResponse;
              }
            }
            
            console.log("Processed savers list:", saversList);
            
            if (saversList.length > 0) {
              console.log(`Found ${saversList.length} savers in getSavers`);
              
              const fallbackData = calculateDataFromSaversList(saversList, computedPoolName);
              processSaversData(fallbackData);
              return;
            }
            
            throw new Error("There are no savers for this pool");
          } catch (saversError: any) {
            console.error("getSavers also failed:", saversError);
            throw new Error("There are no savers for this pool");
          }
        }
        
      } catch (error: any) {
        console.error("Error fetching savers data:", error);
        setError(error.message || "There are no savers for this pool");
        setSaversExtraData(null);
      } finally {
        setLoading(false);
      }
    };

    if (computedPoolName) {
      fetchSaversData();
    }
  }, [computedPoolName]);

  const renderContent = () => {
    console.log("Render content state:", {
      loading,
      error,
      saversExtraData,
      hasData: saversExtraData && (
        saversExtraData.earned > 0 ||
        saversExtraData.saversCount > 0 ||
        saversExtraData.saversDepth > 0
      )
    });

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
          <p>This pool may not have any savers yet.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!saversExtraData) {
      return (
        <div className="error-container">
          <h4>There are no savers for this pool</h4>
          <p>This pool may not have any savers yet.</p>
        </div>
      );
    }

    const hasMeaningfulData = 
      saversExtraData.earned > 0 ||
      saversExtraData.saversCount > 0 ||
      saversExtraData.saversDepth > 0;

    if (!hasMeaningfulData) {
      return (
        <div className="error-container">
          <h4>There are no savers for this pool</h4>
        </div>
      );
    }

    return (
      <>
        {saversExtraData && (
          <CardsHeader 
            tableGeneralStats={computedSaversGeneralStats} 
            loading={loading}
          />
        )}
        
        <div className="savers-content-wrapper">
          <SaversContent saversData={saversExtraData} />
        </div>
      </>
    );
  };

  return (
    <div className="pool-savers-container">
      {renderContent()}
    </div>
  );
};

export default PoolSavers;