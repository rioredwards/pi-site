import { DialogDescription } from "@radix-ui/react-dialog";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DeleteDogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onCancel: () => void;
  src: string;
  alt: string;
}

export function DeleteDogConfirmationDialog({
  open,
  onOpenChange,
  onDelete,
  onCancel,
  src,
  alt,
}: DeleteDogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete dog?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, 400px"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="cursor-pointer rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
