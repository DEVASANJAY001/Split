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
      <div className="rounded-[2.5rem] bg-white p-6 shadow-2xl">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          marginSize={0}
        />
      </div>
      {label && <p className="text-xs text-ink-soft font-medium">{label}</p>}
    </div>
  );
}
