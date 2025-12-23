"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Table } from '@/components/table';
import {
  createTextColumn,
  createNumericColumn,
  createCustomColumn,
} from '@/components/table/utils';
import TableLoader from '@/components/TableLoader';
import Address from "@/components/transactions/Address";
import AssetIcon from '@/components/AssetIcon';
import { formatRune, baseChainAsset } from '@/utils/global';
import { getRevThorname, getThorname } from '@/lib/api';

const ThornamesTable = ({ address }) => {
  const [loading, setLoading] = useState(true);
  const [thornames, setThornames] = useState([]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const checkThornameAddresses = async (names) => {
    if (!names || names.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const promises = names.map(async (n) => {
        try {
          const res = await getThorname(n);
          return {
            name: res?.name,
            owner: res?.owner,
            affiliate_collector_rune: res?.affiliate_collector_rune,
            preferred_asset: res?.preferred_asset,
            expire_block_height: res?.expire_block_height,
            aliases: res?.aliases,
          };
        } catch (error) {
          console.error(`Error fetching thorname ${n}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .filter(item => item !== null);

      setThornames(successfulResults);
    } catch (error) {
      console.error('Error checking thorname addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const rlookThorname = async () => {
    try {
      const res = await getRevThorname(address);
      const names = res;
      await checkThornameAddresses(names);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching reverse thorname:', error);
    }
  };

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    rlookThorname();
  }, [address]);

  const customTheme = {
    Table: `
      --data-table-library_grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
      --data-table-library_grid-gap: 0.5rem;
    `,
  };

  const getRowProps = (item) => ({
    className: styles.tableRow,
  });

  const tableColumns = [
    createCustomColumn("Name", {
      sortKey: "name",
      minWidth: 120,
      renderCell: (item) => (
        <span className="mono">{item.name}</span>
      ),
    }),
    createCustomColumn("Owner", {
      sortKey: "owner",
      minWidth: 200,
      renderCell: (item) => (
        <Address address={item.owner} />
      ),
    }),
    createCustomColumn("Affiliate Collector", {
      sortKey: "affiliate_collector_rune",
      minWidth: 150,
      renderCell: (item) => (
        <span className="mono">{formatRune(item.affiliate_collector_rune)}</span>
      ),
    }),
    createCustomColumn("Preferred Asset", {
      sortKey: "preferred_asset",
      minWidth: 120,
      renderCell: (item) => (
        <span className="mono">{item.preferred_asset || '-'}</span>
      ),
    }),
    createCustomColumn("Expire Block", {
      sortKey: "expire_block_height",
      minWidth: 120,
      renderCell: (item) => (
        <Link
          href={`/block/${item.expire_block_height}`}
          className={`mono clickable ${styles.blockLink}`}
        >
          {formatNumber(item.expire_block_height)}
        </Link>
      ),
    }),
    createCustomColumn("Aliases", {
      sortKey: "aliases",
      minWidth: 200,
      renderCell: (item) => {
        if (item.aliases && item.aliases.length > 0) {
          return (
            <div className={styles.aliasesContainer}>
              {item.aliases.map((al) => (
                <div key={`asset-${al.chain}`} className={styles.miniBubble}>
                  <AssetIcon
                    asset={baseChainAsset(al.chain)}
                    height="1.2rem"
                  />
                  <Address address={al.address} />
                </div>
              ))}
            </div>
          );
        }
        return <span className={`${styles.miniBubble} ${styles.yellowBubble}`}>No Aliases</span>;
      },
    }),
  ];

  if (loading) {
    return (
      <Card>
        <TableLoader cols={6} rows={5} />
      </Card>
    );
  }

  return (
    <>
      <Card title="THORNames">
        <Table
          columns={tableColumns}
          data={thornames || []}
          loading={false}
          onSortChange={(action, state) => {}}
          onRowSelectChange={(action, state) => {}}
          rowProps={getRowProps}
          enableSort={true}
          enableSelect={false}
          customTheme={customTheme}
          className={styles.tableContainer}
        />
      </Card>

      {thornames.length === 0 && (
        <div className={styles.noDataMessage}>
          <span>NO THORName</span>
        </div>
      )}
    </>
  );
};

export default ThornamesTable;