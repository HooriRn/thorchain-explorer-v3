"use client";

import React from "react";
import Affiliate from "@/components/Affiliate";
import AngleIcon from "@/assets/images/angle-down.svg";
import styles from "./AffiliateDropdown.module.css";

interface AffiliateDropdownProps {
  selected: string;
  affiliateList: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (affiliate: string) => void;
}

const AffiliateDropdown: React.FC<AffiliateDropdownProps> = ({
  selected,
  affiliateList,
  isOpen,
  onToggle,
  onSelect,
}) => {
  return (
    <div className={styles.customDropdown}>
      <div className={styles.dropdownContainer}>
        <div className={styles.dropdownSelect} onClick={onToggle}>
          {selected ? (
            <div className={styles.selectedItem}>
              <Affiliate
                affiliateAddress={selected}
                useNewIcons={false}
                showLink={false}
                className={styles.itemLabel}
              />
            </div>
          ) : (
            <div className={styles.placeholder}>All Affiliates</div>
          )}
          <AngleIcon className={`${styles.trigger} ${isOpen ? styles.rotated : ""}`} />
        </div>

        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div 
              className={styles.dropdownItem} 
              onClick={() => onSelect("")}
            >
              <span className={styles.allAffiliatesText}>All Affiliates</span>
            </div>
            {affiliateList.map((affiliate) => (
              <div
                key={affiliate}
                className={styles.dropdownItem}
                onClick={() => onSelect(affiliate)}
              >
                <Affiliate
                  affiliateAddress={affiliate}
                  showLink={false}
                  className={styles.itemLabel}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateDropdown;