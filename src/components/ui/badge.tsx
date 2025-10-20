import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        orange: "border-transparent",
        yellow: "border-transparent",
        info: "border-transparent",
        gray: "border-transparent",
        green: "border-transparent",
        red: "border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  const getCustomStyles = () => {
    const baseStyles = {
      padding: "var(--badge-padding)",
      borderRadius: "var(--badge-border-radius)",
      fontSize: "var(--badge-font-size)",
      fontWeight: "var(--badge-font-weight)",
    };

    switch (variant) {
      case "orange":
        return {
          ...baseStyles,
          backgroundColor: "var(--badge-orange-bg)",
          color: "var(--badge-orange-text)",
        };
      case "yellow":
        return {
          ...baseStyles,
          backgroundColor: "var(--badge-yellow-bg)",
          color: "var(--badge-yellow-text)",
        };
      case "info":
        return {
          ...baseStyles,
          backgroundColor: "var(--badge-info-bg)",
          color: "var(--badge-info-text)",
        };
      case "gray":
        return {
          ...baseStyles,
          backgroundColor: "var(--badge-gray-bg)",
          color: "var(--badge-gray-text)",
        };
      default:
        return baseStyles;
      case "green":
        return {
          ...baseStyles,
          backgroundColor: "var(--badge-green-bg)",
          color: "var(--badge-green-text)",
        };
      case "red":
        return {
          ...baseStyles,
          border: "1px solid var(--badge-red-bg)",
          borderRadius: "999px",
        };
    }
  };

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      style={getCustomStyles()}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
