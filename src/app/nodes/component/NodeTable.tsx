"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderBy, remove } from "lodash";
import { Table, TableColumn, TableData } from "@/components/table";
import { useRunePrice } from "@/lib/store";
import { addressFormatV2, formatCurrency, normalFormat } from "@/utils/global";
import { number as formatNumber } from "@/utils/format";
import Copy from "@/components/Copy";
import Ip from "@/components/Ip";
import CloudImage from "@/components/CloudImage";
import ColorHash from "@/components/ColorHash";
import VFlag from "@/components/VFlag";
import RuneAsset from "@/components/RuneAsset";
import { ProgressIcon } from "@/components/ui/ProgressIcon";
import Avatar from "@/components/Avatar";
import Tooltip from "@/components/Tooltip";
import JsonIcon from "@/assets/images/json.svg";
import InfoIcon from "@/assets/images/info.svg";
import StarIcon from "@/assets/images/bookmark.svg";
import StaredIcon from "@/assets/images/bookmarked.svg";
import ExitIcon from "@/assets/images/arrow-down-square.svg";
import RecycleIcon from "@/assets/images/recycle.svg";
import MarkerIcon from "@/assets/images/marker.svg";
import DangerIcon from "@/assets/images/danger.svg";
import ExternalIcon from "@/assets/images/external.svg";
import VaultIcon from "@/assets/images/safe.svg";
import HighlightList from "@/assets/images/highlight-list.svg";
import CrossIcon from "@/assets/images/cross.svg";
import NodeIcon from "@/assets/images/node.svg";
import MissingBlock from "@/assets/images/missingblock.svg";
import CheckIcon from "@/assets/images/check.svg";
import WarningIcon from "@/assets/images/warning.svg";
import UserIcon from "@/assets/images/user.svg";
import StatusIcon from "@/assets/images/status.svg";
import styles from "./NodeTable.module.css";

interface NodeData extends TableData {
  address: string;
  ip: string;
  status: string;
  operator: string;
  total_bond: number;
  award: number;
  vault: string;
  age: { number: number; info: string };
  isp: string;
  location: { code: string; city: string };
  version: string;
  missing_blocks: number;
  preflight?: { reason: string };
  providers?: any[];
  churn: any[];
  rank: number;
  leave?: boolean;
  fee?: string;
  score?: number;
  rpcHealth?: any;
  bifrostHealth?: any;
  [key: string]: any;
}

interface NodeTableProps {
  rows: NodeData[];
  cols: any[];
  name: string;
  searchTerm?: string;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
}

interface FavoriteNode {
  address: string;
  rank: number;
  lastRank?: number;
}

interface HealthStatus {
  text: string;
  url: string;
  title: string;
}

const NodeTable: React.FC<NodeTableProps> = ({
  rows,
  cols,
  name,
  searchTerm = "",
  sortColumn,
  sortOrder = "asc"
}) => {
  const router = useRouter();
  const runePrice = useRunePrice();
  
  const [favs, setFavs] = useState<FavoriteNode[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<NodeData | null>(null);

  useEffect(() => {
    const storedFavs = localStorage.getItem(name);
    if (storedFavs) {
      setFavs(JSON.parse(storedFavs));
    }
  }, [name]);

  useEffect(() => {
    localStorage.setItem(name, JSON.stringify(favs));
  }, [favs, name]);

  const getHighlightStyle = (address: string) => {
    const isFavorite = isFav(address);
    return {
      color: isFavorite ? vaultColor(address, true) : "",
      fill: isFavorite ? vaultColor(address, true) : "",
      fontWeight: isFavorite ? "bold" : "normal",
    };
  };

  const vaultColor = (address: string, asColor: boolean = false): string => {
    return "#000";
  };

  const assetImage = (asset: string): string => {
    return `/assets/${asset}.png`;
  };

  const getHealthStatus = (value: any, row: NodeData, column: any): HealthStatus => {
    if (value === null || value === undefined) {
      return { text: "-", url: "", title: "" };
    }

    const field = column.label;
    const ip = row.ip;
    let url = "";
    
    if (field === "BFR") {
      url = `http://${ip}:6040/p2pid`;
    } else if (field === "RPC") {
      url = `http://${ip}:27147/health?`;
    }

    const errorMessages: { [key: string]: string } = {
      ERR_BAD_RESPONSE: "Unexpected response from the server",
      ECONNREFUSED: "Connection Refused By Server",
      ECONNABORTED: "Connection was interrupted",
    };

    if (value === true) {
      return { text: "OK", url, title: "" };
    }

    if (value === false) {
      return { text: "BAD", url, title: "" };
    }

    if (typeof value === "string") {
      return { text: "BAD", url, title: errorMessages[value] || value };
    }

    return { text: "-", url: "", title: "" };
  };

  const getHealth = (row: NodeData, column: any): HealthStatus => {
    return getHealthStatus(row[column.field], row, column);
  };

  const rankChange = (address: string, rank: number): number => {
    const favNode = favs.find((f) => f.address === address);
    return favNode ? favNode.rank - rank : 0;
  };

  const openModal = (row: NodeData) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRow(null);
  };

  const isUpgrading = (version: string): boolean => {
    if (name !== "active-nodes" || !rows) {
      return false;
    }

    const nodesVersion = rows.map((r) => r.version).sort();
    const versions = [...new Set(nodesVersion)];
    
    return versions.length > 1 && version === versions[0];
  };

  const filterProviders = (arr: any[] | undefined) => {
    if (!arr) {
      return [];
    }
    return orderBy(
      arr.map((a) => ({ ...a, bond: +a.bond })),
      ["bond"],
      ["desc"]
    );
  };

  const rowClassCallback = (row: NodeData): string => {
    const classes = [styles["table-row"]];
    
    if (row.churn?.length > 0) {
      if (row.churn.some((e) => e.type === "churn-out" || e.type === "leave")) {
        classes.push(styles["churning-out"]);
      }

      if (row.churn.some((e) => e.type === "churn-in")) {
        classes.push(styles["churning-in"]);
      }
    }

    return classes.join(" ");
  };

  const addFav = (address: string, rank: number) => {
    if (address) {
      setFavs([...favs, { address, rank, lastRank: rank }]);
    }
  };

  const delFav = (address: string) => {
    const updatedFavs = favs.filter((fav) => fav.address !== address);
    setFavs(updatedFavs);
  };

  const isFav = (address: string): boolean => {
    return favs.some((fav) => fav.address === address);
  };

  const handleSortChange = (params: { column: string; order: "asc" | "desc" }) => {
    console.log("Sort changed:", params);
  };

  const tableColumns = useMemo((): TableColumn<NodeData>[] => {
    return cols.map((col) => {
      const column: TableColumn<NodeData> = {
        label: col.label,
        field: col.field,
        sortKey: col.field,
        headerRender: () => {
          console.log('Rendering header for field:', col.field);
          
          if (col.field.includes("behind")) {
            return (
              <div className={styles["table-asset"]}>
                <img 
                  className={styles["asset-chain"]} 
                  src={assetImage(`${col.label}.${col.label}`)} 
                  alt={col.label}
                />
              </div>
            );
          } else if (col.field === "highlight") {
            return (
              <div className={styles["table-header-icon"]}>
                <HighlightList className={styles["table-icon"]} />
              </div>
            );
          } else if (col.field === "location") {
            return (
              <Tooltip content="Node Location">
                <div className={styles["table-header-icon"]}>
                  <MarkerIcon className={styles["table-icon"]} />
                </div>
              </Tooltip>
            );
          } else if (col.field === "churn") {
            return (
              <div className={styles["table-header-icon"]}>
                <RecycleIcon className={styles["table-icon"]} />
              </div>
            );
          } else if (col.field === "vault") {
            return (
              <div className={styles["table-asset"]}>
                <VaultIcon className={styles["table-icon"]} />
              </div>
            );
          } else if (col.field === "missing_blocks") {
            return (
              <div className={styles["table-asset"]}>
                <MissingBlock className={styles["table-icon"]} />
              </div>
            );
          } else if (col.field === "address") {
            return (
              <div className={styles["header-with-icon"]}>
                <UserIcon className={styles["header-icon"]} />
                <span>Address</span>
              </div>
            );
          } else if (col.field === "status") {
            return (
              <div className={styles["header-with-icon"]}>
                <StatusIcon className={styles["header-icon"]} />
                <span>Status</span>
              </div>
            );
          } else {
            return <span>{col.label}</span>;
          }
        },
        renderCell: (item: NodeData) => {
          switch (col.field) {
            case "address":
              return (
                <div className={styles["table-wrapper-row"]}>
                  <Tooltip content={item.address}>
                    <Link 
                      className={styles.clickable} 
                      style={getHighlightStyle(item.address)}
                      href={`/address/${item.address}`}
                    >
          {item.address.slice(-4)}
          </Link>
                  </Tooltip>
                  <Copy strCopy={item.address} />
                  <Link 
                    style={getHighlightStyle(item.address)} 
                    href={`/node/${item.address}`}
                    target="_blank"
                  >
                    <InfoIcon className={`${styles["table-icon"]} ${styles["item-link"]}`} />
                  </Link>
                  <a 
                    style={getHighlightStyle(item.address)} 
                    className={styles["height-1rem"]}
                    href={`http://${item.ip}:6040/status/scanner`} 
                    target="_blank"
                  >
                    <JsonIcon className={`${styles["table-icon"]} ${styles["item-link"]}`} />
                  </a>
                  <Ip strCopy={item.ip} />
                  <a 
                    style={getHighlightStyle(item.address)} 
                    className={styles["height-1rem"]}
                    href={`https://thornode.ninerealms.com/thorchain/node/${item.address}`} 
                    target="_blank"
                  >
                    <NodeIcon className={`${styles["table-icon"]} ${styles["item-link"]}`} />
                  </a>
                </div>
              );

            case "highlight":
              return isFav(item.address) ? (
                <div className={styles["fav-cell"]}>
                  <StaredIcon 
                    className={styles["table-icon"]} 
                    style={getHighlightStyle(item.address)}
                    onClick={() => delFav(item.address)}
                  />
                  <span className={styles["fav-text"]}>Favorite</span>
                </div>
              ) : (
                <div className={styles["fav-cell"]}>
                  <StarIcon 
                    className={styles["table-icon"]} 
                    onClick={() => addFav(item.address, item.rank)}
                  />
                  <span className={styles["fav-text"]}>Add to Fav</span>
                </div>
              );

            case "age":
              return item.age ? (
                <Tooltip content={item.age.info}>
                  <span style={{ cursor: "pointer" }}>
                    {formatNumber(item.age.number, "0,0.00")}
                  </span>
                </Tooltip>
              ) : (
                <span>-</span>
              );

            case "isp":
              return item.isp ? (
                <CloudImage name={[item.isp, item.org]} />
              ) : (
                <span>-</span>
              );

            case "location":
              return item.location ? (
                <div className={styles["location-cell"]}>
                  <Tooltip content={`${item.location.code}, ${item.location.city}`}>
                    <div className={styles.countries}>
                      <VFlag flag={item.location.code} />
                    </div>
                  </Tooltip>
                  <span className={styles["location-text"]}>
                    {item.location.city}
                  </span>
                </div>
              ) : null;

            case "total_bond":
              return (
                <Tooltip content={formatCurrency(runePrice * item.total_bond)}>
                  <span className={styles.hoverable}>
                    <RuneAsset 
                      height="0.7rem" 
                      style={getHighlightStyle(item.address)} 
                    />
                    {normalFormat(item.total_bond)}
                  </span>
                </Tooltip>
              );

            case "award":
              return (
                <Tooltip content={formatCurrency(runePrice * item.award)}>
                  <span className={styles.hoverable}>
                    <RuneAsset 
                      height="0.7rem" 
                      style={getHighlightStyle(item.address)} 
                    />
                    {item.award}
                  </span>
                </Tooltip>
              );

            case "vault":
              return (
                <div className={styles["vault-wrapper"]}>
                  <Tooltip content={item.vault}>
                    <ColorHash name={item.vault} />
                  </Tooltip>
                </div>
              );

            case "status":
              return (
                <Tooltip content={item.preflight?.reason || ""}>
                  <div
                    className={[
                      styles["mini-bubble"],
                      styles.hoverable,
                      item.status === "Standby" ? styles.yellow : "",
                      item.status === "Disabled" ? styles.danger : "",
                      item.status === "Whitelisted" ? styles.white : "",
                    ].join(" ")}
                    style={getHighlightStyle(item.address)}
                  >
                    <span>{item.status}</span>
                  </div>
                </Tooltip>
              );

            case "ip":
              return item.ip ? (
                <div className={styles["table-wrapper-row"]}>
                  <span>{item.ip}</span>
                  <Copy strCopy={item.ip} />
                </div>
              ) : (
                <span>-</span>
              );

            case "leave":
              return item.leave ? (
                <div className={styles["table-wrapper-row"]} style={{ justifyContent: "center" }}>
                  <ExitIcon 
                    className={styles["table-icon"]} 
                    style={{ fill: "var(--red)" }} 
                  />
                </div>
              ) : null;

            case "fee":
            case "score":
              return <span>{item[col.field]}</span>;

            case "operator":
              if (item.providers && item.providers.length > 10) {
                return (
                  <div style={{ cursor: "pointer" }}>
                    <Tooltip content="Click to see more">
                      <div className={styles.hoverable}>
                        <Link 
                          className={`${styles.clickable} ${styles.mono}`} 
                          target="_blank" 
                          href={`/address/${item.operator}`}
                          style={getHighlightStyle(item.address)}
                        >
                          {item.operator.slice(-4)}
                        </Link>
                        <div 
                          className={`${styles["bubble-container"]} ${styles.grey}`} 
                          onClick={() => openModal(item)}
                        >
                          {item.providers.length}
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                );
              } else if (item.providers && item.providers.length > 1) {
                return (
                  <Tooltip
                    content={
                      <div>
                        <table className={styles["provider-table"]}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left" }}>Address</th>
                              <th>Bond</th>
                              <th style={{ textAlign: "right" }}>Share</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterProviders(item.providers).map((p, i) => (
                              <tr key={i}>
                                <td style={{ display: "flex" }}>
                                  <Link 
                                    className={`${styles.hoverable} ${styles.mono} ${styles["external-link"]}`} 
                                    target="_blank"
                                    href={`/address/${p.bond_address}`}
                                  >
                                    {addressFormatV2(p.bond_address, 4, true)}
                                    <ExternalIcon className={styles["asset-icon"]} />
                                  </Link>
                                  <Copy strCopy={p.bond_address} size="small" hideToast={true} />
                                </td>
                                <td className={styles.mono}>
                                  <RuneAsset 
                                    height="0.7rem" 
                                    style={getHighlightStyle(item.address)} 
                                  />
                                  {formatNumber(p.bond / 10 ** 8, "0,0")}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <span className={styles.mono}>
                                    {formatNumber((p.bond / 10 ** 8 / item.total_bond) * 100, "0.00")}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <hr />
                        <div style={{ marginTop: "5px" }}>
                          <strong>Operator: </strong>
                          <span className={styles.mono}>
                            {item.operator.slice(-4)} - {item.fee}
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <div className={styles.hoverable}>
                      <Link 
                        className={`${styles.clickable} ${styles.mono}`} 
                        target="_blank" 
                        href={`/address/${item.operator}`}
                        style={getHighlightStyle(item.address)}
                      >
                        {item.operator.slice(-4)}
                      </Link>
                      <div className={`${styles["bubble-container"]} ${styles.grey}`}>
                        {item.providers ? item.providers.length : 0}
                      </div>
                    </div>
                  </Tooltip>
                );
              } else {
                return (
                  <div className={styles.hoverable}>
                    <Link 
                      className={`${styles.clickable} ${styles.mono}`} 
                      target="_blank" 
                      href={`/address/${item.operator}`}
                      style={getHighlightStyle(item.address)}
                    >
                      {item.operator.slice(-4)}
                    </Link>
                  </div>
                );
              }

            case "churn":
              return (
                <div className={styles["churn-wrapper"]}>
                  {item.churn?.map((churnItem, index) => (
                    <div key={index} className={styles["churn-item"]}>
                      <Tooltip
                        content={
                          churnItem.type !== "jail" ? (
                            churnItem.name
                          ) : (
                            <div>
                              <strong>{churnItem.name.reason}</strong>
                              <div style={{ marginTop: "0.5rem", padding: "4px" }}>
                                <div>
                                  <span>Released Height:</span>
                                  <span>{formatNumber(churnItem.name.release_height, "0,0")}</span>
                                </div>
                                {churnItem.name.releaseTime && (
                                  <div>
                                    <span>Release Time:</span>
                                    <span>{churnItem.name.releaseTime}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                      >
                        {React.createElement(churnItem.icon, {
                          className: styles["table-icon"],
                        })}
                      </Tooltip>
                    </div>
                  ))}
                  {(!item.churn || item.churn.length === 0) && !isFav(item.address) && <span>-</span>}
                  {isFav(item.address) && name === "active-nodes" && (
                    <div className={styles["rank-wrap"]}>
                      <span>{item.rank}</span>
                      <ProgressIcon 
                        dataNumber={rankChange(item.address, item.rank)}
                        isDown={rankChange(item.address, item.rank) < 0}
                      />
                    </div>
                  )}
                </div>
              );

            case "version":
              return (
                <span className={isUpgrading(item.version) ? styles.upgraded : ""}>
                  {item.version}
                </span>
              );

            default:
              if (col.field.includes("behind.")) {
                const value = parseInt(item[col.field]);
                if (value === 0) {
                  return (
                    <div className={styles["status-cell"]}>
                      <CheckIcon className={styles["status-icon"]} />
                      <span style={getHighlightStyle(item.address)} className={styles.version}>
                        OK
                      </span>
                    </div>
                  );
                } else if (isNaN(value) || item[col.field] === "") {
                  return (
                    <div className={styles["status-cell"]}>
                      <span>-</span>
                    </div>
                  );
                } else if (value > 0 && value < 10000) {
                  return (
                    <div className={styles["behind-cell"]}>
                      <WarningIcon className={styles["warning-icon"]} />
                      <span style={getHighlightStyle(item.address)} className={styles.number}>
                        -{formatNumber(value, "0a")}
                      </span>
                    </div>
                  );
                } else if (value < 0 && value > -10000) {
                  return (
                    <Tooltip content="Disabled">
                      <DangerIcon 
                        className={styles["table-icon"]} 
                        style={{ color: "#ef5350" }} 
                      />
                    </Tooltip>
                  );
                } else if (value > 10000) {
                  return (
                    <Tooltip content={item[col.field]}>
                      <DangerIcon 
                        className={styles["table-icon"]} 
                        style={{ fill: "#ffc107" }} 
                      />
                    </Tooltip>
                  );
                } else {
                  return (
                    <Tooltip content={item[col.field]}>
                      <DangerIcon 
                        className={styles["table-icon"]} 
                        style={{ fill: "#ef5350" }} 
                      />
                    </Tooltip>
                  );
                }
              } else if (col.field === "missing_blocks") {
                if (item.missing_blocks === 0) {
                  return (
                    <div className={styles["status-cell"]}>
                      <CheckIcon className={styles["status-icon"]} />
                      <span style={getHighlightStyle(item.address)} className={styles.version}>
                        OK
                      </span>
                    </div>
                  );
                } else if (item.missing_blocks !== null && item.missing_blocks !== undefined) {
                  return (
                    <div className={styles["behind-cell"]}>
                      <WarningIcon className={styles["warning-icon"]} />
                      <span style={getHighlightStyle(item.address)} className={styles.number}>
                        {formatNumber(-item.missing_blocks, "0,0")}
                      </span>
                    </div>
                  );
                } else {
                  return <span>-</span>;
                }
              } else if (col.field === "rpcHealth" || col.field === "bifrostHealth") {
                const health = getHealth(item, col);
                if (health.text !== "-") {
                  return (
                    <Tooltip content={health.title}>
                      <a
                        className={[
                          styles.clickable,
                          styles.hoverable,
                          health.text === "BAD" ? styles["bad-link"] : "",
                        ].join(" ")}
                        href={health.url}
                        target="_blank"
                        style={{ 
                          textDecoration: "none",
                          ...getHighlightStyle(item.address)
                        }}
                      >
                        {health.text}
                      </a>
                    </Tooltip>
                  );
                } else {
                  return <span>-</span>;
                }
              } else {
                return <span>{item[col.field]}</span>;
              }
          }
        },
      };

      return column;
    });
  }, [cols, favs, runePrice, name, rows]);

  if (!rows) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Table<NodeData>
        columns={tableColumns}
        data={rows}
        loading={false}
        enableSort={true}
        enableSelect={false}
        showLineNumbers={true}
        className={`vgt-table net-table bordered condensed node-table ${styles["node-table"]}`}
        searchOptions={{
          enabled: true,
          externalQuery: searchTerm,
        }}
        sortOptions={{
          enabled: true,
          initialSortBy: sortColumn
            ? [{ field: sortColumn, type: sortOrder }]
            : [],
        }}
        onSortChange={handleSortChange}
        rowStyleClass={rowClassCallback}
      />

      {showModal && selectedRow && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal-content"]}>
            <div className={styles["modal-header"]}>
              <h3>Operator Details</h3>
              <CrossIcon className={styles["close-btn"]} onClick={closeModal} />
            </div>
            <table className={styles["modal-table"]}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Address</th>
                  <th>Bond</th>
                  <th style={{ textAlign: "right" }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {filterProviders(selectedRow.providers).map((p, i) => (
                  <tr key={i}>
                    <td style={{ display: "flex" }}>
                      <Link 
                        className={`${styles.hoverable} ${styles.mono} ${styles["external-link"]}`} 
                        target="_blank"
                        href={`/address/${p.bond_address}`}
                      >
                        {addressFormatV2(p.bond_address, 4, true)}
                        <ExternalIcon className={styles["asset-icon"]} />
                      </Link>
                      <Copy strCopy={p.bond_address} size="small" hideToast={true} />
                    </td>
                    <td className={styles.mono}>
                      <RuneAsset 
                        height="0.7rem" 
                        style={getHighlightStyle(selectedRow.address)} 
                      />
                      {formatNumber(p.bond / 10 ** 8, "0,0")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={styles.mono}>
                        {formatNumber((p.bond / 10 ** 8 / selectedRow.total_bond) * 100, "0.00")}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles["footer-table"]}>
              <strong>Operator:</strong>
              <span className={styles.mono} style={{ marginLeft: "5px" }}>
                <Link 
                  className={styles.clickable} 
                  href={`/address/${selectedRow.operator}`} 
                  target="_blank"
                >
                  {selectedRow.operator.slice(-4)}
                </Link>
                - {selectedRow.fee}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeTable;