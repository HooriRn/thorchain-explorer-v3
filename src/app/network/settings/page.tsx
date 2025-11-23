"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import PageContainer from "@/components/PageContainer";
import Nav from "@/components/Nav";
import InfoCard from "@/components/InfoCard";
import ConstantsMimirTable, { CombinedSetting } from "./ConstantsMimirTable";
import { getConstants, getMimir } from "@/lib/api";
import { useRunePrice } from "@/lib/store";
import { blockTime } from "@/lib/utils";
import { parseConstant, normalFormat, formatRune } from "@/utils/global";
import { camelCase } from "@/utils/global";
import {
  number,
  formatVueNumber,
  formatPercentToString,
  formatTrendNumber,
  formatPercent,
} from "@/utils/format";

interface NavItem {
  mode: string;
  text: string;
}

const SettingsPage: React.FC = () => {
  const runePrice = useRunePrice();
  const [networkConst, setNetworkConst] = useState<any>([]);
  const [mimir, setMimir] = useState<any>(undefined);
  const [combinedSettings, setCombinedSettings] = useState<CombinedSetting[]>(
    []
  );
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
            filter: (v: any) => `${formatTrendNumber(v)} RUNE`,
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
              filter: (v: any) => formatPercent(v / 1e4, 0),
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
            filter: (v: any) => `${formatTrendNumber(v)} RUNE`,
            usdValue: true,
          },
          {
            header: "THORName",
          },
          {
            ...parseConstantWithContext("TNSFeeOnSale"),
            name: "Fee On Sale",
            filter: (v: any) => `${formatTrendNumber(v)} RUNE`,
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
            filter: (v: any) => `${formatTrendNumber(v / 1e8)} RUNE`,
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
          const uniKey = key.toUpperCase();
          const uniName = camelCase(key);

          let constantValue = value;
          let isMimir = false;
          if (mimirRes && mimirRes[uniKey] !== undefined) {
            isMimir = true;
            constantValue = mimirRes[uniKey];
          }

          combinedSettingsList.push({
            name: uniName,
            value: constantValue || 0,
            status: isMimir ? "Mimir" : "Constant",
            key: uniKey,
            ...(isMimir && { extraInfo: "Overwritten by Mimir" }),
          });
        }
      }

      if (mimirRes) {
        for (const [key, value] of Object.entries(mimirRes)) {
          const uniKey = key.toUpperCase();
          if (
            !combinedSettingsList.find((s) => s.key === uniKey || s.key === key)
          ) {
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
          <ConstantsMimirTable data={combinedSettings} />
        )}
      </PageContainer>
    </>
  );
};

export default SettingsPage;
