import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef, memo } from "react";
interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "brand" | "soft" | "outline" | "glass";
  padding?: "sm" | "md" | "lg" | "none";
}

const padMap = { sm: "p-2", md: "p-3", lg: "p-4", none: "p-0" };

export const SurfaceCard = memo(forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    const variantClasses = {
      default: "bg-surface shadow-soft border border-hairline/50",
      brand: "bg-brand text-brand-foreground shadow-brand shadow-lg",
      soft: "bg-brand-soft/50 text-brand-soft-foreground backdrop-blur-sm",
      outline: "border border-hairline bg-transparent",
      glass: "bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-glass",
    };
    return (
      <div
        ref={ref}
        className={cn("rounded-[2rem] transition-all", variantClasses[variant], padMap[padding], className)}
        {...props}
      />
    );
  },
));
SurfaceCard.displayName = "SurfaceCard";
