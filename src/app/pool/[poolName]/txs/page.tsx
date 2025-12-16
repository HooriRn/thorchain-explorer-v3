"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from "next/navigation";
import Transactions from "@/components/Transactions";
import Pagination from "@/components/Pagination";
import NewPagination from "@/components/NewPagination";
import { getActions } from "@/lib/api";


const PoolTransactions = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const poolName = params?.poolName;
  
  const [transactions, setTransactions] = useState<any>(undefined);
  const [count, setCount] = useState<number>(-1);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [prevPageToken, setPrevPageToken] = useState<string | undefined>(undefined);

  const poolNameString = useMemo(() => {
    if (!poolName) return '';
    if (Array.isArray(poolName)) return poolName[0];
    return poolName;
  }, [poolName]);

  const assetToTrade = (poolAsset: string): string => {
    if (poolAsset.includes('BTC')) return 'BTC.BTC';
    if (poolAsset.includes('ETH')) return 'ETH.ETH';
    if (poolAsset.includes('BNB')) return 'BNB.BNB';
    return 'THOR.RUNE'; 
  };

  const goNext = useCallback(() => {
    if (!nextPageToken || loading) return;

    setLoading(true);
    
    getActions({
      limit: 50,
      asset: poolNameString,
      nextPageToken: nextPageToken,
      prevPageToken: undefined,
      type: 'swap',
    })
      .then((res: any) => {
        if (res?.data) {
          setTransactions(res.data);
          setNextPageToken(res.data.meta?.nextPageToken);
          setPrevPageToken(res.data.meta?.prevPageToken);
          setError(false);
        } else {
          setTransactions(res);
          setNextPageToken(res?.meta?.nextPageToken);
          setPrevPageToken(res?.meta?.prevPageToken);
          setError(false);
        }
      })
      .catch((error: any) => {
        if (error.message === 'cancel') {
          setLoading(true);
          return;
        }
        setError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [nextPageToken, loading, poolNameString]);

  const goPrev = useCallback(() => {
    if (!prevPageToken || loading) return;

    setLoading(true);
    
    getActions({
      limit: 50,
      asset: poolNameString,
      prevPageToken: prevPageToken,
      nextPageToken: undefined,
      type: 'swap',
    })
      .then((res: any) => {
        if (res?.data) {
          setTransactions(res.data);
          setNextPageToken(res.data.meta?.nextPageToken);
          setPrevPageToken(res.data.meta?.prevPageToken);
          setError(false);
        } else {
          setTransactions(res);
          setNextPageToken(res?.meta?.nextPageToken);
          setPrevPageToken(res?.meta?.prevPageToken);
          setError(false);
        }
      })
      .catch((error: any) => {
        if (error.message === 'cancel') {
          setLoading(true);
          return;
        }
        setError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [prevPageToken, loading, poolNameString]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
    getActionsWithOffset((page - 1) * 50);
  }, []);

  const getActionsWithOffset = useCallback((offset: number = 0) => {
    if (!poolNameString) return;
    
    setLoading(true);
    
    const tradeAsset = assetToTrade(poolNameString);
    
    getActions({
      limit: 50,
      offset,
      asset: [poolNameString, tradeAsset].join(','),
      type: 'swap',
    })
      .then((res: any) => {
        if (res?.data) {
          setTransactions(res.data);
          setNextPageToken(res.data.meta?.nextPageToken);
          setPrevPageToken(res.data.meta?.prevPageToken);
          setCount(res.data.count || -1);
          setError(false);
        } else {
          setTransactions(res);
          setNextPageToken(res?.meta?.nextPageToken);
          setPrevPageToken(res?.meta?.prevPageToken);
          setCount(res?.count || -1);
          setError(false);
        }
      })
      .catch((error: any) => {
        if (error.message === 'cancel') {
          setLoading(true);
          return;
        }
        setError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [poolNameString]);

  useEffect(() => {
    if (poolNameString) {
      getActionsWithOffset(0);
    }
  }, [poolNameString, getActionsWithOffset]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam);
      setCurrentPage(page);
      getActionsWithOffset((page - 1) * 50);
    }
  }, [searchParams, getActionsWithOffset]);

  const transactionsData = useMemo(() => {
    return transactions || { actions: [] };
  }, [transactions]);

  return (
    <div>
      <div>
        {error ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            Can't Fetch the actions! Please Try again Later.
          </div>
        ) : (
          <Transactions 
            txs={transactionsData} 
            loading={loading} 
          />
        )}
      </div>
      
      {transactions && transactions.actions && count > -1 ? (
        <NewPagination
          totalRows={count}
          perPage={50}
          currentPage={currentPage}
          onChange={onPageChange}
        />
      ) : transactions && transactions.actions ? (
        <Pagination
          loading={loading}
          meta={transactions}
          onNextPage={goNext}
          onPrevPage={goPrev}
        />
      ) : null}
    </div>
  );
};

export default PoolTransactions;