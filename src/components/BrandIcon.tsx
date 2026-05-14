import React, { useState, useEffect } from "react";
import { getBrandIconData } from "@/lib/brand-icons";
import { PersonAvatar } from "./Avatar";
import { Person } from "@/lib/store";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  description: string;
  person?: Person;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  imgClassName?: string;
}

export const BrandIcon = React.memo(({ description, person, fallback, size = "md", className, imgClassName }: BrandIconProps) => {
  const iconData = getBrandIconData(description);
  const [error, setError] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(!!iconData);

  useEffect(() => {
    if (!iconData) return;
    
    setIsSearching(true);
    setError(false);
    setSuccessUrl(null);

    const domains = [
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${iconData.domain}&size=128`,
      `https://www.google.com/s2/favicons?domain=${iconData.domain}&sz=128`,
      `https://icon.horse/icon/${iconData.domain}`
    ];

    let completed = 0;
    let found = false;

    domains.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (!found) {
          found = true;
          setSuccessUrl(url);
          setIsSearching(false);
        }
      };
      img.onerror = () => {
        completed++;
        if (completed === domains.length && !found) {
          setError(true);
          setIsSearching(false);
        }
      };
    });

    // Global safety timeout
    const timer = setTimeout(() => {
      if (!found) {
        setError(true);
        setIsSearching(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [iconData?.domain]);

  if (iconData && !error) {
    return (
      <div className={cn(
        "rounded-full bg-surface shadow-soft flex items-center justify-center shrink-0 border border-hairline/50 overflow-hidden relative",
        size === "sm" ? "size-8 p-1.5" : size === "md" ? "size-10 p-2.5" : "size-12 p-3",
        className
      )}>
        {successUrl ? (
          <img 
            src={successUrl} 
            alt="" 
            className={cn("size-full object-contain animate-in fade-in duration-500", imgClassName)} 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-soft animate-pulse">
            <div className="size-1/2 rounded-full bg-ink/5" />
          </div>
        )}
      </div>
    );
  }

  if (fallback) return <>{fallback}</>;
  if (person) return <PersonAvatar person={person} size={size} className={className} />;
  return null;
});
