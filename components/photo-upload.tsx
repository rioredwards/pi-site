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
import { GradientText } from "./funText";
import { RotatingGradientBorder } from "./ui/RotatingGradientBorder";

interface Props {
  addPhoto: (photo: Photo) => void;
}

export function PhotoUpload({ addPhoto }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cookie } = useCookie();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!cookie) {
      toast({
        title: "Error",
        description: "You must enable cookies to upload a photo.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();

    // If file size > 500kB, resize such that width <= 1000, quality = 0.9
    console.log("Original file:", file);
    const MAX_FILE_SIZE = 500 * 1000; // 500kB
    const MAX_WIDTH = 1000; // 1000px
    const MAX_HEIGHT = 1000; // 1000px
    const QUALITY = 0.9; // 90%

    const resizedImg = await reduceFileSize(file, MAX_FILE_SIZE, MAX_WIDTH, MAX_HEIGHT, QUALITY);

    formData.append("file", resizedImg);

    const res = await uploadPhoto(formData);
    if (res.error || !res.data) {
      console.error(res.error);
      toast({
        title: "Error",
        description: "There was a problem uploading your photo.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Success",
      description: "Your photo has been uploaded.",
    });
    setFile(null);
    setIsSubmitting(false);
    addPhoto(res.data);
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="flex flex-col items-center justify-center mb-8">
      <form onSubmit={handleSubmit}>
        {/* Upload Dog Btn */}
        {!file && (
          <RotatingGradientBorder
            borderRadius="9999px"
            containerClassName="group"
            borderClassName="!opacity-[0.6] transition-all"
            shadowClassName="!opacity-[0] group-hover:!opacity-[0.2] transition-all"
            // backgroundColor="transparent"
          >
            <Label
              htmlFor="photo"
              className={cn(
                "py-4 px-8 rounded-full flex items-center justify-center cursor-pointer text-lg font-bold",
                "text-primary",
                "bg-white "
              )}>
              <GradientText className="text-md my-1 from-red-500 via-orange-500 to-yellow-500 text-primary group-hover:text-transparent transition-all">
                <LucideDog className="h-6 w-6 mr-2 -mt-[2px] inline-block text-primary group-hover:text-red-500 transition-all" />
                Upload Your Dog
              </GradientText>
              {/* <LucideDog className="h-6 w-6 ml-2 mt-[2px]" /> */}
              {/* <span className="text-2xl ml-2"> 🐶</span> */}
            </Label>
          </RotatingGradientBorder>
        )}
        {/* Confirmation & Preview Card */}
        {file && (
          <RotatingGradientBorder
            borderRadius="1rem"
            containerClassName="group"
            borderClassName="!opacity-[0.6] transition-all"
            shadowClassName="!opacity-[0] group-hover:!opacity-[0.4] transition-all">
            <div
              className={cn(
                "flex flex-col items-center py-12 px-14",
                "text-primary rounded-2xl",
                "bg-white"
              )}>
              <p className="text-center mb-4 font-bold text-2xl">Upload this Dog?</p>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
              File Type: {file.type}
              <Label
                htmlFor="photo"
                className="w-72 h-72 mb-8 relative aspect-square overflow-hidden rounded-lg cursor-pointer">
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Dog photo"
                  width={0}
                  height={0}
                  fill={true}
                  className="object-cover"
                />
              </Label>
              {/* Confirm or Cancel Buttons */}
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
        {/* Hidden File Input (controlled using labels above because styling these is annoying) */}
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          ref={fileInputRef}
        />
      </form>
    </section>
  );
}
