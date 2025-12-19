"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { orderBy } from "lodash";
import Card from "@/components/ui/Card";
import AssetIcon from "@/components/AssetIcon";
import PieChart from "@/components/PieChart";
import AngleIcon from "@/assets/images/angle-down.svg";
import ArrowDownIcon from "@/assets/images/arrow-down-.svg";
import ArrowUpIcon from "@/assets/images/arrow-up-.svg";
import ExternalIcon from "@/assets/images/external.svg";
import styles from "./balance.module.css";

const Balance = ({ state, loading, address }) => {
  const [selectedToken, setSelectedToken] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [runeBalance, setRuneBalance] = useState(null);
  const [sortDirection, setSortDirection] = useState({
    Native: "desc",
    Trade: "desc",
    Synth: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const runePrice = useAppStore((state) => state.runePrice);
  const pools = useAppStore((state) => state.pools);
  const nodes = useAppStore((state) => state.nodesData);
  const dropdownRef = useRef(null);

  const sortedGroupedTokens = useMemo(() => {
    return Object.entries(groupedTokens).map(([type, tokens]) => ({
      type,
      tokens: orderBy(
        tokens,
        [(token) => parseFloat(token.value)],
        [sortDirection[type]]
      ),
    }));
  }, [sortDirection]);

  const totalValue = useMemo(() => {
    const total = otherTokens.reduce(
      (sum, token) => sum + Number(token.value),
      0
    );
    const count = otherTokens.length;
    return { total, count };
  }, [otherTokens]);

  const tokenRows = useMemo(() => {
    if (!state) {
      return [];
    }

    const ret = [];
    for (let i = 0; i < state.length; i++) {
      const e = state[i];
      let poolAsset;
      
      pools?.forEach((p) => {
        const pa = assetFromString(p.asset);
        if (pa.chain === e.asset?.chain && pa?.ticker === e.asset?.ticker) {
          poolAsset = p;
        }
      });

      if (e.asset?.ticker === "RUNE" && e.asset?.chain === "THOR") {
        poolAsset = {
          assetPriceUSD: runePrice,
        };
      }

      ret.push({
        asset: e.asset,
        quantity: e.quantity,
        price: bnOrZero(poolAsset?.assetPriceUSD).toFixed(2),
        value: bnOrZero(poolAsset?.assetPriceUSD * e.quantity).toFixed(2),
        type: getAssetType(e.asset),
      });
    }

    return ret;
  }, [state, pools, runePrice]);

  const runeToken = useMemo(() => {
    return tokenRows.find(
      (token) =>
        token?.asset?.ticker === "RUNE" && token?.asset?.chain === "THOR"
    );
  }, [tokenRows]);

  const otherTokens = useMemo(() => {
    return tokenRows.filter(
      (token) =>
        !(token.asset?.ticker === "RUNE" && token.asset?.chain === "THOR")
    );
  }, [tokenRows]);

  const groupedTokens = useMemo(() => {
    return otherTokens
      .filter((tok) => tok.asset)
      .reduce((acc, token) => {
        const type = getAssetType(token.asset);
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(token);
        return acc;
      }, {});
  }, [otherTokens]);

  const isNodeAddress = useMemo(() => {
    return nodes?.some((node) => node.node_address === address);
  }, [nodes, address]);

  const totalBond = useMemo(() => {
    const foundNode = nodes?.find(
      (node) => node.node_address === address
    );
    return foundNode ? foundNode.total_bond : undefined;
  }, [nodes, address]);

  const bonds = useMemo(() => {
    if (!nodes) {
      return undefined;
    }
    
    const ret = { total: 0 };
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const bond = node.bond_providers?.providers?.find(
        (n) => n.bond_address === address
      );
      if (bond !== undefined) {
        ret.total += +bond.bond / 1e8;
      }
    }
    return ret;
  }, [nodes, address]);

  const totalBalance = useMemo(() => {
    let ret = runeToken?.quantity || 0;
    if (bonds?.total > 0) {
      ret += bonds.total;
    }
    return ret;
  }, [runeToken, bonds]);

  const balanceAllocationData = useMemo(() => {
    const data = [];

    if (runeToken && runeToken.quantity > 0) {
      data.push({
        name: "RUNE Balance",
        value: runeToken.quantity,
      });
    }

    let bondValue = 0;
    if (totalBond !== undefined) {
      bondValue = totalBond / 1e8;
    } else if (bonds && bonds.total > 0) {
      bondValue = bonds.total;
    }

    if (bondValue > 0) {
      data.push({
        name: "Bond Balance",
        value: bondValue,
      });
    }

    return data;
  }, [runeToken, totalBond, bonds]);

  const chartExtraSeries = useMemo(() => ({
    center: ["50%", "45%"],
    radius: ["35%", "60%"],
    label: {
      show: false,
    },
  }), []);

  const chartExtra = useMemo(() => ({
    legend: {
      show: true,
      type: "plain",
      orient: "vertical",
      x: "center",
      y: "bottom",
      icon: "circle",
      textStyle: {
        color: "var(--font-color)",
      },
    },
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (a) => {
        return `${a.name}: <small>${numberFormat(a?.data?.value)} RUNE</small> <span class='mono'>(${a.percent}%)</span>`;
      },
    },
  }), []);

  const explorers = useMemo(() => {
    const blockChains = [
      "btc",
      "eth",
      "doge",
      "bch",
      "ltc",
      "atom",
      "xrp",
      "trx",
    ];

    const explorers = [];
    for (let i = 0; i < blockChains.length; i++) {
      let chain = blockChains[i];
      const res = validate(address, chain);

      if (res && chain === "eth") {
        const evms = ["ETH", "BSC", "AVAX", "BASE"];
        evms.forEach((e) => {
          explorers.push({
            chain: e,
            url: getExplorerAddressUrl(e, address),
          });
        });
      } else if (res) {
        if (chain === "atom") {
          chain = "gaia";
        }
        if (chain === "trx") {
          chain = "tron";
        }
        explorers.push({
          chain: chain.toUpperCase(),
          url: getExplorerAddressUrl(chain.toUpperCase(), address),
        });
      }
    }

    return explorers;
  }, [address]);

  const getAssetType = useCallback((asset) => {
    if (asset?.synth) {
      return "Synth";
    } else if (asset?.trade) {
      return "Trade";
    } else {
      return "Native";
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const filteredTokens = useCallback((tokens) => {
    return tokens.filter((token) => {
      const nameMatch = showAsset(token.asset)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const valueMatch = token.value.toString().includes(searchQuery);
      const priceMatch = token.price.toString().includes(searchQuery);
      return nameMatch || valueMatch || priceMatch;
    });
  }, [searchQuery]);

  const selectToken = useCallback((token) => {
    setSelectedToken(token);
    setIsOpen(false);
  }, []);

  const changeSort = useCallback((type) => {
    setSortDirection((prev) => ({
      ...prev,
      [type]: prev[type] === "asc" ? "desc" : "asc",
    }));
  }, []);

  const showAsset = useCallback((asset) => {
    if (!asset) return "";
    if (asset.ticker) {
      return asset.synth ? `s${asset.ticker}` : asset.ticker;
    }
    return asset;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (state && explorers.length === 0) {
    return (
      <Card>
        <div className={styles["balance-container"]}>
          <div className={styles["balance-content-wrapper"]}>
            <div className={styles["balance-info"]}>
              <span className={styles["title-balance"]}>Balances</span>
              
              <div className={styles["balance-label"]}>
                <span>RUNE Balance</span>
                <SkeletonItem loading={loading} className={styles["balance-content"]}>
                  {runeToken && runeToken.price > 0 && !isNaN(runeToken.price) ? (
                    <>
                      <AssetIcon
                        asset={{ ticker: "RUNE", chain: "THOR" }}
                        height="16px"
                        showChain={false}
                      />
                      <span
                        className={styles.mono}
                        title={runeToken && formatCurrency(runeToken.quantity * runeToken.price)}
                      >
                        {balanceFormat(runeToken.quantity)} RUNE
                      </span>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </SkeletonItem>
              </div>

              {isNodeAddress && (
                <div className={styles["balance-label"]}>
                  <span>Node Balance</span>
                  <SkeletonItem loading={loading || !nodes} className={styles["balance-content"]}>
                    <AssetIcon
                      asset={{ ticker: "RUNE", chain: "THOR" }}
                      height="16px"
                      showChain={false}
                    />
                    <div className={styles.bonds}>
                      {totalBond !== undefined ? (
                        <span
                          className={styles.mono}
                          title={formatCurrency((runePrice * totalBond) / 1e8)}
                        >
                          {balanceFormat(totalBond / 1e8)} RUNE
                          <Link
                            href={`/node/${address}`}
                            className={styles.clickable}
                            style={{ marginLeft: "0.5rem" }}
                          >
                            View Node
                          </Link>
                        </span>
                      ) : (
                        <span className={styles.mono}>-</span>
                      )}
                    </div>
                  </SkeletonItem>
                </div>
              )}

              <div className={styles["balance-label"]}>
                <span>Bond Balance</span>
                <SkeletonItem loading={loading || !nodes} className={styles["balance-content"]}>
                  <AssetIcon
                    asset={{ ticker: "RUNE", chain: "THOR" }}
                    height="16px"
                    showChain={false}
                  />
                  <div className={styles.bonds}>
                    {bonds && bonds.total !== undefined ? (
                      <span
                        className={styles.mono}
                        title={formatCurrency(runePrice * bonds.total)}
                      >
                        {balanceFormat(bonds.total)} RUNE
                      </span>
                    ) : (
                      <span className={styles.mono}>-</span>
                    )}
                  </div>
                </SkeletonItem>
              </div>

              <div className={styles["balance-label"]}>
                <span>Total Value</span>
                <SkeletonItem loading={loading} className={styles["balance-content"]}>
                  {runeToken && runeToken.price > 0 && !isNaN(runeToken.price) ? (
                    <span className={styles.mono}>
                      {formatCurrency(runeToken.price * totalBalance)}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </SkeletonItem>
              </div>
            </div>

            {balanceAllocationData.length > 0 && (
              <div className={styles["balance-chart-section"]}>
                <PieChart
                  pieData={balanceAllocationData}
                  extraSeries={chartExtraSeries}
                  extra={chartExtra}
                  height="200px"
                />
              </div>
            )}
          </div>
          
          {totalValue.count > 0 && (
            <div className={styles["dropdown-container"]} ref={dropdownRef}>
              <label htmlFor="token-dropdown">Other Asset Holdings</label>
              <div className={styles["custom-dropdown"]}>
                <button
                  className={`${styles["dropdown-button"]} ${
                    isOpen ? styles["dropdown-open"] : ""
                  }`}
                  onClick={toggleDropdown}
                >
                  <div className={styles["selected-options"]}>
                    {selectedToken ? (
                      <span>{showAsset(selectedToken.asset)}</span>
                    ) : (
                      <>
                        <span className={styles["total-value"]}>
                          {formatCurrency(totalValue.total)}
                        </span>
                        <span className={styles["count-value"]}>
                          ({totalValue.count} Tokens)
                        </span>
                      </>
                    )}
                  </div>
                  <AngleIcon className={styles["dropdown-icon"]} />
                </button>
              </div>

              {isOpen && (
                <div className={styles["dropdown-modal"]}>
                  <input
                    type="text"
                    placeholder="Search for Token Name"
                    className={styles["search-input"]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className={styles["dropdown-options"]}>
                    <div className={styles["options-container"]}>
                      {sortedGroupedTokens.every(group => 
                        filteredTokens(group.tokens).length === 0
                      ) ? (
                        <div className={styles["no-results"]}>
                          Could not find any matches!
                        </div>
                      ) : (
                        sortedGroupedTokens.map((group) => (
                          filteredTokens(group.tokens).length > 0 && (
                            <div key={group.type}>
                              <div className={styles["token-group-header"]}>
                                {group.type} Assets ({filteredTokens(group.tokens).length})
                                <div className={styles["sort-controls"]}>
                                  <span onClick={() => changeSort(group.type)}>
                                    {sortDirection[group.type] === "desc" ? (
                                      <ArrowDownIcon className={styles["arrow-icon"]} />
                                    ) : (
                                      <ArrowUpIcon className={styles["arrow-icon"]} />
                                    )}
                                  </span>
                                </div>
                              </div>

                              {filteredTokens(group.tokens).map((token) => (
                                <div
                                  key={token.asset}
                                  className={styles["dropdown-option"]}
                                  onClick={() => selectToken(token)}
                                >
                                  <div className={styles["token-info"]}>
                                    <div className={styles["token-name"]}>
                                      <AssetIcon asset={token.asset} showChain={false} />
                                      <span style={{ lineHeight: 1 }}>
                                        {showAsset(token.asset)}
                                      </span>
                                    </div>
                                    <div className={styles["token-quantity"]}>
                                      {token.quantity} {token.asset.ticker}
                                    </div>
                                  </div>
                                  <div className={styles["token-value"]}>
                                    {token.price > 0 && !isNaN(token.price) ? (
                                      <>
                                        <span>${numberFormat(token.value, "0,0.00")}</span>
                                        <div className={styles["token-price"]}>
                                          @{numberFormat(token.price, "0,0.0000")}
                                        </div>
                                      </>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Chain Explorers" className={styles["explorers-card"]}>
      <div className={styles.explorers}>
        {explorers.map((explorer) => (
          <a
            key={explorer.chain}
            className={`${styles["explorer-link"]} ${styles["mini-bubble"]} ${styles.info} ${styles.hoverable}`}
            href={explorer.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <AssetIcon
              height="1.2rem"
              asset={baseChainAsset(explorer.chain)}
            />
            {explorer.chain}
            <ExternalIcon className={styles["ext-icon"]} />
          </a>
        ))}
      </div>
    </Card>
  );
};

export default Balance;