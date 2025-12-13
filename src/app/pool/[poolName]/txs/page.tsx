"use client"

import api, { getActions } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react"
import Transactions from "@/components/Transactions";
import Pagination from "@/components/Pagination";
import NewPagination from "@/components/NewPagination";



const PoolTransactions = () =>{
const poolName= useParams();
const [txs,setTxs] = useState(undefined);
const [count,setCount] = useState(undefined);
const [offset,setOffset] = useState(undefined);
const [error,setError] = useState(false);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [nextPageToken, setNextPageToken] = useState(undefined);
const [prevPageToken, setPrevPageToken] = useState(undefined);

useEffect( () =>{
  getActions(0);
}, [poolName]);

const goNext = () => {
  api.getACtions({
    limit:50,
    asset: poolName,
    nextPageToken: nextPageToken,
    prevPageToken: prevPageToken,
    type: 'swap',
  })
  .thn((res) =>{
    setTxs(res.data);
    setNextPageToken(res.data.meta?.nextPageToken);
    setPrevPageToken(res.data.meta?.setPrevPageToken);
    setError(false);
    setLoading(false);
  })
.catch((error) =>{
  if (error.message  === 'cancel'){
    setLoading(true);
    return;
  }
  setError(true);
  console.error(error)
});
}

const goPrev = () => {
  api.getActions({
    limit: 50,
    asset: poolName,
    prevPageToken: prevPageToken,
    nextPageToken: undefined,
    type: 'swap',
  })
  .then((res) => {
    setTxs(res.data);
    setNextPageToken(res.data.meta?.nextPageToken);
    setPrevPageToken(res.data.meta?.prevPageToken);
    setError(false);
    setLoading(false); 
  })
  .catch((error) => {
    if (error.message === 'cancel') {
      setLoading(true); 
      return;
    }
    setError(true);
    console.error(error);
  });
};
const onPageChange = (page) => {
  setCurrentPage(page);
  getActions((page - 1) * 50);
};

const getActions = (offset = 0) => {
  setLoading(true); 
  setOffset(offset);
  
  const tradeAsset = assetToTrade(poolName);
  
  api.getActions({
    limit: 50,
    offset,
    asset: [poolName, tradeAsset].join(','),
    type: 'swap',
  })
  .then((res) => {
    setTxs(res.data);
    setNextPageToken(res.data.meta?.nextPageToken);
    setPrevPageToken(res.data.meta?.prevPageToken);
    setCount(res.data.count);
    setError(false);
    setLoading(false);
  })
  .catch((error) => {
    if (error.message === 'cancel') {
      setLoading(true);
      return;
    }
    setError(true);
    console.error(error);
  });
};

return (
  <div>
    <div>
      {error ? (
        <div className="error-container">
          Can't Fetch the actions! Please Try again Later.
        </div>
      ) : (
        <Transactions txs={txs} loading={loading} />
      )}
    </div>
    
    {txs && txs.actions && count > -1 ? (
      <NewPagination
        totalRows={count}
        perPage={50}
        currentPage={currentPage}
        onChange={onPageChange}
      />
    ) : txs && txs.actions ? (
      <Pagination
        loading={loading}
        meta={txs?.actions}
        onNextPage={goNext}
        onPrevPage={goPrev}
      />
    ) : null}
  </div>
);
};

export default PoolTransactions;