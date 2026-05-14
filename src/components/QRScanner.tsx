import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export function QRScanner({ onScan, onClose, title = "Scan QR Code" }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { openModal, closeModal } = useStore();

  useEffect(() => {
    openModal();
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      },
      (errorMessage) => {
        // console.warn(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner cleanup failed", err));
      }
      closeModal();
    };
  }, []); // Only run on mount and unmount

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-hairline flex items-center justify-between">
          <h3 className="font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="size-8 rounded-full bg-surface-soft flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 bg-black">
          <div id="qr-reader" className="w-full overflow-hidden rounded-2xl border-none" />
        </div>
        <div className="p-6 text-center text-xs text-ink-soft bg-surface-soft/50">
          Position the QR code within the frame to scan
        </div>
      </div>
    </div>
  );
}
