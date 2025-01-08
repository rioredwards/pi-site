"use client";

import shuffle from "lodash.shuffle";
import { lazy, Suspense, useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { deletePhoto as deletePhotoFile, getPhotos } from "../app/actions";
import { ImgCard } from "../components/ui/imgCard";
import { useCookie } from "../context/CookieCtx";
import { useToast } from "../hooks/use-toast";
import { Photo } from "../lib/types";

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { toast } = useToast();
  const { cookie } = useCookie();

  useEffect(() => {
    async function fetchPhotos() {
      const response = await getPhotos();
      if (response.data) {
        const shuffledPhotos = shuffle(response.data);
        setPhotos(shuffledPhotos);
      } else {
        console.error(response.error);
        toast({
          title: "Error",
          description: "There was a problem fetching photos. Try reloading the page.",
          variant: "destructive",
        });
      }
    }
    fetchPhotos();
  }, [toast]);

  function addPhoto(photo: Photo) {
    setPhotos((prevPhotos) => [photo, ...prevPhotos]);
  }

  async function deletePhoto(id: string) {
    if (!cookie) {
      toast({
        title: "Error",
        description: "You must enable cookies to delete a photo.",
        variant: "destructive",
      });
      return;
    }
    const targetPhoto = photos.find((photo) => photo.id === id) as Photo;
    if (cookie !== targetPhoto.sessionId && cookie !== "admin") {
      toast({
        title: "Error",
        description: "You can only delete your own photos.",
        variant: "destructive",
      });
      return;
    }
    const res = await deletePhotoFile(id, targetPhoto.imgFilename);
    if (res.error) {
      console.error(res.error);
      toast({
        title: "Error",
        description: "There was a problem deleting your photo.",
        variant: "destructive",
      });
      return;
    }
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id));
    toast({
      title: "Success",
      description: "Your photo has been deleted.",
    });
  }

  return (
    <div className="container px-4 py-8 mx-auto min-h-96">
      <Suspense>{typeof window !== "undefined" && <PhotoUpload addPhoto={addPhoto} />}</Suspense>
      {!photos.length && (
        <div className="mt-24 flex justify-center items-center">
          <BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <ImgCard
            id={photo.id}
            src={photo.src}
            alt={photo.alt}
            key={photo.id}
            sessionId={photo.sessionId}
            deletePhoto={deletePhoto}
          />
        ))}
      </div>
    </div>
  );
}
