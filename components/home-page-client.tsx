"use client";

import { devLog } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { getPhotos } from "@/app/actions";
import { Photo } from "@/app/lib/types";
import { useDeletePhoto } from "@/hooks/use-delete-photo";
import { useToast } from "@/hooks/use-toast";
import { DogCard } from "./dog-card/dog-card";
import { DeleteContext } from "./dog-card/delete-context";
import { GalleryContext } from "./gallery-context";
import { DeleteDogConfirmationDialog } from "./dialogs/delete-dog-confirmation-dialog";
import { type LightboxSlide } from "@/components/lightbox-image/index";

const PAGE_SIZE = 12;

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

function buildSlide(photo: Photo): LightboxSlide {
  return {
    src: photo.src,
    alt: photo.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${photo.ownerDisplayName || "Anonymous"}`,
  };
}

interface HomePageClientProps {
  children: React.ReactNode;
  initialPhotos: Photo[];
  initialHasMore: boolean;
  seed: string;
  currentUserId?: string | null;
}

export function HomePageClient({
  children,
  initialPhotos,
  initialHasMore,
  seed,
  currentUserId,
}: HomePageClientProps) {
  // Track uploaded photos (prepended) and additional loaded photos (appended)
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [additionalPhotos, setAdditionalPhotos] = useState<Photo[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: session } = useSession();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Effective user ID (from props or session)
  const effectiveUserId = currentUserId ?? session?.user?.id;

  // All photos in order: uploaded (newest) + initial (server) + additional (loaded)
  const allPhotos = useMemo(
    () => [...uploadedPhotos, ...initialPhotos, ...additionalPhotos],
    [uploadedPhotos, initialPhotos, additionalPhotos]
  );

  // Build slides for all photos
  const allSlides = useMemo(() => allPhotos.map(buildSlide), [allPhotos]);

  // Create a map from photo ID to index for gallery context
  const photoIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    allPhotos.forEach((photo, index) => {
      map.set(photo.id, index);
    });
    return map;
  }, [allPhotos]);

  const getIndex = useCallback(
    (photoId: string) => photoIdToIndex.get(photoId) ?? 0,
    [photoIdToIndex]
  );

  // Delete photo handler
  const { deletePhoto } = useDeletePhoto({
    onSuccess: useCallback((id: string) => {
      setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
      setAdditionalPhotos((prev) => prev.filter((p) => p.id !== id));
      // Note: Can't remove from initialPhotos (server-rendered), but the card
      // will be removed on next page load. For now, we could hide it via CSS
      // or just accept this limitation.
    }, []),
  });

  // Load more photos
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    // Offset is initial + additional (not counting uploaded, as they're prepended)
    const offset = initialPhotos.length + additionalPhotos.length;
    const response = await getPhotos(PAGE_SIZE, offset, seed);
    if (response.data) {
      setAdditionalPhotos((prev) => [...prev, ...response.data!.photos]);
      setHasMore(response.data.hasMore);
    } else {
      devLog(response.error);
      toast({
        title: "Error",
        description: "There was a problem fetching more photos.",
        variant: "destructive",
      });
    }
    setIsFetchingMore(false);
  }, [isFetchingMore, hasMore, initialPhotos.length, additionalPhotos.length, seed, toast]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isFetchingMore]);

  // Add uploaded photo
  function addPhoto(photo: Photo) {
    setUploadedPhotos((prev) => [photo, ...prev]);
  }

  // Find photo for delete confirmation
  const confirmPhoto = deleteConfirmId
    ? allPhotos.find((p) => p.id === deleteConfirmId)
    : null;

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deletePhoto(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Check if a photo is owned by current user
  const isOwner = (photo: Photo) =>
    effectiveUserId != null &&
    (effectiveUserId === photo.userId || effectiveUserId === "admin");

  return (
    <div className="container mx-auto min-h-dvh px-4 py-8 md:pl-24">
      <Suspense
        fallback={
          <div className="mt-8 flex items-center justify-center">
            <BounceLoader
              color={"oklch(0.75 0.15 55)"}
              loading={true}
              size={25}
            />
          </div>
        }
      >
        {typeof window !== "undefined" && <PhotoUpload addPhoto={addPhoto} />}
      </Suspense>

      {allPhotos.length === 0 ? (
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
            Be the first to share a photo of your furry friend! Click the upload
            button above to get started.
          </p>
        </div>
      ) : (
        <DeleteContext.Provider value={{ onDeleteClick: setDeleteConfirmId }}>
          <GalleryContext.Provider value={{ slides: allSlides, getIndex }}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {/* Uploaded photos (client-rendered, newest first) */}
              {uploadedPhotos.map((photo) => (
                <DogCard
                  key={photo.id}
                  id={photo.id}
                  src={photo.src}
                  alt={photo.alt}
                  userId={photo.userId}
                  ownerDisplayName={photo.ownerDisplayName}
                  ownerProfilePicture={photo.ownerProfilePicture}
                  isOwner={isOwner(photo)}
                  showInfoPanel={true}
                  priority={false}
                  slide={buildSlide(photo)}
                  enableLightbox={true}
                />
              ))}

              {/* Initial photos (server-rendered children) */}
              {children}

              {/* Additional loaded photos (client-rendered) */}
              {additionalPhotos.map((photo) => (
                <DogCard
                  key={photo.id}
                  id={photo.id}
                  src={photo.src}
                  alt={photo.alt}
                  userId={photo.userId}
                  ownerDisplayName={photo.ownerDisplayName}
                  ownerProfilePicture={photo.ownerProfilePicture}
                  isOwner={isOwner(photo)}
                  showInfoPanel={true}
                  priority={false}
                  slide={buildSlide(photo)}
                  enableLightbox={true}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="h-4" />
            {isFetchingMore && (
              <div className="flex justify-center py-8">
                <BounceLoader
                  color={"oklch(0.75 0.15 55)"}
                  loading={true}
                  size={25}
                />
              </div>
            )}

            <DeleteDogConfirmationDialog
              open={deleteConfirmId !== null}
              onOpenChange={(open) => !open && setDeleteConfirmId(null)}
              onDelete={handleConfirmDelete}
              onCancel={() => setDeleteConfirmId(null)}
              src={confirmPhoto?.src ?? ""}
              alt={confirmPhoto?.alt ?? ""}
            />
          </GalleryContext.Provider>
        </DeleteContext.Provider>
      )}
    </div>
  );
}
