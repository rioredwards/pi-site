"use client";

import shuffle from "lodash.shuffle";
import { useSession } from "next-auth/react";
import { lazy, Suspense, useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { deletePhoto as deletePhotoFile, getPhotos } from "../app/actions";
import { Photo } from "../app/lib/types";
import { useToast } from "../hooks/use-toast";
import { devLog } from "@/app/lib/utils";
import { DogFlipCard } from "./dog-flip-card";

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
        devLog(response.error);
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
      devLog(res.error);
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
      <Suspense>{typeof window !== "undefined" && <PhotoUpload addPhoto={addPhoto} />}</Suspense>
      {isLoading ? (
        <div className="mt-24 flex items-center justify-center">
          <BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} />
        </div>
      ) : !photos.length ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold">No dogs here yet</h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Be the first to share a photo of your furry friend! Click the upload button above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <DogFlipCard
              id={photo.id}
              src={photo.src}
              alt={photo.alt}
              key={photo.id}
              userId={photo.userId}
              ownerDisplayName={photo.ownerDisplayName}
              deletePhoto={deletePhoto}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
