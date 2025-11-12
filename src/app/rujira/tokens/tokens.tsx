"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/ui/Card";
import AssetIcon from "@/components/AssetIcon";
import Tooltip from "@/components/Tooltip";
import { assetFromString } from "@/utils";
import { formatVueNumber } from "@/utils/format";
import { getDenoms } from "@/lib/api";
import { getDenom } from "@/lib/api";
import SearchIcon from "@/assets/images/search.svg";
import InfoIcon from "@/assets/images/info.svg";
import styles from "./tokens.module.css";

interface DenomUnit {
  denom: string;
  exponent: number;
  aliases?: string[];
}

interface Metadata {
  base: string;
  display?: string;
  name?: string;
  symbol?: string;
  description?: string;
  uri?: string;
  supply?: number;
  owners?: number;
  denom_units?: DenomUnit[];
}

const TokensPage: React.FC = () => {
  const router = useRouter();
  const [metadataList, setMetadataList] = useState<Metadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentFilter, setCurrentFilter] = useState<string>("ALL");

  const filteredMetadata = useMemo(() => {
    if (!metadataList?.length) return [];

    const query = searchTerm.trim().toLowerCase();

    return metadataList.filter((metadata) => {
      const matchesSearch =
        !query ||
        (metadata.name && metadata.name.toLowerCase().includes(query)) ||
        (metadata.symbol && metadata.symbol.toLowerCase().includes(query)) ||
        (metadata.description &&
          metadata.description.toLowerCase().includes(query)) ||
        (metadata.base && metadata.base.toLowerCase().includes(query)) ||
        (metadata.display && metadata.display.toLowerCase().includes(query)) ||
        (metadata.denom_units &&
          metadata.denom_units.some(
            (unit) =>
              unit.denom.toLowerCase().includes(query) ||
              (unit.aliases &&
                unit.aliases.some((alias) =>
                  alias.toLowerCase().includes(query)
                ))
          ));

      let matchesFilter = true;
      if (currentFilter === "BASE") {
        matchesFilter = metadata.base === metadata.display;
      } else if (currentFilter === "SYMBOL") {
        matchesFilter = metadata.symbol && metadata.symbol.length > 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [metadataList, searchTerm, currentFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMiddleware();
      } catch (error) {
        await fetchMetadata();
      }
    };

    fetchData();
  }, []);

  const formatContractAsset = (asset: string): string => {
    const a = assetFromString(asset);
    if (a) {
      return a.ticker?.toUpperCase() ?? a;
    }
    return asset;
  };

  const fetchMiddleware = async () => {
    try {
      const data = await getDenoms();
      setMetadataList(data || []);
      setLoading(false);
    } catch (error) {
      throw error;
    }
  };

  const fetchMetadata = async () => {
    try {
      const response = await getDenom();
      setMetadataList(response?.metadatas || []);
    } catch (error) {
      console.error("Error fetching denom metadata:", error);
      setMetadataList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (base: string) => {
    router.push(`/holders?asset=${base}`);
  };

  return (
    <PageContainer error={false}>
      <div className={styles["search-container"]}>
        <div className={styles["nodes-search-container"]}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or symbol"
            className={styles["search-input"]}
          />
          <SearchIcon className={styles["search-icon"]} />
        </div>
      </div>
      <div className={styles["metadata-grid"]}>
        {filteredMetadata.map((metadata) => (
          <div
            key={metadata.base}
            className={styles["metadata-card"]}
            onClick={() => handleCardClick(metadata.base)}
          >
            <Card>
              <div className={styles["metadata-header"]}>
                <h3 className={styles["header-class"]}>
                  <AssetIcon
                    asset={assetFromString(metadata.base)}
                    chain={false}
                    height="1.8rem"
                  />
                  <span>{formatContractAsset(metadata.base)}</span>
                </h3>
                {metadata.description && (
                  <div className={styles["description-container"]}>
                    <Tooltip content={metadata.description}>
                      <InfoIcon className={styles["description-button"]} />
                    </Tooltip>
                  </div>
                )}
              </div>

              <div className={styles["metadata-content"]}>
                <div className={styles["metadata-field"]}>
                  <label>Symbol:</label>
                  <div>{metadata.symbol}</div>
                </div>

                <div className={styles["metadata-field"]}>
                  <label>Base:</label>
                  <Tooltip content={metadata.base}>
                    <div>{metadata.base}</div>
                  </Tooltip>
                </div>

                {metadata.base !== metadata.display && (
                  <div className={styles["metadata-field"]}>
                    <label>Display:</label>
                    <div>{metadata.display}</div>
                  </div>
                )}

                {metadata.uri && (
                  <div className={styles["metadata-field"]}>
                    <label>URI:</label>
                    <a
                      href={metadata.uri}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {metadata.uri}
                    </a>
                  </div>
                )}

                <div className={styles["supplies"]}>
                  {metadata.supply && (
                    <div className={styles["metadata-field"]}>
                      <label>Supply:</label>
                      <div>
                        {formatVueNumber(metadata.supply / 1e8, "0,0.00")}
                      </div>
                    </div>
                  )}

                  {metadata.owners && (
                    <div className={styles["metadata-field"]}>
                      <label>Holders:</label>
                      <Link
                        href={`/holders?asset=${metadata.base}`}
                        className={styles["clickable"]}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatVueNumber(metadata.owners, "0,0")}
                      </Link>
                    </div>
                  )}
                </div>

                {metadata.denom_units && (
                  <div className={styles["denom-units-section"]}>
                    <div className={styles["denom-units-container"]}>
                      {metadata.denom_units.map((unit, index) => (
                        <div key={index} className={styles["denom-unit"]}>
                          <div className={styles["denom-unit-field"]}>
                            <div className={styles["denom-unit-label"]}>
                              Denom:
                            </div>
                            <Tooltip content={unit.denom}>
                              <span>{unit.denom}</span>
                            </Tooltip>
                          </div>
                          <div className={styles["denom-unit-exponent"]}>
                            <div className={styles["denom-unit-label"]}>
                              Exponent:
                            </div>
                            <span>{unit.exponent}</span>
                          </div>
                          {unit.aliases && unit.aliases.length > 0 && (
                            <div className={styles["denom-unit-field"]}>
                              <span className={styles["denom-unit-label"]}>
                                Aliases:
                              </span>
                              <span>{unit.aliases.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default TokensPage;
