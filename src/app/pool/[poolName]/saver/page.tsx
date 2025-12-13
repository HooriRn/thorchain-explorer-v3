"use client"

import React, { useState, useEffect } from 'react';
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


const PoolSavers = () => {
  const { poolName } = useParams();
  const [error, setError] = useState(false);
  const [saversExtraData, setSaversExtraData] = useState(undefined);
  const [saversGeneralStats, setSaversGeneralStats] = useState([
    {
      name: 'Total Earned',
    },
    {
      name: 'Total Annualised Return',
    },
    {
      name: 'Savers Count',
    },
    {
      name: 'Savers Depth',
    },
  ]);

  const runePrice = useRunePrice();
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

  const computedSaversGeneralStats = saversGeneralStats.filter((s) => !s.hide);

  useEffect(() => {
    const fetchSaversData = async () => {
      try {
        const response = await api.getSaversInfo(); 
        const saversExtraData = response.data[poolName]?.savers;
        
        if (!saversExtraData) {
          setError(true);
        }
        
        setSaversExtraData(saversExtraData);
        updateGeneralStats(saversExtraData);
      } catch (error) {
        console.error(error);
        setError(true);
      }
    };

    fetchSaversData();

    document.title = 'THORChain Network Explorer | Saver Pool';
  }, [poolName]);

  const updateGeneralStats = (saversExtraData) => {
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
        value: formatTrendPercentage(saversExtraData.saversReturn, 2),
      },
      {
        name: 'Savers Count',
        value: formatNumberToString(saversExtraData.saversCount, '0,0'),
      },
      {
        name: 'Savers Depth',
        value: '$' + formatNumberToString(
          (saversExtraData.saversDepth * saversExtraData.assetPriceUSD) / 1e8 || 0,
          '0,0a'
        ),
        extraText: `(${formatNumberToString(saversExtraData.saversDepth / 1e8, '0,0.00a')} ${showAsset(saversExtraData.asset)})`,
      },
    ];

    setSaversGeneralStats(updatedStats);
  };

  return (
    <div>
      {error ? (
        <div>
          <h4>There are no savers for this pool</h4>
        </div>
      ) : null}
      
      {saversExtraData &&
        (saversExtraData.earned > 0 ||
          saversExtraData.saversCount > 0 ||
          saversExtraData.saversDepth > 0) && (
        <CardsHeader tableGeneralStats={saversGeneralStats} />
      )}
      
      {saversExtraData &&
        (saversExtraData.earned > 0 ||
          saversExtraData.saversCount > 0 ||
          saversExtraData.saversDepth > 0) && (
        <div>
          <Routes>
            <Route 
              path="/*" 
              element={
                React.cloneElement(React.Children.only(children), {
                  saversData: saversExtraData
                })
              } 
            />
          </Routes>
        </div>
      )}
    </div>
  );
};

export default PoolSavers;