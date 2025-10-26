"use client";

import React from "react";
import Link from "next/link";
import styles from "./Nav.module.css";

interface NavItem {
  mode: string;
  text: string;
  link?: string;
  hide?: boolean;
}

interface NavProps {
  activeMode?: string;
  navItems: NavItem[];
  isLink?: boolean;
  extraClasses?: string[];
  preText?: string;
  hide?: boolean;
  onActiveModeChange?: (mode: string) => void;
  children?: React.ReactNode;
}

const Nav: React.FC<NavProps> = ({
  activeMode,
  navItems,
  isLink = false,
  extraClasses = [],
  preText,
  hide,
  onActiveModeChange,
  children,
}) => {
  const filteredNav = navItems.filter((n) => n.hide !== true);

  const handleClick = (mode: string) => {
    if (!isLink && onActiveModeChange) {
      onActiveModeChange(mode);
    }
  };

  return (
    <div
      className={`${styles.navHeaders} ${styles.box} ${extraClasses.join(" ")}`}
    >
      {preText && <span className={styles.preText}>{preText}</span>}
      {filteredNav.map((navItem) => {
        const isActive = activeMode && activeMode === navItem.mode;

        if (isLink && navItem.link) {
          return (
            <Link
              key={navItem.mode}
              href={navItem.link}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              {navItem.text}
            </Link>
          );
        }

        return (
          <div
            key={navItem.mode}
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            onClick={() => handleClick(navItem.mode)}
          >
            {navItem.text}
          </div>
        );
      })}
      {children}
    </div>
  );
};

export default Nav;
