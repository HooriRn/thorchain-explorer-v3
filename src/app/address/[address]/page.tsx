"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getBalance, getActions, getAsgard, getThorPools, getContractsLabel } from "@/lib/api";
import {  assetFromString } from "@/utils";
import { baseAmountFormat, amountToUSD, formatCurrency, baseChainAsset, addressFormatV2, formatAsset } from "@/utils/global";
import { formatVueNumber } from "@/utils/format";
import Page from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import Avatar from "@/components/Avatar";
import Copy from "@/components/Copy";
import QrBtn from "@/components/QrBtn";
import AdvancedFilter from "../../txs/components/AdvancedFilter";
import InfoCard from "@/components/InfoCard";
import Pagination from "@/components/Pagination";
import NewPagination from "@/components/NewPagination";
import Table from "@/components/table/Table";
import AssetIcon from "@/components/AssetIcon";
import Link from "next/link";
import styles from "./address.module.css";

import Balance from "../components/balance/balance";
import BalanceHistory from "../components/balancehistory/balanceHistory";


const AddressPage = ({ params }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const address = params.adderid;
  const [label, setLabel] = useState(address);
  const [addrTxs, setAddrTxs] = useState(null);
  const [count, setCount] = useState(undefined);
  const [otherBalances, setOtherBalances] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [runeBalance, setRuneBalance] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState(undefined);
  const [prevPageToken, setPrevPageToken] = useState(undefined);
  const [activeMode, setActiveMode] = useState("transactions");
  const [isVault, setIsVault] = useState(false);
  const [chainAddresses, setChainAddresses] = useState([]);
  const [routers, setRouters] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(undefined);
  const [vaultMode, setVaultMode] = useState("chain-addr");
  const [nodeAddresses, setNodeAddresses] = useState([]);
  const [pools, setPools] = useState(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);

  const runePrice = useAppStore((state) => state.runePrice);
  const nodesData = useAppStore((state) => state.nodesData);
  const nodes = useAppStore((state) => state.nodesData);
  const poolsFromStore = useAppStore((state) => state.pools);

  const advancedFilterRef = useRef();

  const limit = 30;

  const hasBalances = useMemo(() => {
    return (
      otherBalances &&
      otherBalances.length > 0 &&
      otherBalances.some((balance) => balance.quantity > 0)
    );
  }, [otherBalances]);

  const addressStat = useMemo(() => {
    const balances = otherBalances ?? [];
    if (isVault) {
      return [
        {
          title: "Overall Info",
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: "Block Height",
              value: vaultInfo?.block_height,
              filter: (v) => formatVueNumber(v, "0,0"),
            },
            {
              name: "Status",
              value: formatStatus(vaultInfo?.status),
            },
          ],
        },
        {
          title: "Ins/Outs",
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: "Inbound Txs",
              value: vaultInfo?.inbound_tx_count,
              filter: (v) => formatVueNumber(v, "0,0"),
            },
            {
              name: "Outbound Txs",
              value: vaultInfo?.outbound_tx_count,
              filter: (v) => formatVueNumber(v, "0,0"),
            },
          ],
        },
      ];
    }
    return balances;
  }, [isVault, vaultInfo, otherBalances]);

  const nodeAddress = useMemo(() => {
    return nodes?.some((node) => node.node_address === address);
  }, [nodes, address]);

  const isContractAddress = useCallback((addr) => {
    if (addr.startsWith("thor") || addr.startsWith("sthor")) {
      return addr.length > 45;
    }
    return false;
  }, []);

  const updateLabel = useCallback(async (addr) => {
    try {
      const { data: labels } = await getContractsLabel();
      const foundLabel = labels.find((l) => {
        if (l.address.toLowerCase() === addr.toLowerCase()) {
          return l.label;
        }
        return false;
      });
      setLabel(foundLabel ? foundLabel.label : addr);
    } catch (error) {
      console.error("Error updating label:", error);
    }
  }, []);

  const checkQuery = useCallback((queries) => {
    const validParams = [
      "address",
      "asset",
      "height",
      "fromHeight",
      "affiliate",
      "txType",
      "type",
      "fromTimestamp",
      "timestamp",
      "nextPageToken",
      "prevPageToken",
    ];

    return Object.keys(queries)
      .filter((key) => validParams.includes(key))
      .reduce((obj, key) => {
        obj[key] = queries.get(key);
        return obj;
      }, {});
  }, []);

  const fetchAddressData = useCallback(async (addr, offset = 0, limit = 30) => {
    setLoading(true);
    try {
      const params = {
        address: addr,
        limit,
        offset,
        ...checkQuery(searchParams),
      };

      const addrTxsResponse = await getActions(params);
      setAddrTxs(addrTxsResponse.data);
      setCount(addrTxsResponse.data.count);
      setNextPageToken(addrTxsResponse.data.meta.nextPageToken);
      setPrevPageToken(addrTxsResponse.data.meta.prevPageToken);

      if (addr.match(/^[st]?thor.*/gim)) {
        const balances = (await getBalance(addr)).data.result;
        const synthBalances = balances?.map((item) => {
          if (item.denom === "rune") {
            setRuneBalance({
              asset: assetFromString("THOR.RUNE"),
              quantity: Number.parseFloat(item?.amount) / 10 ** 8 ?? 0,
            });
            return false;
          }

          return {
            asset: assetFromString(item.denom.toUpperCase()),
            quantity: (item?.amount / 10 ** 8).toFixed(8),
          };
        }) ?? [];

        if (!balances) {
          setRuneBalance({
            asset: assetFromString("THOR.RUNE"),
            quantity: 0,
          });
        }

        let tradeBalances = (await getTradeAsset(addr)).data ?? [];
        tradeBalances = tradeBalances.map((item) => {
          return {
            asset: assetFromString(item.asset),
            quantity: (item?.units / 10 ** 8).toFixed(8),
          };
        });

        const compactedBalances = [
          runeBalance,
          ...tradeBalances,
          ...synthBalances,
        ].filter(Boolean);
        setOtherBalances(compactedBalances);
        setAddressLoading(false);
      } else {
        setOtherBalances([]);
        setAddressLoading(false);
      }
    } catch (e) {
      console.error(e);
      setAddressLoading(false);
    } finally {
      setLoading(false);
    }
  }, [searchParams, checkQuery, runeBalance]);

  const onPageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const goNext = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("nextPageToken", nextPageToken);
    params.delete("prevPageToken");
    router.push(`/address/${address}?${params.toString()}`);
  }, [nextPageToken, router, address, searchParams]);

  const goPrev = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("prevPageToken", prevPageToken);
    params.delete("nextPageToken");
    router.push(`/address/${address}?${params.toString()}`);
  }, [prevPageToken, router, address, searchParams]);

  const formatStatus = useCallback((status) => {
    return status === "ActiveVault" ? "Active" : status;
  }, []);

  const checkIsVault = useCallback(async (addr) => {
    try {
      const { data } = await getAsgard();
      for (const vaultIndex in data) {
        if (
          data[vaultIndex].addresses
            .map((a) => a.address.toUpperCase())
            .includes(addr.toUpperCase())
        ) {
          setIsVault(true);
          setChainAddresses(data[vaultIndex].addresses);
          setRouters(data[vaultIndex].routers);
          const vaultData = data[vaultIndex];
          
          if (!pools) {
            const poolsResponse = await getThorPools();
            setPools(poolsResponse.data);
          }

          const coinsWithValue = vaultData.coins.map((c) => ({
            ...c,
            amount: +c.amount < 1e3 ? 0 : c.amount,
            price: amountToUSD(c.asset, 1e8, pools || poolsFromStore),
            value: amountToUSD(c.asset, +c.amount, pools || poolsFromStore),
          }));

          setVaultInfo({ ...vaultData, coins: coinsWithValue });
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [pools, poolsFromStore]);

  const fillNodesAddresses = useCallback(() => {
    const nodeAddrs = [];
    if (nodesData && vaultInfo) {
      nodesData.forEach((n) => {
        const nodePubKey = n?.pub_key_set?.secp256k1;
        if (nodePubKey && vaultInfo?.membership.includes(nodePubKey)) {
          nodeAddrs.push(n.node_address);
        }
      });
    }
    setNodeAddresses(nodeAddrs);
  }, [nodesData, vaultInfo]);

  const fetchData = useCallback(async (params) => {
    setLoading(true);
    const cleanParams = checkQuery(params);

    let offset;
    const pageParam = searchParams.get("page");
    if (pageParam) {
      const page = parseInt(pageParam);
      setCurrentPage(page);
      offset = (page - 1) * limit;
    }

    try {
      const res = await getActions({
        limit,
        ...cleanParams,
        address,
        offset,
      });
      setAddrTxs(res.data);
      setNextPageToken(res.data.meta.nextPageToken);
      setPrevPageToken(res.data.meta.prevPageToken);
      setCount(res.data.count);
      setError(false);
    } catch (error) {
      if (error.message === "cancel") {
        setLoading(true);
        return;
      }
      setError(true);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [address, checkQuery, limit, searchParams]);

  const gotoAddr = useCallback((addr) => {
    router.push(`/address/${addr}`);
  }, [router]);

  const gotoPool = useCallback((asset) => {
    router.push(`/pool/${asset}`);
  }, [router]);

  const showAsset = useCallback((asset) => {
    const assetData = assetFromString(asset);
    return assetData?.ticker || "";
  }, []);

  const assetImage = useCallback((asset) => {
    return `/assets/${asset}.png`;
  }, []);

  const cols = useMemo(() => [
    {
      label: "Asset",
      field: "asset",
      formatFn: formatAsset,
      renderCell: (row) => (
        <div 
          className={`${styles["cell-content"]} ${styles.clickable}`}
          title={row.asset}
          onClick={() => gotoPool(row.asset)}
        >
          <img
            className={styles["table-asset-icon"]}
            src={assetImage(row.asset)}
            alt="asset-icon"
          />
          <span>{formatAsset(row.asset)}</span>
        </div>
      ),
    },
    {
      label: "Balance",
      field: "amount",
      type: "number",
      tdClass: styles.mono,
      formatFn: (value) => baseAmountFormat(value, formatVueNumber),
      renderCell: (row) => (
        <span>
          {baseAmountFormat(row.amount, formatVueNumber)}
          <span className={styles["extra-text"]}>
            {showAsset(row.asset)}
          </span>
        </span>
      ),
    },
    {
      label: "Price",
      field: "price",
      type: "number",
      tdClass: styles.mono,
      formatFn: formatCurrency,
    },
    {
      label: "Value",
      field: "value",
      type: "number",
      tdClass: styles.mono,
      formatFn: formatCurrency,
    },
  ], [assetImage, gotoPool, showAsset]);

  useEffect(() => {
    updateLabel(address);
    const pageParam = searchParams.get("page");
    const nextToken = searchParams.get("nextPageToken");
    const prevToken = searchParams.get("prevPageToken");
    
    setCurrentPage(pageParam ? parseInt(pageParam) : 1);
    fetchAddressData(
      address,
      (currentPage - 1) * limit,
      limit,
      nextToken,
      prevToken
    );
    checkIsVault(address);
  }, [address, updateLabel, checkIsVault, fetchAddressData, currentPage, limit, searchParams]);

  useEffect(() => {
    if (searchParams) {
      fetchData(searchParams);
    }
  }, [searchParams, fetchData]);

  useEffect(() => {
    if (nodesData) {
      fillNodesAddresses();
    }
  }, [nodesData, fillNodesAddresses]);

  return (
    <Page className={styles["address-container"]}>
      <div className={styles["address-section"]}>
        <div className={styles["left-section"]}>
          <div className={styles["address-header"]}>
            <Avatar name={address} />
          </div>
          <div className={styles["address-name"]}>
            <span 
              className={styles["address-value"]} 
              style={{ color: "var(--sec-font-color)" }}
            >
              {label}
            </span>
            <div className={styles["qr-copy-wrapper"]}>
              <div className={styles.item}>
                <Copy strCopy={address} />
              </div>
              <div id="qrcode" className={styles.item}>
                <QrBtn qrcode={address} />
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles["action-types"]} ${styles["desktop-filters"]}`}>
          <AdvancedFilter
            ref={advancedFilterRef}
            hideAddressFilter={true}
            className={styles["desktop-filters"]}
          />
        </div>
      </div>

      {!isVault ? (
        <div className={styles["stat-wrapper"]}>
          <div className={styles["balance-nav-container"]}>
            <Balance
              className={styles["card-balance"]}
              address={address}
              state={addressStat}
              loading={addressLoading}
            />
            {address &&
              (hasBalances || addressLoading) &&
              addressStat &&
              addressStat.length > 0 &&
              !isContractAddress(address) && (
                <BalanceHistory
                  key={address}
                  className={styles["card-balance-history"]}
                  address={address}
                />
              )}
          </div>
        </div>
      ) : (
        <>
          <InfoCard
            options={addressStat}
            style={{ marginBottom: "8px" }}
          />
          <Card
            extraClass={styles["mb-1"]}
            navs={[
              { title: "Chain Addresses", value: "chain-addr" },
              { title: "Node Members", value: "node-mmb" },
              { title: "Routers", value: "routers" },
            ]}
            activeNav={vaultMode}
            onNavChange={setVaultMode}
          >
            {vaultMode === "chain-addr" && (
              <div key="chain-addr">
                <div className={styles["addresses-container"]}>
                  {chainAddresses.map((addr) => (
                    <div key={addr.chain} className={styles.addresses}>
                      <img
                        className={styles["asset-icon"]}
                        src={assetImage(baseChainAsset(addr.chain))}
                        alt={addr.chain}
                      />
                      <span 
                        className={`${styles.clickable} ${styles.mono}`}
                        onClick={() => gotoAddr(addr.address)}
                      >
                        {addr.address.slice(0, 8)}...{addr.address.slice(-8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {vaultMode === "node-mmb" && (
              <div key="node-mmb">
                <div className={styles["addresses-container"]}>
                  {nodeAddresses.map((addr) => (
                    <div key={addr} className={styles.addresses}>
                      <Link 
                        href={`/node/${addr}`}
                        className={`${styles.clickable} ${styles.mono}`}
                      >
                        {addressFormatV2(addr)}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {vaultMode === "routers" && (
              <div key="routers">
                <div className={styles["addresses-container"]}>
                  {routers.map((r) => (
                    <div key={r.chain} className={styles.addresses}>
                      <img
                        className={styles["asset-icon"]}
                        src={assetImage(baseChainAsset(r.chain))}
                        alt={r.chain}
                      />
                      <span 
                        className={`${styles.clickable} ${styles.mono}`}
                        onClick={() => gotoAddr(r.router)}
                      >
                        {r.router.slice(0, 8)}...{r.router.slice(-8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          
          <div>
            <Card title="Vault Balances">
              {vaultInfo && (
                <Table
                  columns={cols}
                  data={vaultInfo.coins}
                  className="vgt-table net-table vgt-compact"
                  pagination={{
                    enabled: true,
                    perPage: 30,
                    perPageDropdownEnabled: false,
                  }}
                />
              )}
            </Card>
          </div>
        </>
      )}

      {!isVault && (
        <>
          <div className={styles["action-buttons"]}>
            <button
              className={`${styles["action-btn"]} ${
                activeMode === "transactions" ? styles.active : ""
              }`}
              onClick={() => setActiveMode("transactions")}
            >
              Transactions
            </button>
            <button
              className={`${styles["action-btn"]} ${
                activeMode === "pools" ? styles.active : ""
              }`}
              onClick={() => setActiveMode("pools")}
            >
              LP/Savers
            </button>
            <button
              className={`${styles["action-btn"]} ${
                activeMode === "bond" ? styles.active : ""
              }`}
              onClick={() => setActiveMode("bond")}
            >
              Bond
            </button>
            <button
              className={`${styles["action-btn"]} ${
                activeMode === "thorname" ? styles.active : ""
              }`}
              onClick={() => setActiveMode("thorname")}
            >
              Thorname
            </button>
            <button
              className={`${styles["action-btn"]} ${
                activeMode === "distribution" ? styles.active : ""
              }`}
              onClick={() => setActiveMode("distribution")}
            >
              TCY
            </button>
          </div>

          <div className={`${styles["action-components"]} ${styles["mb-2"]}`}>
            {activeMode === "thorname" && <Thorname address={address} />}
            {activeMode === "pools" && <Pools address={address} />}
            {activeMode === "bond" && <Bonds address={address} nodes={nodesData} />}
            {activeMode === "distribution" && <Distribution address={address} />}
            
            {activeMode === "transactions" && (
              <div className={styles["transactions-section"]}>
                <Transactions 
                  txs={addrTxs} 
                  owner={address} 
                  loading={loading} 
                />
                
                {addrTxs && addrTxs.actions && count > -1 ? (
                  <NewPagination
                    totalRows={+count}
                    perPage={30}
                    currentPage={currentPage}
                    onChange={onPageChange}
                  />
                ) : addrTxs && addrTxs.actions ? (
                  <Pagination
                    meta={addrTxs.actions}
                    loading={loading}
                    onNextPage={goNext}
                    onPrevPage={goPrev}
                  />
                ) : null}
              </div>
            )}
          </div>
        </>
      )}

      {!addrTxs && !loading && (
        <div className={styles["error-container"]}>
          Can't Fetch the Address! Please Try again Later.
        </div>
      )}
    </Page>
  );
};

export default AddressPage;