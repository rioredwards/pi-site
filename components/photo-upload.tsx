"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/utils";
import { LucideDog } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRef, useState } from "react";
import PulseLoader from "react-spinners/PulseLoader";
import { uploadPhoto } from "../app/actions";
import { reduceFileSize } from "../app/lib/imgCompress";
import { Photo } from "../app/lib/types";
import { cn } from "../lib/utils";
import Confetti from "./Confetti";
import { GradientText } from "./funText";
import { RotatingGradientBorder } from "./ui/RotatingGradientBorder";

interface Props {
  addPhoto: (photo: Photo) => void;
}

export default function PhotoUpload({ addPhoto }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to upload photos.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one photo to upload.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const MAX_FILE_SIZE = 500 * 1000; // 500kB
    const MAX_WIDTH = 1000; // 1000px
    const MAX_HEIGHT = 1000; // 1000px
    const QUALITY = 0.9; // 90%

    const uploadedPhotos: Photo[] = [];

    for (const file of files) {
      const resizedImg = await reduceFileSize(file, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);
      const formData = new FormData();
      formData.append("file", resizedImg);

      const res = await uploadPhoto(formData);
      if (res.error || !res.data) {
        devLog(res.error);
        toast({
          title: "Error",
          description: res.error || "There was a problem uploading one of your photos.",
          variant: "destructive",
        });
        continue;
      }

      uploadedPhotos.push(res.data);
    }

    if (uploadedPhotos.length > 0) {
      toast({
        title: "Success",
        description: `${uploadedPhotos.length} photo(s) have been uploaded successfully.`,
      });
      uploadedPhotos.forEach(addPhoto);
      setShowConfetti(true);
    }

    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 3) {
        toast({
          title: "Error",
          description: "You can only upload up to 3 photos.",
          variant: "destructive",
        });
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleUploadButtonClick = (e: React.MouseEvent) => {
    if (status === "loading") {
      e.preventDefault();
      return;
    }
    if (!session?.user?.id) {
      e.preventDefault();
      setShowSignInModal(true);
      return;
    }
    // If authenticated, let the default label behavior work (triggers file input)
  };

  return (
    <section className="container mb-8">
      <form onSubmit={handleSubmit}>
        {showConfetti && <Confetti setShowConfetti={setShowConfetti} />}
        {!files.length && (
          <div className="flex justify-center">
            <RotatingGradientBorder
              borderRadius="9999px"
              containerClassName="group"
              borderClassName="!opacity-[0.6] transition-all"
              shadowClassName="!opacity-[0] group-hover:!opacity-[0.2] transition-all">
              <Label
                htmlFor={session?.user?.id ? "photo" : undefined}
                onClick={handleUploadButtonClick}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-full px-8 py-4 text-lg font-bold",
                  "text-primary",
                  "bg-white"
                )}>
                <GradientText className="text-md my-1 from-red-500 via-orange-500 to-yellow-500 text-primary transition-all group-hover:text-transparent">
                  <LucideDog className="-mt-[2px] mr-2 inline-block h-6 w-6 text-primary transition-all group-hover:text-red-500" />
                  Upload Your Dogs
                </GradientText>
              </Label>
            </RotatingGradientBorder>
          </div>
        )}
        {files.length > 0 && (
          <RotatingGradientBorder
            borderRadius="1rem"
            containerClassName={cn(
              "w-full max-w-[32rem] group mx-auto",
              files.length > 1 && "max-w-[48rem]",
              files.length > 2 && "max-w-[64rem]"
            )}
            borderClassName="!opacity-[0.6] transition-all"
            shadowClassName="!opacity-[0] group-hover:!opacity-[0.4] transition-all">
            <div
              className={cn(
                "flex flex-col items-center px-14 py-12",
                "rounded-2xl text-primary",
                "bg-white"
              )}>
              <p className="mb-4 text-center text-2xl font-bold">
                {files.length === 1 ? "Upload this Dog?" : "Upload these Dogs?"}
              </p>
              <div className="mb-8 h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div
                className={cn(
                  "mb-8 grid w-full grid-cols-1 gap-4",
                  files.length > 1 && "md:grid-cols-2",
                  files.length > 2 && "lg:grid-cols-3"
                )}>
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative aspect-square h-full w-full overflow-hidden rounded-lg"
                    )}>
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Dog photo ${idx + 1}`}
                      fill={true}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="flex w-full space-x-2">
                <Button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-800 transition hover:bg-gray-300">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="default"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 font-medium text-white transition hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800">
                  {!isSubmitting ? (
                    "Upload"
                  ) : (
                    <span className="flex items-center gap-2">
                      <PulseLoader color="white" loading={true} size={5} />
                      Dog Verification Bot Processing...
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </RotatingGradientBorder>
        )}
        <Input
          id="photo"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
      </form>
      <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>Please sign in to upload photos to the gallery.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => signIn("github")}
              className="flex h-11 w-full items-center justify-center gap-3 text-base"
              variant="outline">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </Button>
            <Button
              onClick={() => signIn("google")}
              className="flex h-11 w-full items-center justify-center gap-3 text-base"
              variant="outline">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSignInModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
