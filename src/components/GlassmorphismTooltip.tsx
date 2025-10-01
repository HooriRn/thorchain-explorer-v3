"use client";

import React from "react";
import { Tooltip } from "@heroui/tooltip";

interface GlassmorphismTooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}

const GlassmorphismTooltip: React.FC<GlassmorphismTooltipProps> = ({
  content,
  children,
  placement = "top",
}) => {
  return (
    <Tooltip
      content={content}
      placement={placement}
      showArrow={true}
      delay={0}
      closeDelay={0}
      classNames={{
        base: "bg-transparent",
        content: [
          "glassmorphism-tooltip",
          "backdrop-blur-[20px]",
          "rounded-xl",
          "px-3",
          "py-2",
          "text-sm",
          "font-['Montserrat',sans-serif]",
          "whitespace-nowrap",
          "pointer-events-none",
          "z-[99999]",
          "transition-opacity",
          "duration-200",
          "ease-in-out",
        ].join(" "),
      }}
    >
      {children}
    </Tooltip>
  );
};

export default GlassmorphismTooltip;
