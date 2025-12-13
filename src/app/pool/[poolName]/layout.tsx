"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import AssetIcon from "@/components/AssetIcon";
import Nav from "@/components/Nav";
import styles from './PoolPage.module.css';

export default function PoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { poolName } = useParams<{ poolName: string }>();
  const pathname = usePathname();

  useEffect(() => {
    document.title = "THORChain Network Explorer | Pool stats";
  }, []);

  if (!poolName) return null;

  const getActiveMode = () => {
    if (pathname === `/pool/${poolName}`) return "overview";
    if (pathname === `/pool/${poolName}/lp`) return "lp";
    if (pathname === `/pool/${poolName}/savers`) return "savers";
    if (pathname === `/pool/${poolName}/txs`) return "txs";
    return "overview";
  };

  const navItems = [
    { 
      mode: "overview", 
      text: "Overview", 
      link: `/pool/${poolName}` 
    },
    { 
      mode: "lp", 
      text: "LP Positions", 
      link: `/pool/${poolName}/lp` 
    },
    { 
      mode: "savers", 
      text: "Savers", 
      link: `/pool/${poolName}/savers` 
    },
    { 
      mode: "txs", 
      text: "Txs", 
      link: `/pool/${poolName}/txs` 
    },
  ];

  return (
    <div className={styles['pool-container']}>
      <div className={styles['pool-header']}>
        <div className={styles['pool-icon']}>
          <AssetIcon asset={poolName} />
        </div>
        <div className={styles['pool-name']}>{poolName}</div>
      </div>

      <Nav 
        isLink={true} 
        navItems={navItems}
        activeMode={getActiveMode()}
        className={styles['pool-nav']}
      />

      <div className={styles['pool-content']}>{children}</div>
    </div>
  );
}