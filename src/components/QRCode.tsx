import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export function QRCode({ value, size = 180, className, label }: QRCodeProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <div className="rounded-3xl bg-surface p-5 shadow-card">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="transparent"
          fgColor="hsl(222 25% 12%)"
          level="M"
          marginSize={0}
        />
      </div>
      {label && <p className="text-xs text-ink-soft font-medium">{label}</p>}
    </div>
  );
}
