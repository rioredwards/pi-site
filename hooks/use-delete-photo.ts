"use client";

import { deletePhoto as deletePhotoAction } from "@/app/actions";
import { useCallback } from "react";
import { useToast } from "./use-toast";

interface UseDeletePhotoOptions {
  onSuccess: (id: string) => void;
}

export function useDeletePhoto({ onSuccess }: UseDeletePhotoOptions) {
  const { toast } = useToast();

  const deletePhoto = useCallback(
    async (id: string) => {
      const result = await deletePhotoAction(id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error || "There was a problem deleting your photo.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Success",
        description: "Your photo has been deleted.",
      });
      onSuccess(id);
    },
    [onSuccess, toast],
  );

  return { deletePhoto };
}
