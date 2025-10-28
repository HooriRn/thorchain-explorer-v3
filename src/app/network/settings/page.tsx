"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import PageContainer from "@/components/PageContainer";
import Nav from "@/components/Nav";
import InfoCard from "@/components/InfoCard";
import Card from "@/components/ui/Card";
import Table from "@/components/table/Table";
import { createCustomColumn, createTextColumn } from "@/components/table/utils";
import InfoIcon from "@/assets/images/info.svg";
import SearchIcon from "@/assets/images/search.svg";
import { getConstants, getMimir } from "@/lib/api";
import { useRunePrice } from "@/lib/store";
import { blockTime } from "@/lib/utils";
import { parseConstant, normalFormat, formatRune } from "@/utils/global";
import { number, formatVueNumber, formatPercentToString } from "@/utils/format";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import styles from "./settings.module.css";

interface NavItem {
  mode: string;
  text: string;
}

interface CombinedSetting {
  name: string;
  value: any;
  status: string;
  key: string;
  extraInfo?: string;
}

const SettingsPage: React.FC = () => {
  const runePrice = useRunePrice();
  const [networkConst, setNetworkConst] = useState<any>([]);
  const [mimir, setMimir] = useState<any>(undefined);
  const [combinedSettings, setCombinedSettings] = useState<CombinedSetting[]>(
    []
  );
  const [searchKey, setSearchKey] = useState("");
  const [activeView, setActiveView] = useState("info");

  const navItems: NavItem[] = [
    { text: "Settings Overview", mode: "info" },
    { text: "Detailed Constants/Mimir", mode: "table" },
  ];

  const parseConstantWithContext = useCallback(
    (key: string, options?: any) => {
      return parseConstant(key, options, mimir, networkConst);
    },
    [mimir, networkConst]
  );

  const networkSettings = React.useMemo(() => {
    if (!networkConst || !mimir) return [];

    return [
      {
        title: "Outbound Transactions",
        rowStart: 1,
        colSpan: "1",
        items: [
          {
            ...parseConstantWithContext("OutboundTransactionFee"),
            filter: (v: any) => `${normalFormat(v, number)} RUNE`,
            usdValue: true,
          },
          {
            ...parseConstantWithContext("MaxTxOutOffset", {
              extraText: blockTime(
                networkConst?.int_64_values?.MaxTxOutOffset,
                undefined
              ),
            }),
            filter: (v: any) => `${normalFormat(v, number)}`,
          },
          {
            ...parseConstantWithContext("MinTxOutVolumeThreshold"),
            filter: (v: any) => `${normalFormat(v / 1e8, number)}`,
          },
          {
            ...parseConstantWithContext("TxOutDelayMax", {
              extraText: blockTime(
                networkConst?.int_64_values?.TxOutDelayMax,
                undefined
              ),
            }),
            filter: (v: any) => `${formatVueNumber(v, "0,0")}`,
          },
          {
            ...parseConstantWithContext("TxOutDelayRate"),
            filter: (v: any) => `${formatVueNumber(v, "0,0")}`,
          },
          {
            header: "Trading",
          },
          {
            name: "All Trading are Halted",
            value: mimir?.HALTTRADING
              ? mimir?.HALTTRADING > 1
                ? mimir?.HALTTRADING
                : "Yes"
              : "No",
            ...(mimir?.HALTTRADING > 1 && {
              extraInfo: "The block height Trading will be halted",
            }),
          },
          {
            header: "Synths",
          },
          {
            ...parseConstantWithContext("MaxSwapsPerBlock"),
          },
          {
            ...parseConstantWithContext("MinSwapsPerBlock"),
          },
          {
            ...parseConstantWithContext("MaxSynthPerPoolDepth", {
              filter: (v: any) => formatPercentToString((v / 1e4) * 100),
            }),
          },
          {
            name: "Synth Burning",
            value: mimir?.BURNSYNTHS ? "Disabled" : "Enabled",
          },
          {
            name: "Synth Minting",
            value: mimir?.MINTSYNTHS ? "Disabled" : "Enabled",
          },
          {
            name: "Virtual Mult Synths",
            value: networkConst?.int_64_values?.VirtualMultSynths,
          },
          {
            header: "Chain Management",
          },
          {
            name: "Observations on all chains are paused",
            value: mimir?.HALTCHAINGLOBAL
              ? mimir?.HALTCHAINGLOBAL > 1
                ? mimir?.HALTCHAINGLOBAL
                : "Yes"
              : "No",
          },
          {
            ...parseConstantWithContext("NodePauseChainBlocks", {
              extraText: blockTime(
                networkConst?.int_64_values?.NodePauseChainBlocks,
                undefined
              ),
            }),
          },
          {
            ...parseConstantWithContext("BlocksPerYear"),
            filter: (v: any) => `${formatVueNumber(v, "0,0")}`,
          },
          {
            ...parseConstantWithContext("MAXUTXOSTOSPEND"),
            name: "Max UTXO to be spend on one block",
          },
          {
            ...parseConstantWithContext("MinimumNodesForBFT"),
            name: "Minimum Nodes For BFT",
          },
          {
            ...parseConstantWithContext("NativeTransactionFee"),
            filter: (v: any) => `${normalFormat(v, number)} RUNE`,
            usdValue: true,
          },
          {
            header: "THORName",
          },
          {
            ...parseConstantWithContext("TNSFeeOnSale"),
            name: "Fee On Sale",
            filter: (v: any) => `${normalFormat(v, number)} RUNE`,
          },
          {
            ...parseConstantWithContext("TNSFeePerBlock"),
            name: "Fee Per Block",
            filter: (v: any) => `${normalFormat(v, number)} RUNE`,
          },
          {
            ...parseConstantWithContext("TNSRegisterFee"),
            name: "Register Fee",
            filter: (v: any) => `${normalFormat(v / 1e8, number)} RUNE`,
            usdValue: true,
          },
        ],
      },
      {
        title: "Economics ",
        rowStart: 1,
        colSpan: "1",
        items: [
          {
            ...parseConstantWithContext("EmissionCurve"),
          },
          {
            ...parseConstantWithContext("MaxAvailablePools"),
          },
          {
            ...parseConstantWithContext("MinRunePoolDepth"),
            filter: (v: any) => `${formatVueNumber(v / 1e8, "0,0")}`,
          },
          {
            ...parseConstantWithContext("PoolCycle", {
              extraText: blockTime(mimir?.POOLCYCLE, undefined),
            }),
            filter: (v: any) => `${formatVueNumber(v, "0,0")}`,
          },
          {
            ...parseConstantWithContext("StagedPoolCost"),
            filter: (v: any) => `${formatVueNumber(v / 1e8, "0,0")}`,
          },
          {
            ...parseConstantWithContext("LiquidityLockUpBlocks"),
          },
          {
            name: "Add/Remove liquidity is paused",
            value: mimir?.PAUSELP ? "Yes" : "No",
          },
          {
            header: "Solvency",
          },
          {
            name: "Solvency Check",
            value: mimir?.STOPSOLVENCYCHECK ? "Disabled" : "Enabled",
          },
          {
            name: "BNB Solvency Check",
            value: mimir?.STOPSOLVENCYCHECKBNB ? "Disabled" : "Enabled",
          },
          {
            name: "ETH Solvency Check",
            value: mimir?.STOPSOLVENCYCHECKETH ? "Disabled" : "Enabled",
          },
          {
            ...parseConstantWithContext("PermittedSolvencyGap"),
          },
          {
            header: "Node Management",
          },
          {
            ...parseConstantWithContext("MinimumBondInRune"),
            filter: (v: any) => `${normalFormat(v / 1e8, number)} RUNE`,
            usdValue: true,
          },
          {
            ...parseConstantWithContext("AsgardSize"),
          },
          {
            ...parseConstantWithContext("ValidatorMaxRewardRatio"),
          },
          {
            ...parseConstantWithContext("SigningTransactionPeriod", {
              extraText: blockTime(
                networkConst?.int_64_values?.SigningTransactionPeriod,
                undefined
              ),
            }),
          },
          {
            ...parseConstantWithContext("FailKeysignSlashPoints"),
            value: networkConst?.int_64_values?.FailKeysignSlashPoints,
            filter: (v: any) => `${v} slashes`,
          },
          {
            ...parseConstantWithContext("FailKeygenSlashPoints"),
            filter: (v: any) => `${v} slashes`,
          },
          {
            ...parseConstantWithContext("ObserveSlashPoints"),
            filter: (v: any) => `${v} slashes`,
          },
          {
            ...parseConstantWithContext("LackOfObservationPenalty"),
            filter: (v: any) => `${v} slashes`,
          },
          {
            ...parseConstantWithContext("MinSlashPointsForBadValidator"),
            filter: (v: any) => `${v} slashes`,
          },
          {
            ...parseConstantWithContext("DoubleSignMaxAge", {
              extraText: blockTime(
                networkConst?.int_64_values?.DoubleSignMaxAge,
                undefined
              ),
            }),
            filter: (v: any) => `${v} blocks`,
          },
          {
            ...parseConstantWithContext("ObservationDelayFlexibility", {
              extraText: blockTime(
                networkConst?.int_64_values?.ObservationDelayFlexibility,
                undefined
              ),
            }),
            filter: (v: any) => `${v} blocks`,
          },
          {
            ...parseConstantWithContext("JailTimeKeygen", {
              extraText: blockTime(
                networkConst?.int_64_values?.JailTimeKeygen,
                undefined
              ),
            }),
            filter: (v: any) => `${formatVueNumber(v, "0,0")} blocks`,
          },
          {
            ...parseConstantWithContext("JailTimeKeysign", {
              extraText: blockTime(
                networkConst?.int_64_values?.JailTimeKeysign,
                undefined
              ),
            }),
            filter: (v: any) => `${formatVueNumber(v, "0,0")} blocks`,
          },
          {
            header: "Churning",
          },
          {
            ...parseConstantWithContext("ChurnInterval"),
            filter: (v: any) => `${blockTime(mimir?.CHURNINTERVAL, undefined)}`,
          },
          {
            ...parseConstantWithContext("HaltChurning"),
            name: "Churning is halted",
            filter: (v: any) => (v ? "Yes" : "No"),
          },
          {
            ...parseConstantWithContext("MaxNodeToChurnOutForLowVersion"),
          },
          {
            ...parseConstantWithContext("DesiredValidatorSet"),
            extraInfo: "Max number of validators, Overwritten by Mimir",
          },
          {
            ...parseConstantWithContext("FundMigrationInterval"),
            extraInfo: "Overwritten by Mimir",
          },
          {
            ...parseConstantWithContext("NumberOfNewNodesPerChurn"),
          },
          {
            ...parseConstantWithContext("BadValidatorRedline"),
            extraInfo: "Overwritten by Mimir",
          },
        ],
      },
    ];
  }, [networkConst, mimir, runePrice, parseConstantWithContext]);

  const filteredCombinedSettings = React.useMemo(() => {
    if (!searchKey) return combinedSettings;
    return combinedSettings.filter((row) =>
      row.key.toLowerCase().includes(searchKey.toLowerCase())
    );
  }, [combinedSettings, searchKey]);

  const combinedSettingsCols = useMemo(
    () => [
      createTextColumn<CombinedSetting>("Key", "name", { sortKey: "name" }),
      createCustomColumn<CombinedSetting>("Value", {
        sortKey: "value",
        renderCell: (row) => <span className="mono">{row.value || "0"}</span>,
      }),
      createCustomColumn<CombinedSetting>("Status", {
        sortKey: "status",
        renderCell: (row) => (
          <div className={styles["status-container"]}>
            <span
              className={`${styles["mini-bubble"]} ${
                row.status === "Constant" ? styles["info"] : ""
              }`}
            >
              {row.status}
            </span>
            {row.extraInfo && (
              <GlassmorphismTooltip content={row.extraInfo}>
                <InfoIcon className={styles["table-icon"]} />
              </GlassmorphismTooltip>
            )}
          </div>
        ),
      }),
    ],
    []
  );

  useEffect(() => {
    getNetworkData().then((data) => {
      setCombinedSettings(data);
    });
  }, []);

  const getNetworkData = async () => {
    try {
      const [constRes, mimirRes] = await Promise.all([
        getConstants(),
        getMimir(),
      ]);

      setNetworkConst(constRes);
      setMimir(mimirRes);

      const combinedSettingsList: CombinedSetting[] = [];

      if (constRes?.int_64_values) {
        for (const [key, value] of Object.entries(constRes.int_64_values)) {
          const parsedConstant = parseConstantWithContext(key);
          combinedSettingsList.push({
            ...parsedConstant,
            status: parsedConstant.extraInfo ? "Mimir" : "Constant",
            key: key.toUpperCase(),
          });
        }
      }

      if (mimirRes) {
        for (const [key, value] of Object.entries(mimirRes)) {
          if (!combinedSettingsList.find((s) => s.key === key)) {
            combinedSettingsList.push({
              name: key,
              value,
              status: "Mimir",
              key,
            });
          }
        }
      }

      return combinedSettingsList;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return (
    <>
      <Head>
        <title>THORChain Network Explorer | Network Settings</title>
      </Head>
      <PageContainer error={false} fluid={false}>
        <Nav
          activeMode={activeView}
          navItems={navItems}
          preText="View:"
          onActiveModeChange={setActiveView}
        />
        {activeView === "info" ? (
          <InfoCard options={networkSettings} runePrice={runePrice} />
        ) : (
          <div className={styles["constants-table"]}>
            <div
              id="vote-search-container"
              className={styles["search-container"]}
            >
              <input
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                type="text"
                placeholder="Search by key..."
                className={styles["search-input"]}
              />
              <SearchIcon className={styles["search-icon"]} />
            </div>
            <Card>
              <Table
                columns={combinedSettingsCols}
                data={filteredCombinedSettings.map((row) => ({
                  ...row,
                  id: row.key,
                  value: row.value || "0",
                }))}
                enableSort={true}
              />
            </Card>
          </div>
        )}
      </PageContainer>
    </>
  );
};

export default SettingsPage;
