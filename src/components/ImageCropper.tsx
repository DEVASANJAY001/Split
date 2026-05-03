import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import getCroppedImg from "@/lib/cropImage";

interface ImageCropperProps {
  image: string | null;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  open: boolean;
}

export default function ImageCropper({ image, onCropComplete, onCancel, open }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: any) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteInternal = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background rounded-[32px] border-hairline">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold tracking-tightest">Crop Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[400px] bg-surface-soft mt-4">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={onZoomChange}
              cropShape="round"
              showGrid={false}
            />
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-ink-soft uppercase tracking-wider">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e: any) => setZoom(e.target.value)}
              className="w-full accent-brand h-1.5 bg-surface-soft rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button variant="ghost" onClick={onCancel} className="rounded-2xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleCrop} className="bg-brand text-brand-foreground rounded-2xl font-bold px-8 shadow-brand hover:opacity-90 transition-all">
              Apply Crop
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
