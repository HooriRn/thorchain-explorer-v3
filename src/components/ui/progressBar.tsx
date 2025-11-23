"use client";

import * as React from "react";
import styles from "./progress.module.css";

interface ProgressProps {
  width: number;
  height?: string;
  extraText?: string;
  color?: string;
  className?: string;
}

function Progress({
  width,
  height = "10px",
  extraText,
  color = "var(--primary-color)",
  className,
}: ProgressProps) {
  const vars = {
    "--bar-height": height,
  } as React.CSSProperties;

  return (
    <div
      className={`${styles["progress-wrapper"]} ${className || ""}`}
      style={vars}
    >
      <div
        className={styles["progress-bar"]}
        style={{
          width: (width > 100 ? 100 : width) + "%",
          background: color,
        }}
      />
      {extraText && (
        <span className={styles["progress-text"]}>{extraText}</span>
      )}
    </div>
  );
}

export { Progress };
