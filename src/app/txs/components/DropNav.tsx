"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./DropNav.module.css";

interface SubItem {
  name: string;
  value: string;
}

interface NavItem {
  title: string;
  value?: string;
  subItems?: SubItem[];
}

interface DropNavProps {
  items: NavItem[];
  activeMode?: string;
  onActiveModeChange?: (value: string) => void;
}

const DropNav: React.FC<DropNavProps> = ({
  items,
  activeMode,
  onActiveModeChange,
}) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const initialToggles: Record<string, boolean> = {};
    items.forEach((item) => {
      initialToggles[item.title] = false;
      closeDialogOnClick(item);
    });
    setToggles(initialToggles);
  }, [items]);

  const closeDialogOnClick = (item: NavItem) => {
    const handleClick = (e: MouseEvent) => {
      const element = itemRefs.current[item.title];
      if (element && !element.contains(e.target as Node)) {
        setToggles((prev) => ({ ...prev, [item.title]: false }));
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  };

  const toggle = (item: NavItem, flag?: boolean) => {
    const st = item.title;
    if (toggles[st] === undefined) {
      return;
    }
    if (flag === undefined) {
      setToggles((prev) => ({ ...prev, [st]: !prev[st] }));
    } else {
      setToggles((prev) => ({ ...prev, [st]: flag }));
    }
  };

  const emitIfNoSubs = (item: NavItem) => {
    if (item.subItems === undefined || item.subItems.length === 0) {
      emitAction(item.value || "");
    }
  };

  const emitAction = (value: string) => {
    if (onActiveModeChange) {
      onActiveModeChange(value);
    }
  };

  const isItemActive = (it: NavItem): boolean => {
    if (activeMode === it.value) {
      return true;
    }
    if (it.subItems?.some((s) => s.value === activeMode)) {
      return true;
    }
    return false;
  };

  return (
    <div className={styles["nav-box-wrapper"]}>
      {items.map((it) => (
        <div
          key={it.title}
          id={it.title}
          ref={(el) => (itemRefs.current[it.title] = el)}
          className={`${styles["nav-box-item"]} ${
            isItemActive(it) ? styles.active : ""
          }`}
          onMouseOver={() => toggle(it, true)}
          onMouseLeave={() => toggle(it, false)}
          onClick={() => emitIfNoSubs(it)}
        >
          <div className={styles["nav-box-mainframe"]}>
            <span>{it.title}</span>
          </div>
          {it.subItems && it.subItems.length > 0 && (
            <div
              className={`${styles["fade-transition"]} ${
                toggles[it.title] ? styles.show : ""
              }`}
              id={it.title}
            >
              <div
                className={`${styles["nav-box-dialog"]} ${styles["simple-card"]} ${styles.normal}`}
              >
                {it.subItems.map((su) => (
                  <div
                    key={su.name}
                    className={`${styles["nav-item"]} ${
                      su.value === activeMode ? styles.active : ""
                    }`}
                    onClick={() => emitAction(su.value)}
                  >
                    <span>{su.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DropNav;
