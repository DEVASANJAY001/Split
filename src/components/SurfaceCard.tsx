import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "brand" | "soft" | "outline";
  padding?: "sm" | "md" | "lg";
}

const padMap = { sm: "p-4", md: "p-5", lg: "p-6" };

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    const variantClasses = {
      default: "bg-surface shadow-soft",
      brand: "bg-brand text-brand-foreground shadow-brand",
      soft: "bg-brand-soft text-brand-soft-foreground",
      outline: "border border-hairline bg-transparent",
    };
    return (
      <div
        ref={ref}
        className={cn("rounded-3xl", variantClasses[variant], padMap[padding], className)}
        {...props}
      />
    );
  },
);
SurfaceCard.displayName = "SurfaceCard";
