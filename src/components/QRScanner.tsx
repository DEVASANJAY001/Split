import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export function QRScanner({ onScan, onClose, title = "Scan QR Code" }: QRScannerProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCode = useRef<Html5Qrcode | null>(null);
  const { openModal, closeModal } = useStore();

  useEffect(() => {
    openModal();
    const qrCodeId = "qr-reader";
    html5QrCode.current = new Html5Qrcode(qrCodeId);

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    html5QrCode.current
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // ignore error messages
        }
      )
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to start scanner:", err);
        setError("Camera access denied or not found.");
      });

    return () => {
      stopScanner();
      closeModal();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCode.current && html5QrCode.current.isScanning) {
      try {
        await html5QrCode.current.stop();
        html5QrCode.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleSwitchCamera = async () => {
    if (!html5QrCode.current) return;
    setIsReady(false);
    try {
      await stopScanner();
      // Simple toggle or re-start logic could go here
      // For now we just restart with environment which is the priority
      html5QrCode.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        onScan,
        () => {}
      ).then(() => setIsReady(true));
    } catch (err) {
      setError("Failed to switch camera.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      {/* Scanner Container */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
        <div id="qr-reader" className="size-full" />
        
        {/* Custom Overlay UI */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {/* Scanning Box */}
          <div className="size-[250px] border-2 border-white/20 rounded-3xl relative">
            {/* Animated Scanning Line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.8)] animate-scan" />
            
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 size-6 border-t-4 border-l-4 border-brand rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 size-6 border-t-4 border-r-4 border-brand rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-brand rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-brand rounded-br-xl" />
          </div>
          
          <div className="mt-8 px-6 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
            <p className="text-xs font-bold text-white tracking-widest uppercase">
              {isReady ? "Align QR Code" : "Initialising..."}
            </p>
          </div>
        </div>

        {error && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Camera className="size-6 text-red-500" />
            </div>
            <p className="text-sm font-bold text-white">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-white text-black rounded-full text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Header / Title */}
      <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between">
        <h3 className="text-lg font-black text-white tracking-tightest">{title}</h3>
        <button 
          onClick={onClose} 
          className="size-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
        >
          <X className="size-5 text-white" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 px-8 text-center space-y-4">
        <p className="text-xs text-white/50 font-medium leading-relaxed max-w-[240px]">
          Scanning is automatic. Position the code within the frame to detect.
        </p>
        <button 
          onClick={handleSwitchCamera}
          className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all"
        >
          <RefreshCw className="size-3" />
          Flip Camera
        </button>
      </div>
    </div>
  );
}
