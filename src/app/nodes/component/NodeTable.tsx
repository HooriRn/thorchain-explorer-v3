"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { remove, orderBy } from "lodash";
import { rcompare } from "semver";
import Table from "@/components/table/Table";
import { TableColumn, TableData } from "@/components/table/types";
import { createCustomColumn } from "@/components/table/utils";
import Copy from "@/components/Copy";
import RuneAsset from "@/components/RuneAsset";
import ColorHash from "@/components/ColorHash";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import Tooltip from "@/components/Tooltip";
import {
  addressFormatV2,
  normalFormat,
  vaultColor,
  assetImage,
} from "@/utils/global";
import { number, formatPercent } from "@/utils/format";
import { useRunePrice } from "@/lib/store";
import { ProgressIcon } from "@/components/ui/ProgressIcon";
import styles from "./NodeTable.module.css";

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
import HighlightListIcon from "@/assets/images/highlight-list.svg";
import CrossIcon from "@/assets/images/cross.svg";
import NodeIcon from "@/assets/images/node.svg";
import MissingBlockIcon from "@/assets/images/missingblock.svg";

import CheapIcon from "@/assets/images/cheap.svg";
import OldIcon from "@/assets/images/old.svg";
import AngryIcon from "@/assets/images/angry.svg";
import VersionIcon from "@/assets/images/version.svg";
import ArrowDownSquareIcon from "@/assets/images/arrow-down-square.svg";
import HandcuffsIcon from "@/assets/images/handcuffs.svg";
import CircleUpIcon from "@/assets/images/circle-up.svg";
import WalkerIcon from "@/assets/images/walker.svg";
import HammerIcon from "@/assets/images/hammer.svg";

interface NodeTableProps {
  rows: any[];
  cols: any[];
  name: string;
  searchTerm?: string;
  sortColumn?: string | null;
  sortOrder?: string | null;
  onSortChange?: (params: { column: string; order: string }) => void;
}

interface Favorite {
  address: string;
  rank: number;
  lastRank?: number;
}

const ProviderMenu: React.FC<{
  providers: any[];
  operator: string;
  totalBond: number;
  fee: string;
  address: string;
  onOpenModal?: () => void;
  showMore?: boolean;
}> = ({
  providers,
  operator,
  totalBond,
  fee,
  address,
  onOpenModal,
  showMore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filterProviders = (arr: any[]) => {
    if (!arr) return [];
    return orderBy(
      arr?.map((a) => ({ ...a, bond: +a.bond })),
      ["bond"],
      ["desc"]
    );
  };

  const filteredProviders = filterProviders(providers);

  if (!providers || providers.length === 0) {
    return (
      <div className="hoverable">
        <Link
          className="clickable mono"
          target="_blank"
          href={`/address/${operator}`}
        >
          {operator.slice(-4)}
        </Link>
      </div>
    );
  }

  if (showMore && providers.length > 10) {
    return (
      <div className="hoverable">
        <Link
          className="clickable mono"
          target="_blank"
          href={`/address/${operator}`}
        >
          {operator.slice(-4)}
        </Link>
        <div className="bubble-container grey" onClick={onOpenModal}>
          {providers.length}
        </div>
        {isOpen && (
          <div className="popover-content">
            <div>Click to see more</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="hoverable" onClick={() => setIsOpen(!isOpen)}>
      <Link
        className="clickable mono"
        target="_blank"
        href={`/address/${operator}`}
      >
        {operator.slice(-4)}
      </Link>
      {providers.length !== 1 && (
        <div className="bubble-container grey">{providers.length}</div>
      )}
      {isOpen && (
        <div className={styles["popover-content"]}>
          <table className={styles["provider-table"]}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Address</th>
                <th>Bond</th>
                <th style={{ textAlign: "right" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{ display: "flex" }}>
                    <Link
                      className="hoverable mono external-link"
                      target="_blank"
                      href={`/address/${p.bond_address}`}
                    >
                      {addressFormatV2(p.bond_address, 4, true)}
                      <ExternalIcon className="asset-icon" />
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
                      {formatPercent(p.bond / 10 ** 8 / totalBond, 2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <div style={{ marginTop: "5px" }}>
            <strong>Operator: </strong>
            <span className="mono">
              {operator.slice(-4)} - {fee}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const ChurnMenu: React.FC<{
  churnItem: any;
}> = ({ churnItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getIconComponent = (iconPath: any) => {
    if (typeof iconPath === "string") {
      const iconMap: { [key: string]: any } = {
        "@/assets/images/cheap.svg": CheapIcon,
        "@/assets/images/old.svg": OldIcon,
        "@/assets/images/angry.svg": AngryIcon,
        "@/assets/images/version.svg": VersionIcon,
        "@/assets/images/arrow-down-square.svg": ArrowDownSquareIcon,
        "@/assets/images/handcuffs.svg": HandcuffsIcon,
        "@/assets/images/circle-up.svg": CircleUpIcon,
        "@/assets/images/walker.svg": WalkerIcon,
        "@/assets/images/hammer.svg": HammerIcon,
      };

      const Icon = iconMap[iconPath];
      if (Icon) {
        return <Icon className={styles["table-icon"]} width={16} height={16} />;
      }

      return (
        <img
          src={iconPath}
          alt={typeof churnItem.name === "string" ? churnItem.name : "churn"}
          width={16}
          height={16}
          className={styles["table-icon"]}
        />
      );
    }
    return null;
  };

  const IconComponent = getIconComponent(churnItem.icon);

  return (
    <div
      ref={menuRef}
      className={styles["churn-item"]}
      onClick={() => setIsOpen(!isOpen)}
    >
      {IconComponent}
      {isOpen && (
        <div className={styles["popover-content"]}>
          {churnItem.type !== "jail" ? (
            <span>{churnItem.name}</span>
          ) : (
            <div>
              <strong>
                {typeof churnItem.name === "object"
                  ? churnItem.name.reason?.charAt(0).toUpperCase() +
                    churnItem.name.reason?.slice(1)
                  : churnItem.name}
              </strong>
              <div style={{ marginTop: "0.5rem", padding: "4px" }}>
                <div>
                  <span>Released Height:</span>
                  <span>
                    {typeof churnItem.name === "object"
                      ? number(churnItem.name.release_height, "0,0")
                      : ""}
                  </span>
                </div>
                {typeof churnItem.name === "object" &&
                  churnItem.name.releaseTime && (
                    <div>
                      <span>Release Time:</span>
                      <span>{churnItem.name.releaseTime}</span>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NodeTable: React.FC<NodeTableProps> = ({
  rows = [],
  cols = [],
  name,
  searchTerm = "",
  sortColumn = null,
  sortOrder = null,
  onSortChange,
}) => {
  const runePrice = useRunePrice();

  const [favs, setFavs] = useState<Favorite[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  useEffect(() => {
    const savedFavs = localStorage.getItem(name);
    if (savedFavs) {
      setFavs(JSON.parse(savedFavs));
    }
  }, [name]);

  useEffect(() => {
    if (favs.length > 0 || localStorage.getItem(name)) {
      localStorage.setItem(name, JSON.stringify(favs));
    }
  }, [favs, name]);

  const getHighlightStyle = useCallback(
    (address: string): React.CSSProperties => {
      return {
        color: isFav(address) ? vaultColor(address, true) : "",
        fill: isFav(address) ? vaultColor(address, true) : "",
        fontWeight: isFav(address) ? "bold" : "normal",
      };
    },
    [favs]
  );

  const getHealthStatus = useCallback((value: any, row: any, column: any) => {
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
      return {
        text: "BAD",
        url,
        title: errorMessages[value] || value,
      };
    }

    return { text: "-", url: "", color: "", title: "" };
  }, []);

  const rankChange = useCallback(
    (address: string, rank: number): number => {
      const na = favs.find((f) => f.address === address);
      return na ? na.rank - rank : 0;
    },
    [favs]
  );

  const openModal = useCallback((row: any) => {
    setSelectedRow(row);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedRow(null);
  }, []);

  const loadRank = useCallback(() => {
    if (name === "active-nodes" && favs.length > 0) {
      const updatedFavs = favs.map((f) => {
        const nodeIndex = rows.findIndex((r) => r.address === f.address);
        if (nodeIndex !== -1) {
          if (!f.lastRank) {
            return { ...f, lastRank: f.rank };
          }
          return { ...f, rank: f.lastRank };
        }
        return f;
      });
      setFavs(updatedFavs);
    }
  }, [name, favs, rows]);

  const unloadRank = useCallback(() => {
    if (name === "active-nodes" && favs.length > 0) {
      let changed = false;
      const updatedFavs = favs.map((f, i) => {
        const nodeIndex = rows.findIndex((r) => r.address === f.address);
        if (nodeIndex !== -1 && f.lastRank !== nodeIndex + 1) {
          changed = true;
          return { ...f, lastRank: nodeIndex + 1 };
        }
        return f;
      });

      if (changed) {
        setFavs(updatedFavs);
        localStorage.setItem(name, JSON.stringify(updatedFavs));
      }
    }
  }, [name, favs, rows]);

  useEffect(() => {
    window.addEventListener("visibilitychange", unloadRank);
    return () => {
      window.removeEventListener("visibilitychange", unloadRank);
    };
  }, [unloadRank]);

  useEffect(() => {
    loadRank();
  }, [loadRank]);

  const isUpgrading = useCallback(
    (ver: string): boolean => {
      if (name !== "active-nodes" || !rows) {
        return false;
      }

      const onlyUnique = (value: string, index: number, array: string[]) => {
        return array.indexOf(value) === index;
      };

      const nodesVersion = rows.map((r) => r.version).sort(rcompare);
      const versions = nodesVersion.filter(onlyUnique);
      if (versions.length > 1 && ver === versions[0]) {
        return true;
      }
      return false;
    },
    [name, rows]
  );

  const filterProviders = useCallback((arr: any[]) => {
    if (!arr) {
      return [];
    }
    return orderBy(
      arr?.map((a) => ({ ...a, bond: +a.bond })),
      ["bond"],
      ["desc"]
    );
  }, []);

  const rowClassCallback = useCallback((row: any): string => {
    const classes = [styles["table-row"]];
    if (row.churn?.length > 0) {
      if (
        row.churn.some((e: any) => e.type === "churn-out" || e.type === "leave")
      ) {
        classes.push(styles["churning-out"]);
      }

      if (row.churn.some((e: any) => e.type === "churn-in")) {
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
      const updatedFavs = favs.filter((n) => n.address !== address);
      setFavs(updatedFavs);
    },
    [favs]
  );

  const isFav = useCallback(
    (address: string): boolean => {
      if (favs && favs.map((f) => f.address).includes(address)) {
        return true;
      }
      return false;
    },
    [favs]
  );

  const handleSortChange = useCallback(
    (action: any, state: any) => {
      if (!state || !state.sortKey) {
        return;
      }

      const sortOrderMap: { [key: string]: string } = {
        ASC: "asc",
        DESC: "desc",
      };

      if (onSortChange) {
        onSortChange({
          column: state.sortKey,
          order: sortOrderMap[state.sort] || "asc",
        });
      }
    },
    [onSortChange]
  );

  const formatCurrency = useCallback((value: number): string => {
    if (!value || isNaN(value)) return "$0.00";
    return `$${number(value, "0,0.00")}`;
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;

    const searchLower = searchTerm.toLowerCase();
    return rows.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchLower);
      });
    });
  }, [rows, searchTerm]);

  const tableColumns = useMemo((): TableColumn[] => {
    return cols
      .filter((col: any) => !col.hidden)
      .map((col: any) => {
        const baseColumn: TableColumn = {
          label: col.label,
          sortKey: col.field,
          minWidth: col.width ? parseInt(col.width) : undefined,
          width: col.width ? parseInt(col.width) : undefined,
          sortFn: col.sortFn,
          className: col.thClass || "",
          renderCell: (item: any) => {
            const row = item as any;
            const highlightStyle = getHighlightStyle(row.address);

            if (col.field === "address") {
              return (
                <div className={styles["table-wrapper-row"]}>
                  <Tooltip content={row.address}>
                    <Link
                      className="clickable"
                      style={highlightStyle}
                      href={`/address/${row.address}`}
                    >
                      {addressFormatV2(row.address, 4, true)}
                    </Link>
                  </Tooltip>
                  <Copy strCopy={row.address} />
                  <Link
                    style={highlightStyle}
                    href={`/node/${row.address}`}
                    target="_blank"
                  >
                    <InfoIcon
                      className={`${styles["table-icon"]} ${styles["item-link"]}`}
                    />
                  </Link>
                  <a
                    style={highlightStyle}
                    href={`http://${row.ip}:6040/status/scanner`}
                    target="_blank"
                    className={styles["item-link"]}
                  >
                    <JsonIcon className={styles["table-icon"]} />
                  </a>
                  <Tooltip content={row.ip}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>{row.ip}</span>
                      <Copy strCopy={row.ip} size="small" />
                    </div>
                  </Tooltip>
                  <a
                    style={highlightStyle}
                    href={`https://thornode.ninerealms.com/thorchain/node/${row.address}`}
                    target="_blank"
                    className={styles["item-link"]}
                  >
                    <NodeIcon className={styles["table-icon"]} />
                  </a>
                </div>
              );
            }

            if (col.field === "highlight") {
              return (
                <span>
                  {isFav(row.address) ? (
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
                  )}
                </span>
              );
            }

            if (col.field === "age") {
              return (
                <span>
                  {row.age ? (
                    <Tooltip content={row.age.info}>
                      <span style={{ cursor: "pointer" }}>
                        {number(row.age.number, "0,0.00")}
                      </span>
                    </Tooltip>
                  ) : (
                    "-"
                  )}
                </span>
              );
            }

            if (col.field === "isp") {
              return (
                <span>
                  {row.isp ? (
                    <div
                      className={styles["isp-container"]}
                      title={row.org || row.isp}
                    >
                      <span>{row.isp}</span>
                      {row.org && row.org !== row.isp && (
                        <span className={styles["org-name"]}>{row.org}</span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </span>
              );
            }

            if (col.field === "location") {
              return (
                <span>
                  {row.location ? (
                    <Tooltip
                      content={`${row.location.code}, ${row.location.city}`}
                    >
                      <div className={styles.countries}>
                        {/* Country flag emoji - using Unicode flag emojis */}
                        <span style={{ fontSize: "1.2rem" }}>
                          {row.location.code
                            ?.toUpperCase()
                            .split("")
                            .map((char: string) =>
                              String.fromCodePoint(127397 + char.charCodeAt(0))
                            )
                            .join("") || row.location.code}
                        </span>
                      </div>
                    </Tooltip>
                  ) : null}
                </span>
              );
            }

            if (col.field === "total_bond") {
              return (
                <span className="hoverable">
                  <Tooltip content={formatCurrency(runePrice * row.total_bond)}>
                    <span>
                      <RuneAsset height="0.7rem" style={highlightStyle} />
                      {normalFormat(row.total_bond)}
                    </span>
                  </Tooltip>
                </span>
              );
            }

            if (col.field === "award") {
              return (
                <span className="hoverable">
                  <Tooltip content={formatCurrency(runePrice * row.award)}>
                    <span>
                      <RuneAsset height="0.7rem" style={highlightStyle} />
                      {row.award}
                    </span>
                  </Tooltip>
                </span>
              );
            }

            if (col.field === "vault") {
              return (
                <div className={styles["vault-wrapper"]}>
                  <Tooltip content={row.vault}>
                    <ColorHash name={row.vault} />
                  </Tooltip>
                </div>
              );
            }

            if (col.field === "status") {
              return (
                <span>
                  <Tooltip
                    content={
                      row.preflight && row.preflight.reason
                        ? row.preflight.reason
                        : ""
                    }
                  >
                    <div
                      className={`${styles["mini-bubble"]} hoverable ${
                        row.status === "Standby"
                          ? styles.yellow
                          : row.status === "Disabled"
                          ? styles.danger
                          : row.status === "Whitelisted"
                          ? styles.white
                          : ""
                      }`}
                      style={highlightStyle}
                    >
                      <span>{row.status}</span>
                    </div>
                  </Tooltip>
                </span>
              );
            }

            if (col.field === "leave") {
              return (
                <span>
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
                </span>
              );
            }

            if (col.field === "fee") {
              return (
                <span>{col.formatFn ? col.formatFn(row.fee) : row.fee}</span>
              );
            }

            if (col.field === "score") {
              return (
                <span>{row.score ? number(row.score, "0,0.00") : "-"}</span>
              );
            }

            if (col.field === "operator") {
              const showMore = row.providers && row.providers.length > 10;
              const formattedRow: any = {};
              formattedRow.fee = col.formatFn
                ? col.formatFn(row.fee)
                : formatPercent(row.fee, 2);

              return (
                <ProviderMenu
                  providers={row.providers}
                  operator={row.operator}
                  totalBond={row.total_bond}
                  fee={formattedRow.fee}
                  address={row.address}
                  onOpenModal={() => openModal(row)}
                  showMore={showMore}
                />
              );
            }

            if (col.field === "churn") {
              const originalIndex = rows.findIndex(
                (r) => r.address === row.address
              );
              const churnItems = rows[originalIndex]?.churn || [];

              return (
                <div className={styles["churn-wrapper"]}>
                  {churnItems.map((churnItem: any, index: number) => (
                    <ChurnMenu key={index} churnItem={churnItem} />
                  ))}
                  {churnItems.length === 0 && !isFav(row.address) && (
                    <span>-</span>
                  )}
                  {isFav(row.address) && name === "active-nodes" && (
                    <div className={styles["rank-wrap"]}>
                      <span>{row.rank}</span>
                      <ProgressIcon
                        dataNumber={rankChange(row.address, row.rank)}
                        isDown={rankChange(row.address, row.rank) < 0}
                        size="0.7rem"
                      />
                    </div>
                  )}
                </div>
              );
            }

            if (col.field === "version") {
              const formattedValue = col.formatFn
                ? col.formatFn(row.version)
                : row.version;
              return (
                <span
                  className={isUpgrading(row.version) ? styles.upgraded : ""}
                >
                  {formattedValue}
                </span>
              );
            }

            if (col.field?.includes("behind.")) {
              const value = row.behind?.[col.field.replace("behind.", "")];
              if (parseInt(value) === 0) {
                return (
                  <span style={highlightStyle} className={styles.version}>
                    OK
                  </span>
                );
              }
              if (value === "" || value === null || value === undefined) {
                return <span>-</span>;
              }
              if (0 < value && value < 10000) {
                return (
                  <span style={highlightStyle} className={styles.number}>
                    -{number(value, "0a")}
                  </span>
                );
              }
              if (0 > value && value > -10000) {
                return (
                  <Tooltip content="Disabled">
                    <DangerIcon
                      className={styles["table-icon"]}
                      style={{ color: "#ef5350" }}
                    />
                  </Tooltip>
                );
              }
              if (value > 10000) {
                return (
                  <Tooltip content={`${value}`}>
                    <DangerIcon
                      className={styles["table-icon"]}
                      style={{ fill: "#ffc107" }}
                    />
                  </Tooltip>
                );
              }
              return (
                <Tooltip content={`${value}`}>
                  <DangerIcon
                    className={styles["table-icon"]}
                    style={{ fill: "#ef5350" }}
                  />
                </Tooltip>
              );
            }

            if (col.field === "missing_blocks") {
              if (row.missing_blocks === 0) {
                return (
                  <span style={highlightStyle} className={styles.version}>
                    OK
                  </span>
                );
              }
              if (
                row.missing_blocks !== null &&
                row.missing_blocks !== undefined
              ) {
                return (
                  <span style={highlightStyle} className={styles.number}>
                    {number(-row.missing_blocks, "0,0")}
                  </span>
                );
              }
              return <span>-</span>;
            }

            if (col.field === "rpcHealth" || col.field === "bifrostHealth") {
              const healthStatus = getHealthStatus(row[col.field], row, col);
              if (healthStatus.text !== "-") {
                return (
                  <span style={highlightStyle}>
                    <Tooltip content={healthStatus.title || ""}>
                      <a
                        className={`clickable hoverable ${
                          healthStatus.text === "BAD" ? styles["bad-link"] : ""
                        }`}
                        href={healthStatus.url}
                        target="_blank"
                        style={{
                          textDecoration: "none",
                          ...highlightStyle,
                        }}
                      >
                        {healthStatus.text}
                      </a>
                    </Tooltip>
                  </span>
                );
              }
              return <span>-</span>;
            }

            if (col.field === "apy") {
              return <span>{row.apy ? formatPercent(row.apy, 2) : "-"}</span>;
            }

            if (col.formatFn) {
              return <span>{col.formatFn(row[col.field])}</span>;
            }

            return (
              <span>
                {row[col.field] !== undefined && row[col.field] !== null
                  ? String(row[col.field])
                  : "-"}
              </span>
            );
          },
          headerRender: () => {
            if (col.field?.includes("behind")) {
              return (
                <div className={styles["table-asset"]}>
                  <img
                    className={styles["asset-chain"]}
                    src={assetImage(`${col.label}.${col.label}`)}
                    alt={col.label}
                  />
                </div>
              );
            }
            if (col.field === "highlight") {
              return (
                <span>
                  <HighlightListIcon className={styles["table-icon"]} />
                </span>
              );
            }
            if (col.field === "location") {
              return (
                <Tooltip content="Node Location">
                  <div>
                    <MarkerIcon className={styles["table-icon"]} />
                  </div>
                </Tooltip>
              );
            }
            if (col.field === "churn") {
              return (
                <div>
                  <RecycleIcon className={styles["table-icon"]} />
                </div>
              );
            }
            if (col.field === "vault") {
              return (
                <div className={styles["table-asset"]}>
                  <VaultIcon className={styles["table-icon"]} />
                </div>
              );
            }
            if (col.field === "missing_blocks") {
              return (
                <div className={styles["table-asset"]}>
                  <MissingBlockIcon className={styles["table-icon"]} />
                </div>
              );
            }
            return <span>{col.label}</span>;
          },
        };

        return baseColumn;
      });
  }, [
    cols,
    rows,
    getHighlightStyle,
    isFav,
    delFav,
    addFav,
    formatCurrency,
    runePrice,
    openModal,
    getHealthStatus,
    isUpgrading,
    name,
  ]);

  const tableData = useMemo(() => {
    return filteredRows.map((row, index) => ({
      ...row,
      id: row.address || index.toString(),
      _rowIndex: index,
      originalIndex: index,
    }));
  }, [filteredRows]);

  const rowProps = useCallback(
    (item: any) => {
      const row = item as any;
      return {
        className: rowClassCallback(row),
        style: getHighlightStyle(row.address),
      };
    },
    [rowClassCallback, getHighlightStyle]
  );

  return (
    <>
      {rows && rows.length > 0 && (
        <div>
          <Table
            columns={tableColumns}
            data={tableData}
            onSortChange={handleSortChange}
            rowProps={rowProps}
            enableSort={true}
            showLineNumbers={true}
            className={`vgt-table net-table bordered condensed ${styles["node-table"]}`}
          />
        </div>
      )}

      {/* Modal for operator details */}
      {showModal && selectedRow && (
        <div className={styles["modal-overlay"]} onClick={closeModal}>
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
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
                {filterProviders(selectedRow.providers || []).map(
                  (p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ display: "flex" }}>
                        <Link
                          className="hoverable mono external-link"
                          target="_blank"
                          href={`/address/${p.bond_address}`}
                        >
                          {addressFormatV2(p.bond_address, 4, true)}
                          <ExternalIcon className="asset-icon" />
                        </Link>
                        <Copy
                          strCopy={p.bond_address}
                          size="small"
                          hideToast={true}
                        />
                      </td>
                      <td className="mono">
                        <RuneAsset
                          height="0.7rem"
                          style={getHighlightStyle(selectedRow.address)}
                        />
                        {number(p.bond / 10 ** 8, "0,0")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="mono">
                          {formatPercent(
                            p.bond / 10 ** 8 / selectedRow.total_bond,
                            2
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <div className={styles["footer-table"]}>
              <strong>Operator:</strong>
              <span className="mono" style={{ marginLeft: "5px" }}>
                <Link
                  className="clickable"
                  href={`/address/${selectedRow.operator}`}
                  target="_blank"
                >
                  {selectedRow.operator.slice(-4)}
                </Link>
                - {formatPercent(selectedRow.fee, 2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NodeTable;
