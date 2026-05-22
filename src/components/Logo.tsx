import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "sm" }: LogoProps) => {
  const sizeClass = size === "sm" ? "size-6" : size === "md" ? "size-8" : "size-10";
  
  return (
    <img 
      src="/icon-192.png" 
      alt="Split Logo" 
      className={cn("shrink-0 object-contain", sizeClass, className)} 
    />
  );
};
