import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "sm" }: LogoProps) => {
  const sizeClass = size === "sm" ? "size-6" : size === "md" ? "size-8" : "size-10";
  const innerSizeClass = size === "sm" ? "w-0.5 h-3" : size === "md" ? "w-0.5 h-4" : "w-1 h-5";
  
  return (
    <div className={cn("relative shrink-0", sizeClass, className)}>
      <div className="absolute inset-0 bg-brand rounded-[6px] rotate-45" />
      <div className="absolute inset-0 bg-white dark:bg-ink rounded-[6px] rotate-45 scale-75 flex items-center justify-center">
        <div className={cn("bg-brand -rotate-45 rounded-full", innerSizeClass)} />
      </div>
    </div>
  );
};
