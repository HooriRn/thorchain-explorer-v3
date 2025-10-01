"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      let top = 0;
      let left = 0;
      const margin = 8;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Estimate tooltip dimensions if not available yet
      const estimatedTooltipWidth = tooltipRect?.width || 200;
      const estimatedTooltipHeight = tooltipRect?.height || 40;

      switch (position) {
        case "top":
          top = triggerRect.top - estimatedTooltipHeight - margin;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + margin;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "left":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.left - estimatedTooltipWidth - margin;
          break;
        case "right":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.right + margin;
          break;
      }

      // Enhanced viewport boundary detection with proper centering
      if (position === "top" || position === "bottom") {
        // Center horizontally but ensure it doesn't go off-screen
        const halfTooltipWidth = estimatedTooltipWidth / 2;
        if (left - halfTooltipWidth < margin) {
          left = margin + halfTooltipWidth;
        } else if (left + halfTooltipWidth > viewportWidth - margin) {
          left = viewportWidth - margin - halfTooltipWidth;
        }
      } else {
        // For left/right, ensure vertical centering doesn't go off-screen
        const halfTooltipHeight = estimatedTooltipHeight / 2;
        if (top - halfTooltipHeight < margin) {
          top = margin + halfTooltipHeight;
        } else if (top + halfTooltipHeight > viewportHeight - margin) {
          top = viewportHeight - margin - halfTooltipHeight;
        }
      }

      // Final boundary checks
      if (top < margin) top = margin;
      if (top + estimatedTooltipHeight > viewportHeight - margin) {
        top = viewportHeight - estimatedTooltipHeight - margin;
      }
      if (left < margin) left = margin;
      if (left + estimatedTooltipWidth > viewportWidth - margin) {
        left = viewportWidth - estimatedTooltipWidth - margin;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  // Recalculate position after tooltip is rendered to get accurate dimensions
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;
      const margin = 8;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      switch (position) {
        case "top":
          top = triggerRect.top - tooltipRect.height - margin;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + margin;
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case "left":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.left - tooltipRect.width - margin;
          break;
        case "right":
          top = triggerRect.top + triggerRect.height / 2;
          left = triggerRect.right + margin;
          break;
      }

      // Enhanced viewport boundary detection with proper centering
      if (position === "top" || position === "bottom") {
        // Center horizontally but ensure it doesn't go off-screen
        const halfTooltipWidth = tooltipRect.width / 2;
        if (left - halfTooltipWidth < margin) {
          left = margin + halfTooltipWidth;
        } else if (left + halfTooltipWidth > viewportWidth - margin) {
          left = viewportWidth - margin - halfTooltipWidth;
        }
      } else {
        // For left/right, ensure vertical centering doesn't go off-screen
        const halfTooltipHeight = tooltipRect.height / 2;
        if (top - halfTooltipHeight < margin) {
          top = margin + halfTooltipHeight;
        } else if (top + halfTooltipHeight > viewportHeight - margin) {
          top = viewportHeight - margin - halfTooltipHeight;
        }
      }

      // Final boundary checks
      if (top < margin) top = margin;
      if (top + tooltipRect.height > viewportHeight - margin) {
        top = viewportHeight - tooltipRect.height - margin;
      }
      if (left < margin) left = margin;
      if (left + tooltipRect.width > viewportWidth - margin) {
        left = viewportWidth - tooltipRect.width - margin;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position, tooltipRef.current]);

  const getTooltipStyle = (): React.CSSProperties => {
    return {
      position: "fixed",
      top: tooltipPosition.top,
      left: tooltipPosition.left,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      color: "var(--sec-font-color)",
      padding: "8px 12px",
      borderRadius: "12px",
      fontSize: "14px",
      fontFamily: "'Montserrat', sans-serif",
      zIndex: 99999,
      whiteSpace: "nowrap",
      boxShadow:
        "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? "visible" : "hidden",
      transition: "opacity 0.2s ease-in-out",
      transform:
        position === "top" || position === "bottom"
          ? "translateX(-50%)"
          : position === "left" || position === "right"
          ? "translateY(-50%)"
          : "none",
      pointerEvents: "none",
    };
  };

  const tooltipElement = isVisible ? (
    <div ref={tooltipRef} style={getTooltipStyle()}>
      {content}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        style={{ display: "inline-block" }}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {typeof window !== "undefined" &&
        tooltipElement &&
        createPortal(tooltipElement, document.body)}
    </>
  );
};

export default Tooltip;
