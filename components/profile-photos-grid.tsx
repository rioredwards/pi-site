"use client";

import { Photo } from "@/app/lib/types";
import { useDeletePhoto } from "@/hooks/use-delete-photo";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PhotoGrid } from "./photo-grid";

interface ProfilePhotosGridProps {
  photos: Photo[];
}

export function ProfilePhotosGrid({ photos }: ProfilePhotosGridProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const { deletePhoto } = useDeletePhoto({
    onSuccess: useCallback(() => {
      router.refresh();
    }, [router]),
  });

  return (
    <PhotoGrid
      photos={photos}
      deletePhoto={deletePhoto}
      currentUserId={session?.user?.id}
      columns={3}
      className="grid-cols-2 gap-2 md:grid-cols-3"
      enableLightbox
      showInfoPanel={false}
      priorityStrategy="all"
    />
  );
}
