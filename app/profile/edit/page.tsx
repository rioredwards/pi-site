"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Cropper, { Area } from "react-easy-crop";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, RotateClockwiseIcon, Camera01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, devLog, getProfilePictureUrl } from "@/app/lib/utils";
import { reduceFileSize } from "@/app/lib/imgCompress";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
} from "@/app/db/actions";
import { User as UserType } from "@/app/lib/types";
import { SignInModal } from "@/components/ui/signInModal";

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
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.95
    );
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

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Profile picture cropping state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const originalImageUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      if (status === "loading") return;

      if (!session?.user?.id) {
        setShowSignInModal(true);
        setIsLoading(false);
        return;
      }

      const result = await getUserProfile(session.user.id);
      if (result.data) {
        setProfile(result.data);
        setDisplayName(result.data.displayName || "");
      }
      setIsLoading(false);
    }

    loadProfile();
  }, [session?.user?.id, status]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setShowCropDialog(true);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCropConfirm = async () => {
    if (!originalImageUrl || !croppedAreaPixels || !selectedFile) return;

    setIsUploadingPicture(true);
    try {
      const croppedBlob = await getCroppedImg(originalImageUrl, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], selectedFile.name, { type: "image/jpeg" });

      // Resize the image
      const MAX_FILE_SIZE = 200 * 1000; // 200KB for profile pictures
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      const QUALITY = 0.9;

      const resizedImg = await reduceFileSize(croppedFile, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);

      // Upload the image
      const formData = new FormData();
      formData.append("file", resizedImg);
      const result = await uploadProfilePicture(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        // Reload profile to get updated picture
        if (session?.user?.id) {
          const profileResult = await getUserProfile(session.user.id);
          if (profileResult.data) {
            setProfile(profileResult.data);
          }
        }
        toast({
          title: "Success",
          description: "Profile picture updated.",
        });
      }
    } catch (error) {
      devLog("Error uploading profile picture:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPicture(false);
      setShowCropDialog(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    setIsSaving(true);
    try {
      const result = await updateUserProfile({ displayName: displayName.trim() });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setProfile(result.data);
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        router.push(`/profile/${encodeURIComponent(session.user.id)}`);
      }
    } catch (error) {
      devLog("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (session?.user?.id) {
      router.push(`/profile/${encodeURIComponent(session.user.id)}`);
    } else {
      router.push("/");
    }
  };

  const profilePictureUrl = profile ? getProfilePictureUrl(profile.profilePicture) : null;

  if (isLoading || status === "loading") {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <HugeiconsIcon icon={Loading01Icon} size={32} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold">Sign In Required</h1>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to edit your profile.
          </p>
          <Button className="mt-4" onClick={() => setShowSignInModal(true)}>
            Sign In
          </Button>
        </div>
        <SignInModal showSignInModal={showSignInModal} setShowSignInModal={setShowSignInModal} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile information
        </p>

        <div className="mt-8 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={profile?.displayName || "User"}
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-background shadow-lg"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted ring-4 ring-background shadow-lg">
                  <HugeiconsIcon icon={UserIcon} size={64} className="text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                <HugeiconsIcon icon={Camera01Icon} size={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP. Max 2MB.
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {displayName.length}/50 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border border-border/60 bg-background/90 p-0 shadow-2xl backdrop-blur">
          <div className="px-6 pt-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl tracking-tight">
                Crop Profile Picture
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Drag to reposition, pinch or scroll to zoom
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Cropper */}
            {originalImageUrl && (
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60">
                <div className="relative aspect-square bg-black">
                  <Cropper
                    image={originalImageUrl}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
              </div>
            )}

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
                onClick={handleCropCancel}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isUploadingPicture}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRotate}
                variant="outline"
                className="rounded-xl px-3"
                disabled={isUploadingPicture}
              >
                <HugeiconsIcon icon={RotateClockwiseIcon} size={16} />
              </Button>
              <Button
                type="button"
                onClick={handleCropConfirm}
                className={cn(
                  "flex-1 rounded-xl",
                  "bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                )}
                disabled={isUploadingPicture}
              >
                {isUploadingPicture ? (
                  <>
                    <HugeiconsIcon icon={Loading01Icon} size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SignInModal showSignInModal={showSignInModal} setShowSignInModal={setShowSignInModal} />
    </div>
  );
}
