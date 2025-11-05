"use client";

import * as React from "react";
import styles from "./ProgressIcon.module.css";
import ArrowIcon from "@/assets/images/arrow.svg";


interface ProgressIconProps {
  isDown: boolean | number;
  dataNumber: string | number;
  size?: string; 
  filter?: (value: any) => React.ReactNode;
  className?: string;
}


export function ProgressIcon({
  isDown,
  dataNumber,
  size = ".7rem",
  filter = (v) => v,
  className,
}: ProgressIconProps) {
  const isNeutral = dataNumber === "0" || dataNumber === 0;
  const showArrow = !isNeutral;
  const showPlus = !isDown && showArrow;

  const vars = {
    "--font-size": size,
  } as React.CSSProperties;

  const containerClassName = [
    styles["arrow-container"],
    isDown ? styles["down"] : "",
    isNeutral ? styles["netural"] : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} style={vars}>
      {showArrow ? (
        <>
          ({showPlus ? "+" : ""}
          {filter(dataNumber)}
          <ArrowIcon />)
        </>
      ) : (
        <>({filter(dataNumber)}-)</>
      )}
    </div>
  );
}
