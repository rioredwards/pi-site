"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LucideDog } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import PulseLoader from "react-spinners/PulseLoader";
import { uploadPhoto } from "../app/actions";
import { useCookie } from "../context/CookieCtx";
import { reduceFileSize } from "../lib/imgCompress";
import { Photo } from "../lib/types";
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cookie } = useCookie();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!cookie) {
      toast({
        title: "Error",
        description: "You must enable cookies to upload photos.",
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
        console.error(res.error);
        toast({
          title: "Error",
          description: "There was a problem uploading one of your photos.",
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
                htmlFor="photo"
                className={cn(
                  "py-4 px-8 rounded-full flex items-center justify-center cursor-pointer text-lg font-bold",
                  "text-primary",
                  "bg-white "
                )}>
                <GradientText className="text-md my-1 from-red-500 via-orange-500 to-yellow-500 text-primary group-hover:text-transparent transition-all">
                  <LucideDog className="h-6 w-6 mr-2 -mt-[2px] inline-block text-primary group-hover:text-red-500 transition-all" />
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
                "flex flex-col items-center py-12 px-14",
                "text-primary rounded-2xl",
                "bg-white"
              )}>
              <p className="text-center mb-4 font-bold text-2xl">
                {files.length === 1 ? "Upload this Dog?" : "Upload these Dogs?"}
              </p>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
              <div
                className={cn(
                  "w-full grid-cols-1 gap-4 mb-8 grid",
                  files.length > 1 && "md:grid-cols-2",
                  files.length > 2 && "lg:grid-cols-3"
                )}>
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg w-full h-full"
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
              <div className="flex space-x-2 w-full">
                <Button
                  onClick={handleCancel}
                  className="bg-gray-200 hover:bg-gray-300 flex-1 transition text-gray-800">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="default"
                  className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium flex-1 transition">
                  {!isSubmitting ? (
                    "Upload"
                  ) : (
                    <>
                      <PulseLoader color="white" loading={true} size={5} />
                    </>
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
    </section>
  );
}
