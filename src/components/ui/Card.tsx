import React from "react";
import { ReactNode } from "react";
import Image from "next/image";
import styles from "./Card.module.css";

interface NavItem {
  title: string;
  value: string;
}

interface CardProps {
  imgStyle?: React.CSSProperties;
  imgSrc?: string | React.ComponentType<any>;
  title?: string;
  isLoading?: boolean;
  extraClass?: string;
  bodyClass?: string;
  fullscreen?: boolean;
  navs?: NavItem[];
  actNav?: string;
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  onActNavChange?: (value: string) => void;
  isChart?: boolean;
}

const Card: React.FC<CardProps> = ({
  imgStyle,
  imgSrc,
  title,
  isLoading = false,
  extraClass = "",
  bodyClass = "",
  fullscreen = false,
  navs,
  actNav,
  children,
  header,
  footer,
  onActNavChange,
  isChart = false,
}) => {
  const handleNavClick = (value: string) => {
    if (onActNavChange) {
      onActNavChange(value);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${styles["card-container"]} ${styles["loading-container"]} ${extraClass}`}
      >
        <div className={styles["loading-spinner"]}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles["card-container"]} ${extraClass}`}>
      {title && (
        <div
          className={`${styles["card-header"]} ${
            header ? styles["has-extra"] : ""
          } ${imgSrc ? styles["has-image"] : ""}`}
        >
          <div className={styles["header-title-section"]}>
            {imgSrc && (
              <>
                {typeof imgSrc === "string" && imgSrc.trim() !== "" ? (
                  <Image
                    className={styles["stat-image"]}
                    src={imgSrc}
                    alt="stat"
                    style={imgStyle}
                  />
                ) : typeof imgSrc === "function" ? (
                  React.createElement(imgSrc, {
                    className: styles["stat-image"],
                    style: imgStyle,
                  })
                ) : null}
              </>
            )}

            <h2 className={styles["card-header-title"]}>{title}</h2>
          </div>
          {header}
        </div>
      )}

      {navs && (
        <div className={styles["card-header"]} style={{ padding: "0 1rem" }}>
          <div className={styles["nav-header"]}>
            {navs.map((nav, i) => (
              <div
                key={i}
                className={`${styles["nav-section"]} ${
                  styles["card-header-title"]
                } ${actNav === nav.value ? styles.active : ""}`}
                onClick={() => handleNavClick(nav.value)}
              >
                {nav.title}
              </div>
            ))}
          </div>
          {header}
        </div>
      )}

      <div className={`${styles["card-body"]} ${bodyClass}`}>
        <div
          className={
            isChart ? styles["chart-wrapper"] : styles["content-wrapper"]
          }
        >
          {children}
        </div>
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

export default Card;
