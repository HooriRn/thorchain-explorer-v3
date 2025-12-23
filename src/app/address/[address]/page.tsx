"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  getBalance,
  getActions,
  getAsgard,
  getThorPools,
  getContractsLabel,
  getTradeAsset,
} from "@/lib/api";
import { assetFromString } from "@/utils";
import {
  baseAmountFormat,
  amountToUSD,
  baseChainAsset,
  addressFormatV2,
  formatAsset,
} from "@/utils/global";
import { formatVueNumber, formatTrendNumber } from "@/utils/format";
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
import Link from "next/link";
import styles from "./address.module.css";
import Transactions from "@/components/Transactions";
import Balance from "../components/balance/balance";
import BalanceHistory from "../components/balancehistory/balanceHistory";
import Thorname from "../components/thorname/thorname";
import Pools from "../components/pools/pools";
import Bonds from "../components/bonds/bond";
import Distribution from "../components/distribution/distribution";

type AddressPageProps = {
  params: { adderid: string };
};

const AddressPage: React.FC<AddressPageProps> = ({ params }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const address = params.adderid;
  const [label, setLabel] = useState(address);
  const [addrTxs, setAddrTxs] = useState<any>(null);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [otherBalances, setOtherBalances] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [runeBalance, setRuneBalance] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(
    undefined
  );
  const [prevPageToken, setPrevPageToken] = useState<string | undefined>(
    undefined
  );
  const [activeMode, setActiveMode] = useState<
    "transactions" | "pools" | "bond" | "thorname" | "distribution"
  >("transactions");
  const [isVault, setIsVault] = useState(false);
  const [chainAddresses, setChainAddresses] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [vaultInfo, setVaultInfo] = useState<any>(undefined);
  const [vaultMode, setVaultMode] = useState("chain-addr");
  const [nodeAddresses, setNodeAddresses] = useState<string[]>([]);
  const [pools, setPools] = useState<any>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);
  const [labelDebug, setLabelDebug] = useState("");

  const runePrice = useAppStore((state) => state.runePrice);
  const nodesData = useAppStore((state) => state.nodesData);
  const nodes = useAppStore((state) => state.nodesData);
  const poolsFromStore = useAppStore((state) => state.pools);

  const advancedFilterRef = useRef<any>(null);

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
              filter: (v: any) => formatVueNumber(v, "0,0"),
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
              filter: (v: any) => formatVueNumber(v, "0,0"),
            },
            {
              name: "Outbound Txs",
              value: vaultInfo?.outbound_tx_count,
              filter: (v: any) => formatVueNumber(v, "0,0"),
            },
          ],
        },
      ];
    }
    return balances;
  }, [isVault, vaultInfo, otherBalances]);

  const nodeAddress = useMemo(() => {
    return nodes?.some((node: any) => node.node_address === address);
  }, [nodes, address]);

  const isContractAddress = useCallback((addr: string) => {
    if (addr.startsWith("thor") || addr.startsWith("sthor")) {
      return addr.length > 45;
    }
    return false;
  }, []);

  const updateLabel = useCallback(
    async (addr: string) => {
      if (!addr || typeof addr !== "string") return;

      try {
        const res = await getContractsLabel();
        const labels = Array.isArray(res) ? res : (res as any)?.data;

        if (!Array.isArray(labels)) {
          setLabelDebug(`not-array: ${JSON.stringify(labels ?? null)}`);
          setLabel(addr);
          return;
        }

        const foundLabel = labels.find(
          (l: any) =>
            typeof l.address === "string" &&
            l.address.toLowerCase() === addr.toLowerCase()
        );

        if (typeof window !== "undefined") {
          (window as any).__addressLabelDebug = {
            addr,
            foundLabel,
            labelsCount: labels.length,
          };
        }

        setLabelDebug(
          JSON.stringify({
            labelsCount: labels.length,
            foundLabel,
          })
        );
        setLabel(foundLabel?.label ?? addr);
      } catch (error) {
        setLabelDebug(
          `error: ${error instanceof Error ? error.message : String(error)}`
        );
        setLabel(addr);
      }
    },
    [setLabel]
  );

  const checkQuery = useCallback((queries: URLSearchParams) => {
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

    const obj: Record<string, any> = {};
    Array.from(queries.keys())
      .filter((key) => validParams.includes(key))
      .forEach((key) => {
        obj[key] = queries.get(key) ?? undefined;
      });
    return obj;
  }, []);

  const fetchAddressData = useCallback(
    async (addr: string, offset = 0, limit = 30) => {
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
          const synthBalances =
            balances?.map((item: any) => {
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
          tradeBalances = tradeBalances.map((item: any) => {
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
          setOtherBalances(compactedBalances as any[]);
          setAddressLoading(false);
        } else {
          setOtherBalances([]);
          setAddressLoading(false);
        }
      } catch (e) {
        setAddressLoading(false);
      } finally {
        setLoading(false);
      }
    },
    [searchParams, checkQuery, runeBalance]
  );

  const onPageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const goNext = useCallback(() => {
    if (!nextPageToken) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("nextPageToken", nextPageToken);
    params.delete("prevPageToken");
    router.push(`/address/${address}?${params.toString()}`);
  }, [nextPageToken, router, address, searchParams]);

  const goPrev = useCallback(() => {
    if (!prevPageToken) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("prevPageToken", prevPageToken);
    params.delete("nextPageToken");
    router.push(`/address/${address}?${params.toString()}`);
  }, [prevPageToken, router, address, searchParams]);

  const formatStatus = useCallback((status: string) => {
    return status === "ActiveVault" ? "Active" : status;
  }, []);

  const checkIsVault = useCallback(
    async (addr: string) => {
      try {
        const { data } = await getAsgard();
        for (const vaultIndex in data) {
          if (
            data[vaultIndex].addresses
              .map((a: any) => a.address.toUpperCase())
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

            const coinsWithValue = vaultData.coins.map((c: any) => ({
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
      }
    },
    [pools, poolsFromStore]
  );

  const fillNodesAddresses = useCallback(() => {
    const nodeAddrs: string[] = [];
    if (nodesData && vaultInfo) {
      nodesData.forEach((n: any) => {
        const nodePubKey = n?.pub_key_set?.secp256k1;
        if (nodePubKey && vaultInfo?.membership.includes(nodePubKey)) {
          nodeAddrs.push(n.node_address);
        }
      });
    }
    setNodeAddresses(nodeAddrs);
  }, [nodesData, vaultInfo]);

  const fetchData = useCallback(
    async (params: URLSearchParams) => {
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
      } catch (error: any) {
        if (error?.message === "cancel") {
          setLoading(true);
          return;
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [address, checkQuery, limit, searchParams]
  );

  const gotoAddr = useCallback(
    (addr: string) => {
      router.push(`/address/${addr}`);
    },
    [router]
  );

  const gotoPool = useCallback(
    (asset: string) => {
      router.push(`/pool/${asset}`);
    },
    [router]
  );

  const showAsset = useCallback((asset: string) => {
    const assetData = assetFromString(asset);
    return assetData?.ticker || "";
  }, []);

  const assetImage = useCallback((asset: string) => {
    return `/assets/${asset}.png`;
  }, []);

  const labelDebugMode = useMemo(
    () => searchParams?.get("debug") === "1" || !!labelDebug,
    [searchParams, labelDebug]
  );

  const cols = useMemo(
    () => [
      {
        label: "Asset",
        field: "asset",
        formatFn: formatAsset,
        renderCell: (row: any) => (
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
        formatFn: (value: any) => baseAmountFormat(value, formatVueNumber),
        renderCell: (row: any) => (
          <span>
            {baseAmountFormat(row.amount, formatVueNumber)}
            <span className={styles["extra-text"]}>{showAsset(row.asset)}</span>
          </span>
        ),
      },
      {
        label: "Price",
        field: "price",
        type: "number",
        tdClass: styles.mono,
        formatFn: formatTrendNumber,
      },
      {
        label: "Value",
        field: "value",
        type: "number",
        tdClass: styles.mono,
        formatFn: formatTrendNumber,
      },
    ],
    [assetImage, gotoPool, showAsset]
  );

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
  }, [
    address,
    updateLabel,
    checkIsVault,
    fetchAddressData,
    currentPage,
    limit,
    searchParams,
  ]);

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
              title={labelDebug || label}
            >
              {label}
            </span>
            {labelDebugMode && (
              <div style={{ fontSize: "12px", color: "var(--sec-font-color)" }}>
                Label debug: {labelDebug || "pending"}
              </div>
            )}
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
        <div
          className={`${styles["action-types"]} ${styles["desktop-filters"]}`}
        >
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
          <InfoCard options={addressStat} style={{ marginBottom: "8px" }} />
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
            {activeMode === "bond" && (
              <Bonds address={address} nodes={nodesData} />
            )}
            {activeMode === "distribution" && (
              <Distribution address={address} />
            )}

            {activeMode === "transactions" && (
              <div className={styles["transactions-section"]}>
                <Transactions txs={addrTxs} owner={address} loading={loading} />

                {addrTxs && addrTxs.actions && count !== undefined ? (
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