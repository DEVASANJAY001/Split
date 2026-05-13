import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "../SurfaceCard";

interface Option {
  value: string;
  label: string;
  symbol?: string;
}

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  variant?: "glass" | "outline" | "surface";
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", className, variant = "surface" }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all",
          variant === "glass" ? "bg-white/10 backdrop-blur-md border border-white/10 text-white" : 
          variant === "surface" ? "bg-surface-soft border border-hairline text-ink" :
          "border-2 border-hairline bg-transparent text-ink",
          isOpen && "ring-2 ring-brand ring-offset-2 ring-offset-background"
        )}
      >
        <span className="truncate">
          {selected ? (selected.symbol ? `${selected.symbol} ${selected.label}` : selected.label) : placeholder}
        </span>
        <ChevronDown className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <SurfaceCard variant="glass" padding="none" className="max-h-60 overflow-auto border-brand/10 shadow-2xl">
            <ul className="py-2">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                      opt.value === value ? "bg-brand text-white" : "text-ink hover:bg-brand/5"
                    )}
                  >
                    <span>{opt.symbol ? `${opt.symbol} ${opt.label}` : opt.label}</span>
                    {opt.value === value && <Check className="size-4" />}
                  </button>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      )}
    </div>
  );
}
