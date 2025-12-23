"use client";

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Table } from '@/components/table';
import {
  createTextColumn,
  createNumericColumn,
  createCustomColumn,
} from '@/components/table/utils';
import AssetIcon from '@/components/AssetIcon';
import { getPools, getMemberDetails, getSaverDetails } from '@/lib/api';
import { useRunePrice } from '@/lib/store';
import { number } from '@/utils/format';
import moment from 'moment';
import styles from './LiquidityPoolsTable.module.css';

const LiquidityPoolsTable = ({ address }) => {
  const [type] = useState('saver');
  const [pools, setPools] = useState([]);
  const [lps, setLps] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const runePrice = useRunePrice();

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const poolsData = await getPools();
        setPools(poolsData);

        let allLps = [];

        try {
          const { pools: memberDetails } = await getMemberDetails(address);
          const parsedMemberLps = parseMemberDetails(memberDetails);
          const shares = findShare(poolsData, memberDetails);
          
          const memberLpsWithShares = parsedMemberLps.map((lp, i) => ({
            ...lp,
            ...shares[i]
          }));
          
          allLps = [...allLps, ...memberLpsWithShares];
        } catch (error) {
          console.error('Member not found', error);
        }

        try {
          const { pools: saverDetails } = await getSaverDetails(address);
          const saverLps = parseSaverDetails(saverDetails);
          allLps = [...allLps, ...saverLps];
        } catch (error) {
          console.error('Saver not found', error);
        }

        setLps(allLps);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const numberFormat = (value) => {
    if (!value && value !== 0) return '-';
    return number(value, '0,0.000000');
  };

  const currencyFormat = (value) => {
    if (!value && value !== 0) return '-';
    return number(value, '$0,0.00');
  };

  const percentageFormat = (value, decimals = 4) => {
    if (!value && value !== 0) return '-';
    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  };

  const formatAsset = (pool) => {
    if (!pool) return '';
    const parts = pool.split('.');
    return parts.length > 1 ? parts[1] : pool;
  };

  const showPrice = (row, amount) => {
    if (!amount) return '';
    const price = amount * (row.poolPrice || 0);
    return currencyFormat(price);
  };

  const showAsset = (pool) => {
    if (!pool) return '';
    const parts = pool.split('.');
    return parts.length > 1 ? parts[1] : pool;
  };

  const getPoolPrice = (saverPool) => {
    const poolDetail = pools.find((p) => p.asset === saverPool.pool);
    if (!poolDetail) return 0;
    return Number(poolDetail.assetPriceUSD);
  };

  const getSaverShare = (saverPool) => {
    const poolDetail = pools.find((p) => p.asset === saverPool.pool);
    if (!poolDetail) return 0;
    return Number(saverPool.saverUnits) / Number(poolDetail.saversUnits);
  };

  const parseMemberDetails = (pools) => {
    return pools.map((p) => ({
      ...p,
      poolAdded: [p.runeAdded / 100000000, p.assetAdded / 100000000],
      poolWithdrawn: [p.runeWithdrawn / 100000000, p.assetWithdrawn / 100000000],
      dateFirstAdded: moment.unix(p.dateFirstAdded).fromNow(),
      share: 0,
      poolShare: [],
      poolPrice: getPoolPrice(p),
    }));
  };

  const parseSaverDetails = (saverPools) => {
    return saverPools.map((p) => ({
      ...p,
      poolAdded: [undefined, p.assetDeposit / 1e8],
      poolWithdrawn: [undefined, p.assetWithdrawn / 1e8],
      dateFirstAdded: moment.unix(p.dateFirstAdded).fromNow(),
      share: getSaverShare(p),
      poolShare: [undefined, p.assetRedeem / 1e8],
      poolPrice: getPoolPrice(p),
      label: 'saver',
    }));
  };

  const findShare = (pools, memberDetails) => {
    return memberDetails.map((m, i) => {
      const poolDetail = pools.find((p) => p.asset === m.pool);
      const share = m.liquidityUnits / poolDetail.units;
      const runeAmount = share * poolDetail.runeDepth;
      const assetAmount = share * poolDetail.assetDepth;
      return {
        share,
        poolShare: [+runeAmount / 10e7, +assetAmount / 10e7]
      };
    });
  };

  const tableColumns = [
    createCustomColumn("Pool", {
      sortKey: "pool",
      minWidth: 150,
      renderCell: (item) => (
        <div className={styles.assetCell}>
          <AssetIcon asset={item.pool} />
          <span className={styles.ellipsis}>
            {formatAsset(item.pool)}
          </span>
          {item.label && (
            <div className={styles.bubbleContainer}>
              {item.label}
            </div>
          )}
        </div>
      ),
    }),
    createCustomColumn("Liquidity Share", {
      sortKey: "share",
      minWidth: 120,
      tdClass: "mono",
      renderCell: (item) => (
        <span>
          {item.share !== undefined ? percentageFormat(item.share, 4) : '-'}
        </span>
      ),
    }),
    createCustomColumn("Rune/Asset Redeem", {
      sortKey: "poolShare",
      minWidth: 150,
      tdClass: "mono",
      renderCell: (item) => (
        <div className={styles.poolCell}>
          <span
            title={item.poolShare?.[0] ? showPrice({ poolPrice: runePrice }, item.poolShare[0]) : undefined}
          >
            {item.poolShare?.[0] ? `${numberFormat(item.poolShare[0])} RUNE` : '-'}
          </span>
          <span
            title={item.poolShare?.[1] ? showPrice(item, item.poolShare[1]) : undefined}
            className={styles.ellipsis}
          >
            {item.poolShare?.[1] || item.poolShare?.[1] === 0 
              ? `${numberFormat(item.poolShare[1])} ${showAsset(item.pool)}`
              : '-'
            }
          </span>
        </div>
      ),
    }),
    createCustomColumn("Rune/Asset Added", {
      sortKey: "poolAdded",
      minWidth: 150,
      tdClass: "mono",
      renderCell: (item) => (
        <div className={styles.poolCell}>
          <span
            title={item.poolAdded?.[0] ? showPrice({ poolPrice: runePrice }, item.poolAdded[0]) : undefined}
          >
            {item.poolAdded?.[0] ? `${numberFormat(item.poolAdded[0])} RUNE` : '-'}
          </span>
          <span
            title={item.poolAdded?.[1] ? showPrice(item, item.poolAdded[1]) : undefined}
            className={styles.ellipsis}
          >
            {item.poolAdded?.[1] || item.poolAdded?.[1] === 0 
              ? `${numberFormat(item.poolAdded[1])} ${showAsset(item.pool)}`
              : '-'
            }
          </span>
        </div>
      ),
    }),
    createCustomColumn("Rune/Asset Withdrawn", {
      sortKey: "poolWithdrawn",
      minWidth: 150,
      tdClass: "mono",
      renderCell: (item) => (
        <div className={styles.poolCell}>
          <span
            title={item.poolWithdrawn?.[0] ? showPrice({ poolPrice: runePrice }, item.poolWithdrawn[0]) : undefined}
          >
            {item.poolWithdrawn?.[0] ? `${numberFormat(item.poolWithdrawn[0])} RUNE` : '-'}
          </span>
          <span
            title={item.poolWithdrawn?.[1] ? showPrice(item, item.poolWithdrawn[1]) : undefined}
            className={styles.ellipsis}
          >
            {item.poolWithdrawn?.[1] || item.poolWithdrawn?.[1] === 0 
              ? `${numberFormat(item.poolWithdrawn[1])} ${showAsset(item.pool)}`
              : '-'
            }
          </span>
        </div>
      ),
    }),
    createCustomColumn("First Added", {
      sortKey: "dateFirstAdded",
      minWidth: 120,
      renderCell: (item) => (
        <span>{item.dateFirstAdded}</span>
      ),
    }),
  ];

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
      --data-table-library_grid-gap: 0.5rem;
    `,
  };

  const getRowProps = (item) => ({
    className: styles.tableRow,
  });

  return (
    <Card>
      <Table
        columns={tableColumns}
        data={lps}
        loading={loading}
        onSortChange={(action, state) => {}}
        onRowSelectChange={(action, state) => {}}
        rowProps={getRowProps}
        enableSort={true}
        enableSelect={false}
        customTheme={customTheme}
        className={styles.tableContainer}
      />
    </Card>
  );
};

export default LiquidityPoolsTable;