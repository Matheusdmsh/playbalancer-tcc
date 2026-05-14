"use client";

import { useState, useRef } from "react";
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: File) => void;
}

// Função auxiliar para criar o crop inicial centralizado
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1 / 1));
  };

  const getCroppedImg = async () => {
    const image = imgRef.current;
    if (!image || !crop || !crop.width || !crop.height) {
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Ajuste: converter porcentagens para pixels antes de aplicar escala
    const cropX = (crop.x / 100) * image.width;
    const cropY = (crop.y / 100) * image.height;
    const cropWidth = (crop.width / 100) * image.width;
    const cropHeight = (crop.height / 100) * image.height;

    const cropXInPixels = cropX * scaleX;
    const cropYInPixels = cropY * scaleY;
    const cropWidthInPixels = cropWidth * scaleX;
    const cropHeightInPixels = cropHeight * scaleY;

    canvas.width = cropWidthInPixels;
    canvas.height = cropHeightInPixels;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        image,
        cropXInPixels,
        cropYInPixels,
        cropWidthInPixels,
        cropHeightInPixels,
        0,
        0,
        cropWidthInPixels,
        cropHeightInPixels
      );
    }

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const croppedFile = new File([blob], "cropped_image.jpeg", {
            type: "image/jpeg",
          });
          resolve(croppedFile);
        },
        "image/jpeg",
        1
      );
    });
  };

  const handleCrop = async () => {
    const croppedImageFile = await getCroppedImg();
    if (croppedImageFile) {
      onCropComplete(croppedImageFile);
      onClose();
    }
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Cortar Imagem</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center my-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={1}
            circularCrop={true}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCrop}>Cortar e Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
