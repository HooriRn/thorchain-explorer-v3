"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { remove, orderBy } from "lodash";
import { rcompare } from "semver";
import { useRunePrice } from "@/lib/store";
import {
  assetImage,
  addressFormatV2,
  normalFormat,
  formatCurrency,
  vaultColor,
} from "@/utils/global";
import { number } from "@/utils/format";
import { Table, TableColumn } from "@/components/table";
import Copy from "@/components/Copy";
import Ip from "@/components/Ip";
import CloudImage from "@/components/CloudImage";
import VFlag from "@/components/VFlag";
import RuneAsset from "@/components/RuneAsset";
import ColorHash from "@/components/ColorHash";
import { ProgressIcon } from "@/components/ui/ProgressIcon";

import JsonIcon from "@/assets/images/json.svg";
import InfoIcon from "@/assets/images/info.svg";
import StarIcon from "@/assets/images/bookmark.svg";
import StaredIcon from "@/assets/images/bookmarked.svg";
import ExitIcon from "@/assets/images/arrow-down-square.svg";
import DangerIcon from "@/assets/images/danger.svg";
import MarkerIcon from "@/assets/images/marker.svg";
import RecycleIcon from "@/assets/images/recycle.svg";
import ExternalIcon from "@/assets/images/external.svg";
import VaultIcon from "@/assets/images/safe.svg";
import HighlightList from "@/assets/images/highlight-list.svg";
import CrossIcon from "@/assets/images/cross.svg";
import NodeIcon from "@/assets/images/node.svg";
import MissingBlock from "@/assets/images/missingblock.svg";
import {
  formatVueNumber,
} from "@/utils/format";
import styles from "./NodeTable.module.css";

interface NodeData {
  address: string;
  rank: number;
  ip: string;
  version: string;
  status: string;
  age?: { number?: number; info?: string };
  isp?: string;
  org?: string;
  location?: { code: string; city: string };
  total_bond: number;
  award: number;
  vault?: string;
  preflight?: { reason?: string };
  leave?: boolean;
  fee?: number;
  score?: number;
  operator?: string;
  providers?: Array<{ bond_address: string; bond: number }>;
  churn?: Array<{ type: string; icon: string; name: string }>;
  missing_blocks?: number;
  rpcHealth?: boolean | string;
  bifrostHealth?: boolean | string;
  originalIndex?: number;
  [key: string]: any;
}

interface ColumnConfig {
  label: string;
  field: string;
  hidden?: boolean;
  tdClass?: string;
}

interface NodeTableProps {
  rows: NodeData[];
  cols: ColumnConfig[];
  name: string;
  searchTerm?: string;
  sortColumn?: string | null;
  sortOrder?: string | null;
  onSortChanged?: (params: { column: string; order: string }) => void;
}

interface Favorite {
  address: string;
  rank: number;
  lastRank?: number;
}

interface HealthStatus {
  text: string;
  url: string;
  title: string;
}
const customTheme = {
  HeaderCell: `
      border-right: 1px solid var(--border) !important;
      &:last-child {
          border-right: none !important;
        }
      `,
  Row: `
      background: transparent;
      border-bottom: 1px solid var(--border) !important;
      
      &:hover {
        background-color: var(--muted);
      }
      
      &:last-child {
        border-bottom: none !important;
      }
      `,
  Cell: `
      border-right: 1px solid var(--border) !important;
      border-bottom: 1px solid var(--border) !important;

      &:last-child {
        border-right: none !important;
      }
    `,
};
const NodeTable: React.FC<NodeTableProps> = ({
  rows,
  cols,
  name,
  searchTerm = "",
  onSortChanged,
}) => {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<NodeData | null>(null);
  const [filteredRows, setFilteredRows] = useState<NodeData[]>([]);

  const runePrice = useRunePrice();

  useEffect(() => {
    const savedFavs = localStorage.getItem(name);
    if (savedFavs) {
      setFavs(JSON.parse(savedFavs));
    }
  }, [name]);

  useEffect(() => {
    if (favs.length > 0) {
      localStorage.setItem(name, JSON.stringify(favs));
    }
  }, [favs, name]);

  const loadRank = useCallback(() => {
    if (name === "active-nodes" && favs.length > 0 && rows) {
      const updatedFavs = [...favs];
      rows.forEach((node, index) => {
        const favIndex = updatedFavs.findIndex(
          (f) => f.address === node.address
        );
        if (favIndex !== -1) {
          if (!updatedFavs[favIndex].lastRank) {
            updatedFavs[favIndex].lastRank = updatedFavs[favIndex].rank;
          }
          updatedFavs[favIndex].rank =
            updatedFavs[favIndex].lastRank || index + 1;
        }
      });
      setFavs(updatedFavs);
    }
  }, [name, favs, rows]);

  

  const unloadRank = useCallback(() => {
    if (name === "active-nodes" && favs.length > 0 && rows) {
      let changed = false;
      const updatedFavs = [...favs];
      rows.forEach((node, index) => {
        const favIndex = updatedFavs.findIndex(
          (f) => f.address === node.address
        );
        if (favIndex !== -1 && updatedFavs[favIndex].lastRank !== index + 1) {
          updatedFavs[favIndex].lastRank = index + 1;
          changed = true;
        }
      });
      if (changed) {
        setFavs(updatedFavs);
      }
    }
  }, [name, favs, rows]);


  useEffect(() => {
    loadRank();
    const handleVisibilityChange = () => unloadRank();
    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [rows, loadRank, unloadRank]);

  useEffect(() => {
    if (!rows) {
      setFilteredRows([]);
      return;
    }

    let filtered = [...rows];

    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) => {
        return Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    setFilteredRows(
      filtered.map((row, index) => ({ ...row, originalIndex: index }))
    );
  }, [rows, searchTerm]);

  const isFav = useCallback(
    (address: string) => {
      return favs && favs.map((f) => f.address).includes(address);
    },
    [favs]
  );

  const getHighlightStyle = useCallback(
    (address: string) => {
      return {
        color: isFav(address) ? vaultColor(address, true) : "",
        fill: isFav(address) ? vaultColor(address, true) : "",
        fontWeight: isFav(address) ? "bold" : "normal",
      };
    },
    [isFav]
  );

  const getHealthStatus = useCallback(
    (
      value: boolean | string | null | undefined,
      row: NodeData,
      columnField: string
    ): HealthStatus => {
      if (value === null || value === undefined) {
        return { text: "-", url: "", title: "" };
      }

      const ip = row.ip;
      let url = "";
      if (columnField === "bifrostHealth") {
        url = `http://${ip}:6040/p2pid`;
      } else if (columnField === "rpcHealth") {
        url = `http://${ip}:27147/health?`;
      }

      const errorMessages: Record<string, string> = {
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
    },
    []
  );

  const rankChange = useCallback(
    (address: string, rank: number) => {
      const na = favs.find((f) => f.address === address);
      return na ? na.rank - rank : 0;
    },
    [favs]
  );

  const openModal = useCallback((row: NodeData) => {
    setSelectedRow(row);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedRow(null);
  }, []);

  const isUpgrading = useCallback(
    (ver: string) => {
      if (name !== "active-nodes" || !rows) {
        return false;
      }

      const nodesVersion = rows.map((r) => r.version).sort(rcompare);
      const versions = [...new Set(nodesVersion)];
      if (versions.length > 1 && ver === versions[0]) {
        return true;
      }
      return false;
    },
    [name, rows]
  );

  const filterProviders = useCallback(
    (arr: Array<{ bond_address: string; bond: number }> | undefined) => {
      if (!arr) {
        return [];
      }
      return orderBy(
        arr.map((a) => ({ ...a, bond: +a.bond })),
        ["bond"],
        ["desc"]
      );
    },
    []
  );

  const rowStyleClass = useCallback((row: NodeData) => {
    const classes: string[] = [];
    if (row.churn && row.churn.length > 0) {
      if (row.churn.some((e) => e.type === "churn-out" || e.type === "leave")) {
        classes.push(styles["churning-out"]);
      }

      if (row.churn.some((e) => e.type === "churn-in")) {
        classes.push(styles["churning-in"]);
      }
    }

    return classes.join(" ");
  }, []);

  const addFav = useCallback(
    (address: string, rank: number) => {
      if (address) {
        setFavs([...favs, { address, rank, lastRank: rank }]);
      }
    },
    [favs]
  );

  const delFav = useCallback(
    (address: string) => {
      const newFavs = [...favs];
      remove(newFavs, (n) => n.address === address);
      setFavs(newFavs);
    },
    [favs]
  );

  const handleSortChange = useCallback(
    (params: Array<{ field: string; type: string }>) => {
      if (onSortChanged && params && params[0]) {
        onSortChanged({
          column: params[0].field,
          order: params[0].type,
        });
      }
    },
    [onSortChanged]
  );

  const tableColumns = useMemo((): TableColumn<NodeData>[] => {
    return cols.map((col) => {
      const column: Partial<TableColumn<NodeData>> = {
        label: col.label,
        sortKey: col.field,
        field: col.field,
        hidden: col.hidden,
        className: col.tdClass,
      };

      if (col.field.includes("behind")) {
        column.headerRender = () => (
          <div className={styles["table-asset"]}>
            <img
              className={styles["asset-chain"]}
              src={assetImage(`${col.label}.${col.label}`)}
              alt={col.label}
            />
          </div>
        );
      } else if (col.field === "highlight") {
        column.headerRender = () => (
          <HighlightList className={styles["table-icon"]} />
        );
      } else if (col.field === "location") {
        column.headerRender = () => (
          <div title="Node Location">
            <MarkerIcon className={styles["table-icon"]} />
          </div>
        );
      } else if (col.field === "churn") {
        column.headerRender = () => (
          <RecycleIcon className={styles["table-icon"]} />
        );
      } else if (col.field === "vault") {
        column.headerRender = () => (
          <div className={styles["table-asset"]}>
            <VaultIcon className={styles["table-icon"]} />
          </div>
        );
      } else if (col.field === "missing_blocks") {
        column.headerRender = () => (
          <div className={styles["table-asset"]}>
            <MissingBlock className={styles["table-icon"]} />
          </div>
        );
      }

      column.renderCell = (row: NodeData) => {
        const fieldValue = row[col.field];
        const highlightStyle = getHighlightStyle(row.address);

        if (col.field === "address") {
          return (
            <div className={styles["table-wrapper-row"]} style={highlightStyle}>
              <Link
                href={`/address/${row.address}`}
                className={styles["clickable"]}
                style={{
                  color: "var(--primary)",
                  fontFamily: "Roboto Mono !important",
                }}
                title={row.address}
              >
                {addressFormatV2(row.address, 4, true)}
              </Link>
              <Copy strCopy={row.address} />
              <Link
                href={`/node/${row.address}`}
                target="_blank"
                style={highlightStyle}
              >
                <InfoIcon
                  className={`${styles["table-icon"]} ${styles["item-link"]}`}
                />
              </Link>
              <a
                style={highlightStyle}
                href={`http://${row.ip}:6040/status/scanner`}
                target="_blank"
                rel="noreferrer"
              >
                <JsonIcon
                  className={`${styles["table-icon"]} ${styles["item-link"]}`}
                />
              </a>
              <Ip strCopy={row.ip} />
              <a
                style={highlightStyle}
                href={`https://thornode.ninerealms.com/thorchain/node/${row.address}`}
                target="_blank"
                rel="noreferrer"
              >
                <NodeIcon
                  className={`${styles["table-icon"]} ${styles["item-link"]}`}
                />
              </a>
            </div>
          );
        }

        if (col.field === "highlight") {
          return isFav(row.address) ? (
            <StaredIcon
              className={styles["table-icon"]}
              style={highlightStyle}
              onClick={() => delFav(row.address)}
            />
          ) : (
            <StarIcon
              className={styles["table-icon"]}
              onClick={() => addFav(row.address, row.rank)}
            />
          );
        }

        if (col.field === "age") {
          return row.age ? (
            <span title={row.age.info} style={{ cursor: "pointer" }}>
              {number(row.age.number || 0, "0,0.00")}
            </span>
          ) : (
            <span>-</span>
          );
        }

if (col.field === "isp") {
  
  return row.isp || row.org ? (
    <CloudImage name={[row.isp || '', row.org || '']} />
  ) : (
    <span>-</span>
  );
}

if (col.field === "location") {
  return row.location ? (
    <div 
      className={styles["location-cell"]}
      title={`${row.location.city || ''}, ${row.location.code || ''}`}
    >
      <VFlag 
        flag={row.location.code} 
        className={styles["country-flag"]}
      />
    
    </div>
  ) : (
    <span>-</span>
  );
}

if (col.field === "total_bond") {
  return (
    <span
      className={styles["hoverable"]}
      title={formatVueNumber(runePrice * row.total_bond)}
    >
      <RuneAsset height="0.7rem" />
      {normalFormat(row.total_bond, formatVueNumber)} 
    </span>
  );
}

        if (col.field === "award") {
          return (
            <span
              className={styles["hoverable"]}
              title={formatVueNumber(runePrice * row.award)}
            >
              <RuneAsset height="0.7rem" />
              {(row.award)}
            </span>
          );
        }

        if (col.field === "apy") {
        return (
          <span style={highlightStyle} className="mono center">
            {number((fieldValue || 0) * 100, "0,0.00")}%
          </span>
        );
      }

        if (col.field === "vault") {
          return (
            <div className={styles["vault-wrapper"]} title={row.vault}>
              <ColorHash name={row.vault || ""} />
            </div>
          );
        }

        if (col.field === "status") {
          return (
            <div
              className={`${styles["mini-bubble"]} ${styles["hoverable"]} ${
                row.status === "Standby" ? styles["yellow"] : ""
              } ${row.status === "Disabled" ? styles["danger"] : ""} ${
                row.status === "Whitelisted" ? styles["white"] : ""
              }`}
              style={highlightStyle}
              title={row.preflight?.reason}
            >
              <span>{row.status}</span>
            </div>
          );
        }

        if (col.field === "ip") {
          return row.ip ? (
            <div className={styles["table-wrapper-row"]}>
              <span>{row.ip}</span>
              <Copy strCopy={row.ip} />
            </div>
          ) : (
            <span>-</span>
          );
        }

        if (col.field === "leave") {
          return (
            <div
              className={styles["table-wrapper-row"]}
              style={{ justifyContent: "center" }}
            >
              {row.leave === true && (
                <ExitIcon
                  className={styles["table-icon"]}
                  style={{ fill: "var(--red)" }}
                />
              )}
            </div>
          );
        }

        if (col.field === "fee") {
          return <span>{number((fieldValue || 0) * 100, "0,0.00")}%</span>;
        }

        if (col.field === "score") {
          return <span>{number(fieldValue || 0, "0,0.00")}</span>;
        }

        if (col.field === "operator") {
          if (row.providers && row.providers.length > 10) {
            return (
              <div style={{ cursor: "pointer" }}>
                <div className={styles["hoverable"]}>
                  <Link
                    className={`${styles["clickable"]} mono`}
                    href={`/address/${row.operator}`}
                    target="_blank"
                    style={highlightStyle}
                  >
                    {row.operator?.slice(-4)}
                  </Link>
                  <div
                    className={`${styles["bubble-container"]} ${styles["grey"]}`}
                    onClick={() => openModal(row)}
                  >
                    {row.providers.length}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className={styles["hoverable"]}>
              <Link
                className={`${styles["clickable"]} mono`}
                href={`/address/${row.operator}`}
                target="_blank"
                style={highlightStyle}
              >
                {row.operator?.slice(-4)}
              </Link>
              {row.providers && row.providers.length !== 1 && (
                <div
                  className={`${styles["bubble-container"]} ${styles["grey"]}`}
                >
                  {row.providers ? row.providers.length : 0}
                </div>
              )}
            </div>
          );
        }

        if (col.field === "churn") {
          const churnData = rows[row.originalIndex || 0]?.churn || [];
          return (
            <div className={styles["churn-wrapper"]}>
              {churnData.map((churnItem, index: number) => {
                const IconComponent = churnItem.icon;
                return (
                  <div
                    key={index}
                    className={styles["churn-item"]}
                    title={churnItem.name}
                  >
                    {typeof IconComponent === "string" ? (
                      <img
                        src={IconComponent}
                        className={styles["table-icon"]}
                        alt={churnItem.name}
                      />
                    ) : IconComponent ? (
                      React.createElement(IconComponent, {
                        className: styles["table-icon"],
                      })
                    ) : null}
                  </div>
                );
              })}
              {churnData.length === 0 && !isFav(row.address) && <span>-</span>}
              {isFav(row.address) && name === "active-nodes" && (
                <div className={styles["rank-wrap"]}>
                  <span>{row.rank}</span>
                  <ProgressIcon
                    dataNumber={rankChange(row.address, row.rank)}
                    isDown={rankChange(row.address, row.rank) < 0}
                  />
                </div>
              )}
            </div>
          );
        }

        if (col.field === "version") {
          return (
            <span className={isUpgrading(fieldValue) ? styles["upgraded"] : ""}>
              {fieldValue}
            </span>
          );
        }

        if (col.field.includes("behind.")) {
          const chain = col.field.replace("behind.", "");
          const behindRawValue = row.behind ? row.behind[chain] : undefined;
          
        
          
          const behindValue = behindRawValue !== undefined ? parseInt(behindRawValue) : null;
          
          if (behindValue === 0) {
            return (
              <span style={highlightStyle} className={styles["version"]}>
                OK
              </span>
            );
          } else if (behindValue === null || behindValue === undefined || isNaN(behindValue)) {
            return <span>-</span>;
          } else if (behindValue > 0 && behindValue < 10000) {
            return (
              <span style={highlightStyle} className={styles["number"]}>
                -{behindValue.toLocaleString()}
              </span>
            );
          } else if (behindValue < 0 && behindValue > -10000) {
            return (
              <DangerIcon
                title="Disabled"
                className={styles["table-icon"]}
                style={{ color: "#ef5350" }}
              />
            );
          } else if (behindValue > 10000) {
            return (
              <DangerIcon
                title={`${behindValue}`}
                className={styles["table-icon"]}
                style={{ fill: "#ffc107" }}
              />
            );
          } else {
            return (
              <DangerIcon
                title={`${behindValue}`}
                className={styles["table-icon"]}
                style={{ fill: "#ef5350" }}
              />
            );
          }
        }
        
        if (col.field === "missing_blocks") {
          const missingBlocksValue = row.missing_blocks;
          
         
          
          const numericValue = typeof missingBlocksValue === 'string' 
            ? parseInt(missingBlocksValue) 
            : missingBlocksValue;
          
          if (numericValue === 0) {
            return (
              <span style={highlightStyle} className={styles["version"]}>
                OK
              </span>
            );
          } else if (numericValue !== null && numericValue !== undefined && numericValue > 0) {
            return (
              <span style={highlightStyle} className={styles["number"]}>
                {(-numericValue).toLocaleString()}
              </span>
            );
          } else {
            return <span>-</span>;
          }
        }

        if (col.field === "missing_blocks") {
          const missingBlocksValue = row.missing_blocks;
          
          if (missingBlocksValue === 0) {
            return (
              <span style={highlightStyle} className={styles["version"]}>
                OK
              </span>
            );
          } else if (missingBlocksValue !== null && missingBlocksValue !== undefined && missingBlocksValue > 0) {
            return (
              <span style={highlightStyle} className={styles["number"]}>
                {(-missingBlocksValue).toLocaleString()}
              </span>
            );
          } else {
            return <span>-</span>;
          }
        }

        if (col.field === "rpcHealth" || col.field === "bifrostHealth") {
          const health = getHealthStatus(
            fieldValue as boolean | string,
            row,
            col.field
          );
          if (health.text !== "-") {
            return (
              <a
                className={`${styles["clickable"]} ${styles["hoverable"]} ${
                  health.text === "BAD" ? styles["bad-link"] : ""
                }`}
                href={health.url}
                target="_blank"
                rel="noreferrer"
                title={health.title}
                style={highlightStyle}
              >
                {health.text}
              </a>
            );
          }
          return <span>-</span>;
        }

        return <span>{fieldValue}</span>;
      };

      return column as TableColumn<NodeData>;
    });
  }, [
    cols,
    rows,
    runePrice,
    getHighlightStyle,
    isFav,
    addFav,
    delFav,
    openModal,
    rankChange,
    name,
    isUpgrading,
    getHealthStatus,
  ]);

  return (
    <div>
      <Table
        columns={tableColumns}
        data={filteredRows}
        loading={false}
        enableSort={true}
        enableSelect={false}
        showLineNumbers={true}
        className={`vgt-table net-table bordered condensed ${styles["node-table"]}`}
        rowStyleClass={rowStyleClass}
        onSortChange={handleSortChange}
        onRowSelectChange={() => {}}
        customTheme={customTheme}
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
                {filterProviders(selectedRow.providers).map((p, i: number) => (
                  <tr key={i}>
                    <td style={{ display: "flex" }}>
                      <Link
                        className={`${styles["hoverable"]} mono ${styles["external-link"]}`}
                        href={`/address/${p.bond_address}`}
                        target="_blank"
                      >
                        {addressFormatV2(p.bond_address, 4, true)}
                        <ExternalIcon className={styles["asset-icon"]} />
                      </Link>
                      <Copy
                        strCopy={p.bond_address}
                        size="small"
                        hideToast={true}
                      />
                    </td>
                    <td className="mono">
                      <RuneAsset height="0.7rem" />
                      {number(p.bond / 10 ** 8, "0,0")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="mono">
                        {number(
                          (p.bond / 10 ** 8 / selectedRow.total_bond) * 100,
                          "0,0.00"
                        )}
                        %
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles["footer-table"]}>
              <strong>Operator: </strong>
              <span className="mono" style={{ marginLeft: "5px" }}>
                <Link
                  className={styles["clickable"]}
                  href={`/address/${selectedRow.operator}`}
                  target="_blank"
                >
                  {selectedRow.operator?.slice(-4)}
                </Link>
                - {number((selectedRow.fee || 0) * 100, "0,0.00")}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeTable;
