import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow,background-color,border] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        destructive: "bg-destructive text-white border-transparent",
        outline: "text-foreground border border-border",
        green: "border-transparent",
        yellow: "border",
        orange: "border",
        info: "border",
        danger: "border",
        red: "border",
        gray: "border-transparent",
        white: "border",
        black: "border-transparent",
      },
      size: {
        default: "",
        big: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  style?: React.CSSProperties;
  hoverable?: boolean;
}

function Badge({
  className,
  variant,
  size,
  asChild = false,
  style: userStyle,
  hoverable = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  const elementRef = React.useRef<HTMLElement>(null);
  const originalStylesRef = React.useRef<{
    backgroundColor?: string;
    color?: string;
  }>({});

  const getCustomStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: "var(--space-2) var(--space-5)",
      borderRadius: "var(--radius-2xl)",
      fontWeight: 700,
      lineHeight: 1,
      fontSize: size === "big" ? "var(--font-size-sm)" : "var(--font-size-xs)",
      cursor: hoverable ? "pointer" : "default",
    };

    let variantStyles: React.CSSProperties = {};

    switch (variant) {
      case "green":
        variantStyles = {
          backgroundColor: "var(--badge-green-bg)",
          color: "var(--badge-green-text)",
          fill: "var(--badge-green-fill)",
        };
        if (hoverable) {
          variantStyles = {
            ...variantStyles,
            transition: "background-color 0.2s ease",
          };
        }
        break;
      case "yellow":
        variantStyles = {
          backgroundColor: "var(--badge-yellow-bg)",
          color: "var(--badge-yellow-text)",
          fill: "var(--badge-yellow-fill)",
          borderColor: "var(--badge-yellow-border)",
        };
        if (hoverable) {
          variantStyles = {
            ...variantStyles,
            transition: "background-color 0.2s ease, color 0.2s ease",
          };
        }
        break;
      case "orange":
        variantStyles = {
          backgroundColor: "var(--badge-orange-bg)",
          color: "var(--badge-orange-text)",
          borderColor: "var(--badge-orange-border)",
        };
        break;
      case "info":
        variantStyles = {
          backgroundColor: "var(--badge-info-bg)",
          color: "var(--badge-info-text)",
          fill: "var(--badge-info-fill)",
          borderColor: "var(--badge-info-border)",
        };
        break;
      case "danger":
      case "red":
        variantStyles = {
          backgroundColor: "var(--badge-red-bg)",
          color: "var(--badge-red-text)",
          fill: "var(--badge-red-fill)",
          borderColor: "var(--badge-red-border)",
        };
        break;
      case "gray":
        variantStyles = {
          backgroundColor: "var(--badge-gray-bg)",
          color: "var(--badge-gray-text)",
        };
        break;
      case "white":
        variantStyles = {
          backgroundColor: "var(--badge-white-bg)",
          color: "var(--badge-white-text)",
          borderColor: "var(--badge-white-border)",
        };
        break;
      case "black":
        variantStyles = {
          backgroundColor: "var(--badge-black-bg)",
          color: "var(--badge-black-text)",
        };
        break;
      default:
        break;
    }

    return { ...baseStyles, ...variantStyles, ...userStyle };
  };

  React.useEffect(() => {
    if (elementRef.current && hoverable) {
      const computedStyle = window.getComputedStyle(elementRef.current);
      originalStylesRef.current = {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
      };
    }
  }, [hoverable, variant]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!hoverable) return;

    const target = e.currentTarget;
    if (variant === "yellow") {
      target.style.backgroundColor = "#6b5000";
      target.style.color = "#f57f17";
    } else if (variant === "green") {
      target.style.backgroundColor = "#466d48";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!hoverable) return;

    const target = e.currentTarget;
    if (variant === "yellow" && originalStylesRef.current.backgroundColor) {
      target.style.backgroundColor = originalStylesRef.current.backgroundColor;
      target.style.color = originalStylesRef.current.color || "";
    } else if (
      variant === "green" &&
      originalStylesRef.current.backgroundColor
    ) {
      target.style.backgroundColor = originalStylesRef.current.backgroundColor;
    }
  };

  return (
    <Comp
      ref={elementRef}
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      style={getCustomStyles()}
      onMouseEnter={hoverable ? handleMouseEnter : undefined}
      onMouseLeave={hoverable ? handleMouseLeave : undefined}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
