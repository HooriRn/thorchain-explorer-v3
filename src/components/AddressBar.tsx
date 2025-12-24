"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Copy from "@/components/Copy";
import QrBtn from "@/components/QrBtn";
import GlassmorphismTooltip from "@/components/GlassmorphismTooltip";
import { getContractsLabel } from "@/lib/api";
import { addressFormatV2 } from "@/utils/global";
import styles from "./AddressBar.module.css";

interface AddressBarProps {
  address?: string;
  disable?: boolean;
  showCopyIcon?: boolean;
  showQRCode?: boolean;
  copySize?: "normal" | "small";
  className?: string;
}

const AddressBar: React.FC<AddressBarProps> = ({
  address,
  disable = false,
  showCopyIcon = true,
  showQRCode = true,
  copySize = "normal",
  className = "",
}) => {
  console.log("🔍 AddressBar props:", { address, disable, showCopyIcon, showQRCode });
  
  const [label, setLabel] = useState(address);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 useEffect triggered with address:", address);
    
    const fetchLabel = async () => {
      if (!address || typeof address !== "string") {
        console.log("❌ No address or invalid address");
        return;
      }

      try {
        console.log("🔄 Fetching label for address:", address);
        
        const testResponse = await fetch("/api/test");
        console.log("🔍 Test API response:", testResponse.status);
        
        const res = await getContractsLabel();
        console.log("🔍 API response:", res);
        
        const labels = Array.isArray(res) ? res : (res as any)?.data;
        console.log("🔍 Labels data:", labels);

        if (Array.isArray(labels)) {
          const foundLabel = labels.find(
            (l: any) =>
              typeof l.address === "string" &&
              l.address.toLowerCase() === address.toLowerCase()
          );
          
          console.log("🔍 Found label:", foundLabel);
          
          if (foundLabel?.label) {
            setLabel(foundLabel.label);
          } else {
            const formatted = (address);
            setLabel(formatted);
            console.log("🔍 Using formatted address:", formatted);
          }
        } else {
          const formatted = (address);
          setLabel(formatted);
          console.log("🔍 Labels not array, using formatted:", formatted);
        }
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching address label:", err);
        const formatted = (address);
        setLabel(formatted);
        console.log("🔍 Error, using formatted address:", formatted);
      } finally {
        console.log("🔍 Loading completed");
      }
    };

    fetchLabel();
  }, [address]);

  const displayText =label;

  return (
    <div className={`${styles.addressBarContainer} ${className}`}>
      {address ? (
        <div className={styles.addressBarContent}>
          <div className={styles.addressTextContainer}>
            {disable ? (
              <GlassmorphismTooltip content={address} placement="top">
                <span className={styles.addressText}>
                  {displayText}
                </span>
              </GlassmorphismTooltip>
            ) : (
              <GlassmorphismTooltip content={address} placement="top">
                <Link
                  className={`${styles.addressText} ${styles.clickable}`}
                  href={`/address/${address}`}
                >
                  {displayText}
                </Link>
              </GlassmorphismTooltip>
            )}
            
            {error && (
              <span className={styles.errorText}>
                ({error})
              </span>
            )}
          </div>
          
          <div className={styles.actionButtons}>
            {!disable && showCopyIcon && (
              <div className={`${styles.actionButton} ${styles.copyButton}`}>
                <Copy 
                  strCopy={address} 
                  size={copySize} 
                  hideToast={false} 
                />
              </div>
            )}
            
            {!disable && showQRCode && (
              <div className={`${styles.actionButton} ${styles.qrButton}`}>
                <QrBtn qrcode={address} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <span className={styles.noAddress}>- No Address -</span>
      )}
    </div>
  );
};

export default AddressBar;