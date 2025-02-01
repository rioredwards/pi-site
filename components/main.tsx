"use client";
import { lazy, useEffect, useState } from "react";
import { getPhoto } from "../app/actions";
import { useToast } from "../hooks/use-toast";
import { Photo } from "../lib/types";
import { ImgCard } from "./ui/imgCard";

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

export function Main() {
  const [photo, setPhoto] = useState<Photo | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPhoto() {
      const response = await getPhoto();
      if (response.data) {
        const newPhoto = response.data;
        setPhoto(newPhoto);
      } else {
        console.error(response.error);
        toast({
          title: "Error",
          description: "There was a problem fetching photos. Try reloading the page.",
          variant: "destructive",
        });
      }
    }
    fetchPhoto();
  }, [toast]);

  return (
    <div className="container px-4 py-8 mx-auto min-h-96">
      {photo && <ImgCard src={photo.src} alt={photo.alt} key={photo.id} />}
    </div>
  );
}
