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
import { LucideDog } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { uploadPhoto } from "../app/actions";
import { reduceFileSize } from "../app/lib/imgCompress";
import { Photo } from "../app/lib/types";
import Confetti from "./Confetti";
import { GradientText } from "./funText";
import { DogBotCard } from "./ui/dogBotCard";
import { RotatingGradientBorder } from "./ui/RotatingGradientBorder";
import { SignInModal } from "./ui/signInModal";

interface Props {
  addPhoto: (photo: Photo) => void;
}

type ProcessingState = "preSelection" | "selected" | "processing" | "success" | "failure";

function getDogModalTitle(processingState: ProcessingState): string {
  switch (processingState) {
    case "preSelection":
      return "Upload Dog";
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
  const [processingState, setProcessingState] = useState<ProcessingState>("preSelection");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();
  const [showConfetti, setShowConfetti] = useState(false);

  const previewUrl = useMemo(() => {
    if (!files[0]) return null;
    return URL.createObjectURL(files[0]);
  }, [files]);

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

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one photo to upload.",
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

    const file = files[0];
    const resizedImg = await reduceFileSize(file, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);
    const formData = new FormData();
    formData.append("file", resizedImg);
    const res = await uploadPhoto(formData);

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, MIN_PROCESSING_TIME - elapsedTime);
    await new Promise((resolve) => setTimeout(resolve, remainingTime));

    if (res.error || !res.data) {
      devLog(res.error);
      setProcessingState("failure");
      return;
    }

    addPhoto(res.data);
    setProcessingState("success");
    setShowConfetti(true);
  };

  const resetFileInput = () => {
    setFiles([]);
    setProcessingState("preSelection");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => resetFileInput();
  const handleUploadAnother = () => resetFileInput();

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
      setProcessingState("selected");
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

  const isLocked = processingState === "processing";
  const showActions =
    processingState === "selected" ||
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
              "bg-white hover:bg-white",
              "shadow-sm transition-shadow hover:shadow-md pointer-coarse:shadow-md",
              "pointer-coarse:animate-pulse"
            )}>
            <GradientText className="text-md my-1 from-red-500 via-orange-500 to-yellow-500 text-primary transition-all group-hover:text-transparent pointer-coarse:text-transparent">
              <LucideDog
                style={{ width: "24px", height: "24px" }}
                className="-mt-[2px] mr-2 inline-block text-primary transition-all group-hover:text-red-500 pointer-coarse:text-red-500"
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
        <DialogContent className="sm:max-w-[560px] rounded-3xl border border-border/60 bg-background/90 p-0 shadow-2xl backdrop-blur">
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
              ) : (
                <div className="space-y-4">
                  {/* Image stage */}
                  <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60">
                    <div className="relative aspect-square">
                      <Image
                        src={previewUrl!}
                        alt="Dog photo"
                        fill={true}
                        className={cn(
                          "object-cover transition duration-500",
                          processingState === "processing" ||
                            processingState === "success" ||
                            processingState === "failure"
                            ? "scale-[1.01] saturate-[0.9]"
                            : ""
                        )}
                      />

                      {/* Subtle vignette when card is shown (processing/success/failure) */}
                      {(processingState === "processing" ||
                        processingState === "success" ||
                        processingState === "failure") && (
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/20" />
                      )}

                      {/* Persistent Dog Bot card overlay (processing/success/failure) */}
                      <DogBotCard processingState={processingState} />
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex gap-2">
                      {processingState === "selected" ? (
                        <>
                          <Button
                            type="button"
                            onClick={handleCancel}
                            variant="outline"
                            className="flex-1 rounded-xl"
                            disabled={isLocked}>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            disabled={isLocked}>
                            Upload
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={handleUploadAnother}
                            variant="outline"
                            className="flex-1 rounded-xl"
                            disabled={isLocked}>
                            Upload Another
                          </Button>
                          <Button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 rounded-xl"
                            disabled={isLocked}>
                            Close
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

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
        </DialogContent>
      </Dialog>

      <SignInModal showSignInModal={showSignInModal} setShowSignInModal={setShowSignInModal} />
    </section>
  );
}
