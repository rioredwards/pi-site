"use client";

import { deletePhoto } from "@/app/actions";
import { Photo } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import { DogCard } from "./dog-card/dog-card";
import { LightboxSlide, useLightbox } from "./lightbox";

interface ProfilePhotosGridProps {
  photos: Photo[];
  isOwner?: boolean;
}

export function ProfilePhotosGrid({ photos, isOwner = false }: ProfilePhotosGridProps) {
  const { openGallery } = useLightbox();
  const router = useRouter();
  const { toast } = useToast();

  const slides: LightboxSlide[] = photos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${photo.ownerDisplayName || "Anonymous"}`,
  }));

  const showLightbox = (index: number) => {
    openGallery(slides, index);
  };

  const confirmDelete = async (id: string) => {
    const result = await deletePhoto(id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error || "There was a problem deleting your photo.",
        variant: "destructive",
      });
    } else {
      router.refresh();
      toast({
        title: "Success",
        description: "Your photo has been deleted.",
      });
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {photos.map((photo, index) => (
          <DogCard
            key={photo.id}
            {...photo}
            deletePhoto={() => confirmDelete(photo.id)}
            showLightbox={() => showLightbox(index)}
            priority={true}
            showInfoPanel={false}
          />
        ))}
      </div>
    </>
  );
}
