import { useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/image-utils";
import { SurfaceCard } from "./SurfaceCard";
import { Check, X, Move, ZoomIn } from "lucide-react";

interface ImageCropperProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = (_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6">
            <SurfaceCard className="w-full max-w-md overflow-hidden flex flex-col h-[500px]">
                <div className="relative flex-1 bg-surface-soft">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-ink-soft px-1">
                            <span className="flex items-center gap-1.5"><Move className="size-3" /> Drag to position</span>
                            <span className="flex items-center gap-1.5"><ZoomIn className="size-3" /> Zoom</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-surface-soft rounded-full appearance-none cursor-pointer accent-brand"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 rounded-2xl bg-surface border border-hairline text-ink font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <X className="size-4" /> Cancel
                        </button>
                        <button
                            onClick={handleCrop}
                            className="flex-1 py-3.5 rounded-2xl bg-ink text-background font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check className="size-4" /> Save Photo
                        </button>
                    </div>
                </div>
            </SurfaceCard>
        </div>
    );
}
