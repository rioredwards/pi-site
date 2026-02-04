"use client";

import { deletePhoto } from "@/app/actions";
import { Photo } from "@/app/lib/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PhotoGrid } from "./photo-grid";
import { useToast } from "../hooks/use-toast";

interface ProfilePhotosGridProps {
  photos: Photo[];
}

export function ProfilePhotosGrid({ photos }: ProfilePhotosGridProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
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
    <PhotoGrid
      photos={photos}
      deletePhoto={handleDelete}
      currentUserId={session?.user?.id}
      columns={3}
      className="grid-cols-2 gap-2 md:grid-cols-3"
      enableLightbox
      showInfoPanel={false}
      priorityStrategy="all"
    />
  );
}
