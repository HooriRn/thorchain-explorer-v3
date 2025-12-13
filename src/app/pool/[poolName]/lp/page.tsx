"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from "next/navigation";
import {
  useRunePrice,
} from "@/lib/store";
import { orderBy, sumBy } from 'lodash';
import Address from '@/components/transactions/Address';
import CardsHeader from '@/components/CardsHeader';
import Card from '@/components/ui/Card';
import PieChart from '@/components/PieChart';
import TableLoader from '@/components/TableLoader';
import { Table, TableColumn, createCustomColumn } from '@/components/table';
import { formatNumberToString, formatPercentToString } from "@/utils/format";
import { formatAsset, showAsset} from "@/utils/global";
import AssetIcon from '@/components/AssetIcon';
import RuneIcon from '@/assets/images/rune.svg';
import styles from './PoolLP.module.css';

interface LpPositionData {
  position: string;
  rune_addr?: string;
  asset_addr?: string;
  rune_add: string | number;
  asset_add: string | number;
  assetClaimable: number;
  claimableRune: number;
  ownershipPercentage: number;
  last_add_height: string | number;
}

const PoolLP = () => {
  const { poolName } = useParams();
  const [lpPositions, setLpPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const runePrice = useRunePrice();
  const [poolDetail, setPoolDetail] = useState(null);
  const [rows, setRows] = useState<LpPositionData[]>([]);


  const [lpGeneralStats, setLpGeneralStats] = useState([
    {
      name: 'Total Rune Balance',
    },
    {
      name: 'Total Asset Balance',
    },
  ]);

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

  const columns = useMemo((): TableColumn<LpPositionData>[] => {
    return [
      createCustomColumn<LpPositionData>('Position', {
        sortKey: 'position',
        minWidth: 150,
        renderCell: (item: LpPositionData) => (
          <span>{item.position}</span>
        ),
      }),
      createCustomColumn<LpPositionData>('Rune address', {
        sortKey: 'rune_addr',
        minWidth: 200,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <div>
            {item.rune_addr ? (
              <Address address={item.rune_addr} />
            ) : (
              <span>Not Assigned</span>
            )}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>('Asset address', {
        sortKey: 'asset_addr',
        minWidth: 200,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <div>
            {item.asset_addr ? (
              <Address address={item.asset_addr} />
            ) : (
              <span>Not Assigned</span>
            )}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>('Asset added', {
        sortKey: 'asset_add',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.asset_add === 'Not Added' 
              ? 'Not Added' 
              : formatNumber(item.asset_add as number)}
          </span>
        ),
      }),
      createCustomColumn<LpPositionData>('Rune added', {
        sortKey: 'rune_add',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.rune_add === 'Not Added'
              ? 'Not Added'
              : `${runeCur()} ${formatNumber(item.rune_add as number)}`}
          </span>
        ),
      }),
      createCustomColumn<LpPositionData>('Asset Claimable', {
        sortKey: 'assetClaimable',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {formatNumber(item.assetClaimable)}
          </span>
        ),
      }),
      createCustomColumn<LpPositionData>('Rune Claimable', {
        sortKey: 'claimableRune',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <div className={`mono ${styles.cellContent}`}>
            <RuneIcon className={styles.runeCur} />
            {formatNumber(item.claimableRune)}
          </div>
        ),
      }),
      createCustomColumn<LpPositionData>('Ownership', {
        sortKey: 'ownershipPercentage',
        minWidth: 120,
        renderCell: (item: LpPositionData) => (
          <span>{formatPercentToString(item.ownershipPercentage, 3)}</span>
        ),
      }),
      createCustomColumn<LpPositionData>('Last Height added', {
        sortKey: 'last_add_height',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: LpPositionData) => (
          <span className="mono">
            {item.last_add_height === ' '
              ? ' '
              : formatBlock(item.last_add_height as number)}
          </span>
        ),
      }),
    ];
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getLpPositions(poolName)
      .then((res) => {
        setLpPositions(res?.data);
        fetchPoolDetail(res?.data);
      })
      .catch((e) => {
        setError(true);
        console.error('Error fetching LP positions:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [poolName]);

  const fetchPoolDetail = (lpData) => {
    api.getPoolDetail(poolName)
      .then((res) => {
        setPoolDetail(res?.data);
        formatLP(lpData, res?.data);
        updateGeneralStats(res?.data);
      })
      .catch((e) => {
        setError(true);
        console.error('Error fetching pool detail:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const checkPosition = (position) => {
    let pos = '';
    if ('asset_address' in position) {
      pos = 'Asymmetrical Asset';
    }
    if ('rune_address' in position) {
      pos = 'Asymmetrical Rune';
    }
    if ('asset_address' in position && 'rune_address' in position) {
      pos = 'Symmetrical';
    }
    return pos;
  };

  const formatLP = (pos, poolDetail) => {
    if (!poolDetail) return;

    const lpUnits = poolDetail.LP_units;
    const balanceRune = poolDetail.balance_rune;
    const balanceAsset = poolDetail.balance_asset;

    const runeData = [];
    const formattedRows = [];

    for (const i in pos) {
      const userUnits = pos[i]?.units;

      const assetClaimable = ((userUnits / lpUnits) * balanceAsset) / 1e8;
      const claimableRune = ((userUnits / lpUnits) * balanceRune) / 1e8;

      const ownershipPercentage = userUnits / lpUnits;

      formattedRows.push({
        position: checkPosition(pos[i]),
        rune_addr: pos[i]?.rune_address ? pos[i]?.rune_address : undefined,
        asset_addr: pos[i]?.asset_address ? pos[i]?.asset_address : undefined,
        rune_add: pos[i]?.rune_deposit_value
          ? pos[i]?.rune_deposit_value / 10 ** 8
          : 'Not Added',
        asset_add: pos[i]?.asset_deposit_value
          ? pos[i]?.asset_deposit_value / 10 ** 8
          : 'Not Added',
        last_add_height: pos[i]?.last_add_height
          ? pos[i]?.last_add_height
          : ' ',

        assetClaimable,
        claimableRune,
        ownershipPercentage,
      });

      if (claimableRune > 0) {
        runeData.push({
          name: pos[i]?.asset_address || pos[i]?.rune_address,
          value: runePrice * claimableRune * 2,
          ownership: ownershipPercentage,
        });
      }
    }

    setRows(formattedRows);
    createRunePieData(runeData);
  };

  const updateGeneralStats = (poolDetail) => {
    if (poolDetail) {
      const balanceRune = poolDetail.balance_rune;
      const balanceAsset = poolDetail.balance_asset;

      setLpGeneralStats([
        {
          name: 'Balance Rune',
          value: formatNumberToString(balanceRune / 1e8, '0a'),
        },
        {
          name: 'Balance Asset',
          value: formatNumberToString(balanceAsset / 1e8, '0a'),
        },
      ]);
    } else {
      console.error('poolDetail is not defined');
    }
  };

  const createRunePieData = (runeData) => {
    const topRuneData = orderBy(runeData, 'ownership', 'desc').slice(0, 10);
    const othersValue = sumBy(runeData.slice(10), 'value');

    setRunePieData([
      ...topRuneData,
      {
        name: 'Others',
        value: othersValue,
      },
    ]);
  };

  const formatNumber = (number) => {
    return formatNumberToString(number, '0,0.0000');
  };

  const formatBlock = (number) => {
    return formatNumberToString(number, '0,0');
  };

  const formatAddress = (address) => {
    return address;
  };

  const runeCur = () => {
    return 'RUNE';
  };

  const totalRuneFormatter = (param) => {
    return `
      <div class="tooltip-header">
        <div class="data-color" style="background-color: ${param.color}"></div>
        ${formatAddress(param.name)}
      </div>
      <div class="tooltip-body">
        <span>
          <span>Value</span>
          <b>$${formatNumberToString(param.value, '0,0.00 a')}</b>
        </span>
      </div>
    `;
  };

  return (
    <div>
      <CardsHeader tableGeneralStats={lpGeneralStats} />
      <div className={styles.pieChartContainer}>
        <Card
          title="Address Distribution"
          isLoading={!runePieData || runePieData.length === 0}
        >
          <PieChart pieData={runePieData} formatter={totalRuneFormatter} />
        </Card>
      </div>
      <Card className={styles.tableCard}>
        {!error ? (
          <div className={`${styles.baseContainer} ${styles.lpContainer}`}>
            {loading ? (
              <TableLoader cols={columns as any} rows={Array(10).fill({})} />
            ) : (
              <Table
                columns={columns}
                data={rows}
                loading={loading}
                onSortChange={(action, state) => {}}
                onRowSelectChange={(action, state) => {}}
                enableSort={true}
                enableSelect={false}
                customTheme={customTheme}
                className="vgt-table net-table"
              />
            )}
          </div>
        ) : (
          <div className={styles.baseContainer}>
            <span>Can't fetch the pool LPs</span>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PoolLP;