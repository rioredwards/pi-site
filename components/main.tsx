"use client";

import shuffle from "lodash.shuffle";
import { useSession } from "next-auth/react";
import { lazy, Suspense, useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { deletePhoto as deletePhotoFile, getPhotos } from "../app/actions";
import { ImgCard } from "../components/ui/imgCard";
import { useToast } from "../hooks/use-toast";
import { Photo } from "../lib/types";

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      const response = await getPhotos();
      // console.log("response", response);
      if (response.data) {
        const shuffledPhotos = shuffle(response.data);
        setPhotos(shuffledPhotos);
      } else {
        console.error(response.error);
        toast({
          title: "Error",
          description: "There was a problem fetching photos.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
    fetchPhotos();
  }, [toast]);

  function addPhoto(photo: Photo) {
    setPhotos((prevPhotos) => [photo, ...prevPhotos]);
  }

  async function deletePhoto(id: string) {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be signed in to delete photos.",
        variant: "destructive",
      });
      return;
    }
    const targetPhoto = photos.find((photo) => photo.id === id) as Photo;
    if (targetPhoto.userId !== session.user.id && session.user.id !== "admin") {
      toast({
        title: "Error",
        description: "You can only delete your own photos.",
        variant: "destructive",
      });
      return;
    }
    const res = await deletePhotoFile(id);
    if (res.error) {
      console.error(res.error);
      toast({
        title: "Error",
        description: res.error || "There was a problem deleting your photo.",
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
    <div className="container mx-auto min-h-96 px-4 py-8">
      <Suspense>
        {typeof window !== "undefined" && <PhotoUpload addPhoto={addPhoto} />}
      </Suspense>
      {isLoading ? (
        <div className="mt-24 flex items-center justify-center">
          <BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} />
        </div>
      ) : !photos.length ? (
        <div className="mt-24 flex items-center justify-center">
          <p className="text-lg text-gray-500">
            No photos yet. Upload one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <ImgCard
              id={photo.id}
              src={photo.src}
              alt={photo.alt}
              key={photo.id}
              userId={photo.userId}
              deletePhoto={deletePhoto}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
