"use client"
import React from 'react';
import { useParams, useLocation, Routes, Route, Link } from 'react-router-dom';
import AssetIcon from '@/components/AssetIcon';
import Nav from '@/components/Nav';
import Page from '@/components/PageContainer';
import LPPositions from './_poolName/lp';
import Savers from './_poolName/savers';
import Transactions from '@/components/Transactions';

import './PoolPage.module.css';

const PoolPage = () => {
  const { poolName } = useParams();
  const location = useLocation();
  
  const navItems = [
    { link: `/pool/${poolName}`, text: 'Overview' },
    { link: `/pool/${poolName}/lp`, text: 'LP Positions' },
    { link: `/pool/${poolName}/savers`, text: 'Savers' },
    { link: `/pool/${poolName}/txs`, text: 'Txs' },
  ];

  React.useEffect(() => {
    document.title = 'THORChain Network Explorer | Pool stats';
  }, []);

  return (
    <Page>
      {poolName && (
        <div className='pool-header'>
          <div>
            <AssetIcon asset={poolName} />
          </div>
          <div>
            {poolName}
          </div>
        </div>
      )}
      
      <Nav
        isLink={true}
        navItems={navItems}
      />
      
      <Routes>
        <Route path="/" element={<Overview poolName={poolName} />} />
        <Route path="/lp" element={<LPPositions poolName={poolName} />} />
        <Route path="/savers" element={<Savers poolName={poolName} />} />
        <Route path="/txs" element={<Transactions poolName={poolName} />} />
      </Routes>
    </Page>
  );
};

export default PoolPage;