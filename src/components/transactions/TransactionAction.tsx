import React, { memo } from "react";
import { useAppStore } from "@/lib/store";
import RightArrow from "@/assets/images/arrow-right.svg";
import VaultIcon from "@/assets/images/safe.svg";
import RedoIcon from "@/assets/images/refresh.svg";
import InfoIcon from "@/assets/images/info.svg";
import AddIcon from "@/assets/images/add.svg";
import NodeIcon from "@/assets/images/node.svg";
import WalletIcon from "@/assets/images/wallet.svg";
import SubtractIcon from "@/assets/images/subtract.svg";
import StreamIcon from "@/assets/images/stream.svg";
import AssetIcon from "@/components/AssetIcon";
import Affiliate from "@/components/Affiliate";
import Address from "@/components/transactions/Address";
import styles from "./TransactionAction.module.css";
import {
  decimalFormat,
  addressFormatV2,
  showAsset,
  getOutAssetFromMemo,
  baseChainAsset,
  parseCosmosAsset,
  parseMemoToTxType,
} from "@/utils/global";

interface TransactionRow {
  in?: Array<{
    txID: string;
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out?: Array<{
    address: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
    affiliate?: boolean;
  }>;
  height: number;
  date: number;
  type: string;
  status: string;
  metadata?: any;
  pools?: string[];
}

interface TransactionActionProps {
  row: TransactionRow;
  showMiniBubble?: boolean;
  noBorder?: boolean;
  wrap?: boolean;
}

const TransactionAction: React.FC<TransactionActionProps> = ({
  row,
  showMiniBubble = true,
  noBorder = false,
  wrap = false,
}) => {
  const theme = useAppStore((state) => state.theme);
  const pools = useAppStore((state) => state.pools);

  const isPendingSwap = (row: TransactionRow): boolean => {
    return !row.out || row.out.length === 0 || row.status === "pending";
  };

  const hasAffiliate = (row: TransactionRow): boolean => {
    return (
      row.metadata?.swap?.affiliateAddress ||
      row.metadata?.addLiquidity?.affiliateAddress
    );
  };

  const getAffiliateAddress = (row: TransactionRow): string => {
    return (
      row.metadata?.swap?.affiliateAddress ||
      row.metadata?.addLiquidity?.affiliateAddress ||
      ""
    );
  };

  const getType = (): string => {
    if (row.type === "swap") {
      const txType = row.metadata?.swap?.txType;
      if (txType === "add") {
        return "addLiquidity";
      }
      if (txType === "withdraw") {
        return "withdraw";
      }
      return row?.type;
    }
    return row?.type;
  };

  const type = getType();

  if (!row) return null;
  const parseMemoToTxType = (memo: string): string => {
    return parseMemoToTxType(memo);
  };

  return (
    <div>
      {type === "swap" || type === "switch" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          }`}
        >
          {row.in?.map((ops, i) => (
            <span key={`in-${i}`} className={styles["asset-cell"]}>
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </span>
          ))}
          {isPendingSwap(row) ? (
            <StreamIcon className={styles["action-type"]}>~</StreamIcon>
          ) : (
            <RightArrow className={styles["action-type"]} />
          )}
          {row.out
            ?.filter((o) => !o.affiliate)
            .map((ops, i) => (
              <span key={`out-${i}`} className={styles["asset-cell"]}>
                <AssetIcon
                  asset={ops.coins[0].asset}
                  height="1.2rem"
                  chainHeight="0.8rem"
                />
                <span className={styles["asset-name"]}>
                  {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
                </span>
              </span>
            ))}
          {isPendingSwap(row) &&
            (pools &&
            row.metadata?.swap &&
            row.metadata.swap.streamingSwapMeta &&
            row.metadata.swap.streamingSwapMeta.outEstimation ? (
              <span
                className={`${styles["asset-cell"]} ${
                  !noBorder ? styles["pending-dots"] : ""
                }`}
              >
                <AssetIcon
                  asset={getOutAssetFromMemo(row.metadata.swap.memo, pools)}
                  height="1.2rem"
                  chainHeight="0.8rem"
                />
                <span className={styles["asset-name"]}>
                  {decimalFormat(
                    Number(row.metadata.swap.streamingSwapMeta.outEstimation) /
                      1e8
                  )}
                </span>
              </span>
            ) : (
              <span className={styles["pending-cell"]}>
                <span className={styles["pending-dots"]}>
                  <span className={styles["pending-text"]}>Pending</span>
                </span>
              </span>
            ))}
          {hasAffiliate(row) && (
            <>
              <span>|</span>
              <div className={styles["asset-cell"]}>
                <Affiliate
                  affiliateAddress={getAffiliateAddress(row)}
                  useNewIcons={true}
                />
              </div>
            </>
          )}
        </div>
      ) : type === "withdraw" || type === "runePoolWithdraw" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.metadata?.withdraw && (
            <div className={styles["asset-cell"]}>
              <AssetIcon
                height="1.2rem"
                chainHeight="0.8rem"
                asset={
                  row.pools?.[0] || row.out?.[0]?.coins[0]?.asset || "THOR.RUNE"
                }
              />
              <span className={`${styles["mini-bubble"]} ${styles["yellow"]}`}>
                {row.metadata.withdraw.basisPoints
                  ? `${(
                      Number(row.metadata.withdraw.basisPoints) / 1e4
                    ).toFixed(2)}%`
                  : row.pools?.[0] || row.out?.[0]?.coins[0]?.asset}
              </span>
            </div>
          )}
          {row.metadata?.withdraw && (
            <RightArrow className={styles["action-type"]} />
          )}
          {row.out?.map((ops, i) => (
            <React.Fragment key={`out-${i}`}>
              <span className={styles["asset-cell"]}>
                <SubtractIcon className={styles["active-icon"]} />
                <AssetIcon
                  asset={ops.coins[0].asset}
                  height="1.2rem"
                  chainHeight="0.8rem"
                />
                <span className={styles["asset-name"]}>
                  {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
                </span>
              </span>
              {row.out && row.out.length > 1 && i + 1 !== row.out.length && (
                <div>+</div>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : type === "addLiquidity" || type === "runePoolDeposit" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.in?.map((ops, i) => (
            <React.Fragment key={`in-${i}`}>
              <span className={styles["asset-cell"]}>
                <AssetIcon
                  asset={ops.coins[0].asset}
                  height="1.2rem"
                  chainHeight="0.8rem"
                />
                <span className={styles["asset-name"]}>
                  {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
                </span>
              </span>
              {row.in && row.in.length > 1 && i + 1 !== row.in.length && (
                <div>+</div>
              )}
            </React.Fragment>
          ))}
          <RightArrow className={styles["action-type"]} />
          <div className={styles["asset-cell"]}>
            <AssetIcon
              height="1.2rem"
              chainHeight="0.8rem"
              asset={
                (row.pools && row.pools[0]) ||
                row.in?.[0]?.coins[0]?.asset ||
                "THOR.RUNE"
              }
            />
            <span>
              {showAsset(row.pools?.[0] || "") || row.in?.[0]?.coins[0]?.asset}
            </span>
          </div>
          {hasAffiliate(row) && (
            <>
              <span>|</span>
              <div className={styles["asset-cell"]}>
                <Affiliate
                  affiliateAddress={getAffiliateAddress(row)}
                  useNewIcons={true}
                />
              </div>
            </>
          )}
        </div>
      ) : type === "refund" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.in?.map((ops, i) => (
            <span
              key={`in-${i}`}
              className={`${styles["asset-cell"]} ${styles["yellow-type"]}`}
            >
              <RedoIcon className={styles["active-icon"]} />
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </span>
          ))}
        </div>
      ) : type === "send" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.status === "failed" && (
            <div className={styles["asset-cell"]}>
              <InfoIcon
                title={row.metadata?.send?.reason}
                className={`${styles["action-type"]} ${styles["red"]} ${styles["reason"]}`}
              />
            </div>
          )}
          {row.in?.map((ops, i) => (
            <span key={`in-${i}`} className={styles["asset-cell"]}>
              {ops.coins.length > 0 ? (
                <>
                  <AssetIcon
                    asset={ops.coins[0].asset}
                    height="1.2rem"
                    chainHeight="0.8rem"
                  />
                  <span className={styles["asset-name"]}>
                    {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
                  </span>
                </>
              ) : (
                <>
                  <AssetIcon
                    asset="THOR.RUNE"
                    height="1.2rem"
                    chainHeight="0.8rem"
                  />
                  <span className={styles["asset-name"]}>
                    {decimalFormat(0)}
                  </span>
                </>
              )}
            </span>
          ))}
          <RightArrow className={styles["action-type"]} />
          {row.out?.map((ops, i) => (
            <span key={`out-${i}`} className={styles["asset-cell"]}>
              <WalletIcon className={styles["active-icon"]} />
              <Address
                address={ops.address}
                showCopyIcon={false}
                hoveredAddress=""
                onSetHovered={() => {}}
                onRemoveHovered={() => {}}
              />
            </span>
          ))}
        </div>
      ) : type === "tcy_claim" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.out?.map((ops, i) => (
            <div key={`out-${i}`} className={styles["asset-cell"]}>
              <AddIcon className={styles["active-icon"]} />
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </div>
          ))}
        </div>
      ) : type === "tcy_unstake" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.out?.map((ops, i) => (
            <div key={`out-${i}`} className={styles["asset-cell"]}>
              <SubtractIcon className={styles["active-icon"]} />
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </div>
          ))}
        </div>
      ) : type === "tcy_stake" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.in?.map((ops, i) => (
            <div key={`in-${i}`} className={styles["asset-cell"]}>
              <AddIcon className={styles["active-icon"]} />
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </div>
          ))}
        </div>
      ) : type === "bond" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.in?.map((ops, i) => (
            <span key={`in-${i}`} className={styles["asset-cell"]}>
              <AddIcon className={styles["active-icon"]} />
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </span>
          ))}
          <RightArrow className={styles["action-type"]} />
          <div className={styles["asset-cell"]}>
            <NodeIcon className={styles["active-icon"]} />
            <a
              className="clickable"
              href={`/node/${row.metadata?.bond?.nodeAddress}`}
            >
              {addressFormatV2(row.metadata?.bond?.nodeAddress || "")}
            </a>
          </div>
        </div>
      ) : type === "unbond" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          <div className={styles["asset-cell"]}>
            <NodeIcon className={styles["active-icon"]} />
            <a
              className="clickable"
              href={`/node/${row.metadata?.bond?.nodeAddress}`}
            >
              {addressFormatV2(row.metadata?.bond?.nodeAddress || "")}
            </a>
          </div>
          <RightArrow className={styles["action-type"]} />
          {row.out?.map((ops, i) => (
            <div key={`out-${i}`} className={styles["asset-cell"]}>
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </div>
          ))}
        </div>
      ) : type === "trade" || type === "secure" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.in?.map((ops, i) => (
            <span key={`in-${i}`} className={styles["asset-cell"]}>
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </span>
          ))}
          <RightArrow className={styles["action-type"]} />
          <div>
            <VaultIcon className={styles["action-icon"]} />
          </div>
          <RightArrow className={styles["action-type"]} />
          {row.out?.map((ops, i) => (
            <span key={`out-${i}`} className={styles["asset-cell"]}>
              <AssetIcon
                asset={ops.coins[0].asset}
                height="1.2rem"
                chainHeight="0.8rem"
              />
              <span className={styles["asset-name"]}>
                {decimalFormat(Number(ops.coins[0].amount) / 1e8)}
              </span>
            </span>
          ))}
        </div>
      ) : type === "failed" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.metadata && row.metadata.failed && (
            <div className={styles["asset-cell"]}>
              <span>{parseMemoToTxType(row.metadata.failed.memo)}</span>
              <RightArrow className={styles["action-type"]} />
              <InfoIcon
                title={row.metadata.failed.reason}
                className={`${styles["action-type"]} ${styles["reason"]}`}
              />
            </div>
          )}
        </div>
      ) : type === "thorname" ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.metadata && row.metadata.thorname && (
            <>
              <span className={styles["asset-cell"]}>
                {row.metadata.thorname.thorname}
              </span>
              <RightArrow className={styles["action-type"]} />
              <span className={styles["asset-cell"]}>
                <AssetIcon
                  height="1.2rem"
                  asset={baseChainAsset(row.metadata.thorname.chain)}
                />
                <Address
                  address={row.metadata.thorname.address}
                  showCopyIcon={false}
                  useCustomName={true}
                  hoveredAddress=""
                  onSetHovered={() => {}}
                  onRemoveHovered={() => {}}
                />
              </span>
            </>
          )}
        </div>
      ) : type === "contract" && row.metadata?.contract ? (
        <div
          className={`${styles["action-cell"]} ${
            noBorder ? styles["no-border"] : ""
          } ${wrap ? styles["wrap"] : ""}`}
        >
          {row.metadata.contract.contractType ===
          "wasm-rujira-merge/deposit" ? (
            <>
              <div className={styles["asset-cell"]}>
                <AssetIcon
                  height="1.2rem"
                  asset={parseCosmosAsset(row.metadata.contract.funds)}
                />
                <span className={styles["asset-name"]}>
                  {decimalFormat(
                    Number(row.metadata.contract.attributes?.amount || 0) / 1e8
                  )}
                </span>
              </div>
              <RightArrow className={styles["action-type"]} />
              <div className={styles["asset-cell"]}>
                <span style={{ marginRight: "0.5rem" }}>Shares:</span>
                <span className={styles["asset-name"]}>
                  {decimalFormat(
                    Number(row.metadata.contract.attributes?.shares || 0) / 1e8
                  )}
                </span>
              </div>
            </>
          ) : (
            <span>{row.metadata.contract.contractType}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default TransactionAction;
