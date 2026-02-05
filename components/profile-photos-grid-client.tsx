"use client";

import { useDeletePhoto } from "@/hooks/use-delete-photo";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { DeleteContext } from "./dog-card/delete-context";
import { DeleteDogConfirmationDialog } from "./dialogs/delete-dog-confirmation-dialog";

interface ProfilePhotosGridClientProps {
  children: React.ReactNode;
  /** Photo data needed for delete confirmation dialog */
  photoLookup: Record<string, { src: string; alt: string }>;
}

export function ProfilePhotosGridClient({
  children,
  photoLookup,
}: ProfilePhotosGridClientProps) {
  const router = useRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { deletePhoto } = useDeletePhoto({
    onSuccess: useCallback(() => {
      router.refresh();
    }, [router]),
  });

  const confirmPhoto = deleteConfirmId ? photoLookup[deleteConfirmId] : null;

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deletePhoto(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <DeleteContext.Provider value={{ onDeleteClick: setDeleteConfirmId }}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {children}
      </div>
      <DeleteDogConfirmationDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onDelete={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        src={confirmPhoto?.src ?? ""}
        alt={confirmPhoto?.alt ?? ""}
      />
    </DeleteContext.Provider>
  );
}
