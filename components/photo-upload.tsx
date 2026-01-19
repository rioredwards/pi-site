"use client";
import { cn, devLog } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LucideDog, RotateCw } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { uploadPhoto } from "../app/actions";
import { reduceFileSize } from "../app/lib/imgCompress";
import { Photo } from "../app/lib/types";
import Confetti from "./Confetti";
import { GradientText } from "./funText";
import { DogBotCard, getDogBotBorderClass } from "./ui/dogBotCard";
import { RotatingGradientBorder } from "./ui/RotatingGradientBorder";
import { SignInModal } from "./ui/signInModal";

// Helper to create cropped image from crop area
async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate and rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) throw new Error("Could not get cropped canvas context");

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

interface Props {
  addPhoto: (photo: Photo) => void;
}

type ProcessingState = "preSelection" | "cropping" | "selected" | "processing" | "success" | "failure";

function getDogModalTitle(processingState: ProcessingState): string {
  switch (processingState) {
    case "preSelection":
      return "Upload Dog";
    case "cropping":
      return "Crop Your Dog";
    case "selected":
      return "Nice Dog!";
    case "processing":
      return "Processing Dog...";
    case "success":
      return "Dog Uploaded!";
    case "failure":
      return "Dog Not Uploaded!";
  }
}

function getDogModalDescription(processingState: ProcessingState): string {
  switch (processingState) {
    case "preSelection":
      return "Select a dog photo to upload to the gallery.";
    case "cropping":
      return "Drag to reposition, pinch or scroll to zoom, and rotate if needed.";
    case "selected":
      return "Now press that upload button!";
    case "processing":
      return "Hang tight...";
    case "success":
      return "Nice!";
    case "failure":
      return "Uh oh!";
  }
}

export default function PhotoUpload({ addPhoto }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("preSelection");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();
  const [showConfetti, setShowConfetti] = useState(false);

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const originalImageUrl = useMemo(() => {
    if (!files[0]) return null;
    return URL.createObjectURL(files[0]);
  }, [files]);

  const previewUrl = useMemo(() => {
    if (croppedFile) return URL.createObjectURL(croppedFile);
    return null;
  }, [croppedFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const resetFileInput = useCallback(() => {
    setFiles([]);
    setCroppedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setProcessingState("preSelection");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Auto-progress through success/failure states after 5 seconds
  useEffect(() => {
    if (processingState === "success") {
      const timer = setTimeout(() => {
        setShowUploadDialog(false);
        resetFileInput();
        // Trigger confetti after modal closes
        setTimeout(() => setShowConfetti(true), 100);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (processingState === "failure") {
      const timer = setTimeout(() => {
        setShowUploadDialog(false);
        resetFileInput();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [processingState, resetFileInput]);

  const handleCropConfirm = async () => {
    if (!originalImageUrl || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(originalImageUrl, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], files[0].name, { type: "image/jpeg" });
      setCroppedFile(croppedFile);
      setProcessingState("selected");
    } catch (error) {
      devLog("Error cropping image:", error);
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessingState("processing");

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to upload photos.",
        variant: "destructive",
      });
      setProcessingState("preSelection");
      return;
    }

    if (!croppedFile) {
      toast({
        title: "Error",
        description: "Please select and crop a photo to upload.",
        variant: "destructive",
      });
      setProcessingState("preSelection");
      return;
    }

    const MIN_PROCESSING_TIME = 5000;
    const startTime = Date.now();

    const MAX_FILE_SIZE = 500 * 1000;
    const MAX_WIDTH = 1000;
    const MAX_HEIGHT = 1000;
    const QUALITY = 0.9;

    const resizedImg = await reduceFileSize(croppedFile, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);
    const formData = new FormData();
    formData.append("file", resizedImg);
    const res = await uploadPhoto(formData);
    devLog("[photo-upload] upload response:", res);

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_PROCESSING_TIME - elapsedTime);
    await new Promise((resolve) => setTimeout(resolve, remainingTime));

    if (res.error || !res.data) {
      devLog("[photo-upload] upload error:", res.error);
      setProcessingState("failure");
      return;
    }

    devLog("[photo-upload] upload success:", res.data);
    addPhoto(res.data);
    setProcessingState("success");
  };

  const handleCancel = () => resetFileInput();

  const handleClose = () => {
    setShowUploadDialog(false);
    resetFileInput();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 1) {
        toast({
          title: "Error",
          description: "You can only upload 1 photo at a time.",
          variant: "destructive",
        });
        return;
      }
      setFiles(selectedFiles);
      setCroppedFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setProcessingState("cropping");
    }
  };

  const handleUploadButtonClick = () => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      setShowSignInModal(true);
      return;
    }
    setShowUploadDialog(true);
  };

  const isDogBotMode =
    processingState === "processing" ||
    processingState === "success" ||
    processingState === "failure";

  return (
    <section className="container mb-8">
      {showConfetti && <Confetti setShowConfetti={setShowConfetti} />}

      <div className="flex justify-center">
        <RotatingGradientBorder
          borderRadius="9999px"
          containerClassName="group"
          borderClassName="!opacity-[0.6] transition-all"
          shadowClassName="!opacity-[0] transition-all group-hover:!opacity-[0.2] pointer-coarse:!opacity-[0.2]">
          <Button
            onClick={handleUploadButtonClick}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-full px-8 py-8 text-lg font-bold",
              "text-primary",
              "bg-background hover:bg-background",
              "shadow-sm transition-shadow hover:shadow-md pointer-coarse:shadow-md",
              "pointer-coarse:animate-pulse"
            )}>
            <GradientText className="text-md my-1 from-red-500 via-orange-500 to-yellow-500 text-primary transition-all group-hover:text-transparent pointer-coarse:text-transparent">
              <LucideDog
                style={{ width: "24px", height: "24px" }}
                className="-mt-[2px] mr-2 inline-block text-primary dark:group-hover:text-red-500 transition-all group-hover:text-red-500 pointer-coarse:text-red-500"
              />
              Upload Dog Button
            </GradientText>
          </Button>
        </RotatingGradientBorder>
      </div>

      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}>
        <DialogContent
          className={cn(
            "sm:max-w-[560px] rounded-3xl p-0",
            isDogBotMode
              ? cn("border-0 bg-transparent overflow-hidden transition-all duration-300", getDogBotBorderClass(processingState))
              : "border border-border/60 bg-background/90 backdrop-blur shadow-2xl"
          )}
          hideCloseButton={isDogBotMode}
        >
          {/* DogBot mode - just the image with overlay */}
          {isDogBotMode ? (
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image
                src={previewUrl!}
                alt="Dog photo"
                fill={true}
                className="object-cover scale-[1.01]"
              />
              <DogBotCard processingState={processingState} />
            </div>
          ) : (
            <>
              {/* Regular form mode */}
              <div className="px-6 pt-6">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl tracking-tight">
                    {getDogModalTitle(processingState)}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {getDogModalDescription(processingState)}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 pb-6 pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
              {!files.length ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 p-3">
                  <label
                    htmlFor="photo"
                    className={cn(
                      "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl p-10",
                      "transition",
                      "hover:bg-muted/40 hover:border-border",
                      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                    )}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60 transition group-hover:shadow-md">
                      <LucideDog className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        Click to select a dog photo
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        JPEG, PNG, or WebP • max 5MB
                      </div>
                    </div>

                    <div className="mt-2 inline-flex items-center rounded-full bg-background/70 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/60">
                      one dog at a time
                    </div>
                  </label>
                </div>
              ) : processingState === "cropping" ? (
                <div className="space-y-4">
                  {/* Cropper */}
                  <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60">
                    <div className="relative aspect-square bg-black">
                      <Cropper
                        image={originalImageUrl!}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                  </div>

                  {/* Zoom slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Zoom</span>
                      <span className="font-mono text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                    />
                  </div>

                  {/* Crop actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRotate}
                      variant="outline"
                      className="rounded-xl px-3">
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCropConfirm}
                      className="flex-1 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      Crop
                    </Button>
                  </div>
                </div>
              ) : processingState === "selected" ? (
                <div className="space-y-4">
                  {/* Image preview */}
                  <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60">
                    <div className="relative aspect-square">
                      <Image
                        src={previewUrl!}
                        alt="Dog photo"
                        fill={true}
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      Upload
                    </Button>
                  </div>
                </div>
              ) : null}

              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
            </form>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <SignInModal showSignInModal={showSignInModal} setShowSignInModal={setShowSignInModal} />
    </section>
  );
}
