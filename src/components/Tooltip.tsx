"use client";

import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getTooltipStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      backgroundColor: "var(--darker-bg)",
      color: "var(--font-color)",
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "14px",
      zIndex: 1000,
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? "visible" : "hidden",
      transition: "opacity 0.2s ease-in-out",
    };

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "8px",
        };
      case "bottom":
        return {
          ...baseStyle,
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "8px",
        };
      case "left":
        return {
          ...baseStyle,
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginRight: "8px",
        };
      case "right":
        return {
          ...baseStyle,
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginLeft: "8px",
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div
      ref={tooltipRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div style={getTooltipStyle()}>{content}</div>
    </div>
  );
};

export default Tooltip;

