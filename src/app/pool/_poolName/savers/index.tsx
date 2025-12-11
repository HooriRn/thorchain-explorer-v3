import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { orderBy, sumBy } from 'lodash';
import Address from '@/components/transactions/Address';
import Card from '@/components/ui/Card';
import PieChart from '@/components/PieChart';
import { Progress } from '@/components/ui/progressBar';
import TableLoader from '@/components/TableLoader';
import { Table, TableColumn, createCustomColumn } from '@/components/table';
import { number, percent } from '@/utils/format';
import { showAsset } from '@/utils/global';
import { api } from '@/lib/api';
import './SaversContent.module.css';

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
}

interface SaversContentProps {
  saversData: {
    filled?: number;
    assetPriceUSD?: number;
  };
}

const SaversContent: React.FC<SaversContentProps> = ({ saversData }) => {
  const { poolName } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saverDetails, setSaverDetails] = useState<SaverDetail[]>([]);
  const [saversPie, setSaversPie] = useState<any[]>([]);
  const [lastBlockHeight, setLastBlockHeight] = useState<number>();

  const columns = useMemo((): TableColumn<SaverDetail>[] => {
    return [
      createCustomColumn<SaverDetail>('Address', {
        sortKey: 'asset_address',
        minWidth: 200,
        className: 'mono clickable',
        renderCell: (item: SaverDetail) => (
          <Address address={item.asset_address} />
        ),
      }),
      createCustomColumn<SaverDetail>('Member Deposit', {
        sortKey: 'asset_deposit_value',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_deposit_value)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>('Member Redeem', {
        sortKey: 'asset_redeem_value',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_redeem_value)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>('Earned', {
        sortKey: 'asset_earned',
        minWidth: 120,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {baseAmountFormatOrZero(item.asset_earned)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>('Growth Percentage', {
        sortKey: 'growth_pct',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {percent(item.growth_pct, 2)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>('Annualised Yield', {
        sortKey: 'APR',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {percent(item.APR, 2)}
          </span>
        ),
      }),
      createCustomColumn<SaverDetail>('Last Height Added', {
        sortKey: 'last_add_height',
        minWidth: 150,
        className: 'mono',
        renderCell: (item: SaverDetail) => (
          <span className="mono">
            {normalFormat(item.last_add_height)}
          </span>
        ),
      }),
    ];
  }, []);

  useEffect(() => {
    updateSavers();
  }, [poolName]);

  const updateSavers = async () => {
    setLoading(true);

    try {
      const blockHeightRes = await api.getLastBlockHeight();
      const btcChainData = blockHeightRes.data?.find((e: any) => e.chain === 'BTC');
      setLastBlockHeight(btcChainData?.thorchain);
    } catch (error) {
      setError(true);
      console.error(error);
    }

    try {
      const saversRes = await api.getSavers(poolName);
      const savers = saversRes.data;

      const formattedSaverDetails = orderBy(
        savers,
        [(o) => +o.asset_redeem_value],
        ['desc']
      ).map((saverDetail: any) => {
        const asset_earned = saverDetail.asset_redeem_value - saverDetail.asset_deposit_value;
        const APR = calcAPR(saverDetail);

        return {
          ...saverDetail,
          asset_earned,
          APR,
          value: (saverDetail.asset_redeem_value * (saversData.assetPriceUSD || 0)) / 10 ** 8,
          name: saverDetail.asset_address,
        };
      });

      setSaverDetails(formattedSaverDetails);

      const pieData = formattedSaverDetails.length > 1
        ? [
            ...formattedSaverDetails.slice(0, 10).map(item => ({
              name: item.asset_address,
              value: item.value,
            })),
            {
              name: 'Others',
              value: sumBy(formattedSaverDetails.slice(10), (o: SaverDetail) => o.value),
            },
          ]
        : formattedSaverDetails.map(item => ({
            name: item.asset_address,
            value: item.value,
          }));

      setSaversPie(pieData);
      setLoading(false);
    } catch (e) {
      setError(true);
      console.error(e);
      setLoading(false);
    }
  };

  const calcAPR = (saverDetail: any) => {
    if (!lastBlockHeight) {
      return 0;
    }
    const diffHeight = lastBlockHeight - saverDetail.last_add_height;
    const periodPerYear = 5256000 / diffHeight;
    return (
      (saverDetail.asset_redeem_value / saverDetail.asset_deposit_value - 1) *
      periodPerYear
    );
  };

  const totalSaverFormatter = (param: any) => {
    return `
      <div class="tooltip-header">
        <div class="data-color" style="background-color: ${param.color}"></div>
        ${formatAddress(param.name)}
      </div>
      <div class="tooltip-body">
        <span>
          <span>Value</span>
          <b>$${number(param.value, '0,0.00 a')}</b>
        </span>
      </div>
    `;
  };

  const baseAmountFormatOrZero = (value: number) => {
    if (!value && value !== 0) return '-';
    return number(value, '0,0.0000');
  };

  const normalFormat = (value: number) => {
    return number(value, '0,0');
  };

  const formatAddress = (address: string) => {
    return address;
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

  return (
    <div>
      <div className="chart-edition savers-distro">
        <Card
          title="Address Distribution"
          isLoading={!saverDetails || saverDetails.length === 0}
          className="inner-pie-chart"
        >
          <PieChart pieData={saversPie} formatter={totalSaverFormatter} />
        </Card>
        {saversData.filled !== null && saversData.filled !== undefined && (
          <Card
            title="Savers Cap Filled"
            className="savers-filled-card"
          >
            <ProgressBar width={saversData.filled * 100} />
            <h4>
              {percent(saversData.filled, 2)}
              Total Savers Filled
            </h4>
          </Card>
        )}
      </div>
      <Card>
        {loading ? (
          <TableLoader cols={columns as any} rows={Array(10).fill({})} />
        ) : (
          <Table
            columns={columns}
            data={saverDetails}
            loading={loading}
            onSortChange={(action, state) => {}}
            onRowSelectChange={(action, state) => {}}
            enableSort={true}
            enableSelect={false}
            pagination={{
              enabled: true,
              perPage: 50,
              perPageDropdownEnabled: true,
            }}
            sortOptions={{
              enabled: true,
              initialSortBy: { field: 'asset_deposit_value', type: 'desc' },
            }}
            customTheme={customTheme}
            className="vgt-table net-table"
          />
        )}
      </Card>
    </div>
  );
};

export default SaversContent;