"use client";

import { devLog } from "@/app/lib/utils";
import { useSession } from "next-auth/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { getPhotos } from "../app/actions";
import { Photo } from "../app/lib/types";
import { useDeletePhoto } from "../hooks/use-delete-photo";
import { useToast } from "../hooks/use-toast";
import { PhotoGrid } from "./photo-grid";

const PAGE_SIZE = 12;

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

function PhotoGridSkeleton() {
  return (
    <div className="mt-24 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted/40"
        >
          <div className="h-full w-full animate-pulse bg-linear-to-br from-muted/80 via-muted/40 to-muted/80" />
        </div>
      ))}
    </div>
  );
}

export function Main() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seed] = useState(() => Math.random().toString(36).substring(2));
  const { toast } = useToast();
  const { data: session } = useSession();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { deletePhoto } = useDeletePhoto({
    onSuccess: useCallback((id: string) => {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    }, []),
  });

  // Initial fetch
  useEffect(() => {
    async function fetchPhotos() {
      setIsLoading(true);
      const response = await getPhotos(PAGE_SIZE, 0, seed);
      if (response.data) {
        setPhotos(response.data.photos);
        setHasMore(response.data.hasMore);
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
  }, [toast, seed]);

  // Load more photos
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const response = await getPhotos(PAGE_SIZE, photos.length, seed);
    if (response.data) {
      setPhotos((prev) => [...prev, ...response.data!.photos]);
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
  }, [isFetchingMore, hasMore, photos.length, seed, toast]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetchingMore &&
          !isLoading
        ) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isFetchingMore, isLoading]);

  function addPhoto(photo: Photo) {
    setPhotos((prevPhotos) => [photo, ...prevPhotos]);
  }

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
      {isLoading ? (
        <PhotoGridSkeleton />
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
            Be the first to share a photo of your furry friend! Click the upload
            button above to get started.
          </p>
        </div>
      ) : (
        <>
          <PhotoGrid
            photos={photos}
            deletePhoto={deletePhoto}
            currentUserId={session?.user?.id}
            enableLightbox
            showInfoPanel
          />
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
        </>
      )}
    </div>
  );
}
