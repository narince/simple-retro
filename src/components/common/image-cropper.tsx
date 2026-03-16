"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCroppedImg } from "@/lib/utils"; // We might need to implement this
import { Minus, Plus, RotateCw } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCropComplete: (croppedImage: string) => void;
}

import { useTranslation } from "@/lib/i18n";

export function ImageCropper({ imageSrc, open, onOpenChange, onCropComplete }: ImageCropperProps) {
    const { t } = useTranslation();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [rotation, setRotation] = useState(0);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (newZoom: number) => {
        setZoom(newZoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
                onOpenChange(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('profile.edit_photo')}</DialogTitle>
                </DialogHeader>

                <div className="relative h-[400px] w-full bg-black rounded-md overflow-hidden outline-none">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={1}
                            onCropChange={onCropChange}
                            onZoomChange={onZoomChange}
                            onCropComplete={onCropCompleteHandler}
                            onRotationChange={setRotation}
                            cropShape="round"
                            showGrid={true}
                            restrictPosition={false}
                            minZoom={0.1} // Allow zooming out further
                            maxZoom={10}  // Allow zooming in more
                            objectFit="contain" // Ensure image fits within container
                        />
                    )}
                </div>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <Minus className="h-4 w-4 text-slate-500" />
                        <div className="flex-1">
                            <input
                                type="range"
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <Plus className="h-4 w-4 text-slate-500" />
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
                    <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)}>
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('dialog.cancel')}</Button>
                        <Button onClick={handleSave}>{t('profile.save_photo')}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
