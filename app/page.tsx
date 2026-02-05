import { getPhotos } from "@/app/db/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import { HomePageClient } from "@/components/home-page-client";
import { DogCard } from "@/components/dog-card/dog-card";
import { type LightboxSlide } from "@/components/lightbox-image/index";
import { unstable_noStore as noStore } from "next/cache";

// Force dynamic rendering - photos are fetched fresh each request
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function buildSlide(photo: {
  src: string;
  alt: string;
  ownerDisplayName?: string | null;
}): LightboxSlide {
  return {
    src: photo.src,
    alt: photo.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${photo.ownerDisplayName || "Anonymous"}`,
  };
}

export default async function Home() {
  noStore();

  // Generate seed on server for consistent random ordering
  // Using crypto for a unique seed per request
  const seed = crypto.randomUUID().replace(/-/g, "").substring(0, 12);

  const [photosResult, session] = await Promise.all([
    getPhotos(PAGE_SIZE, 0, seed),
    getServerSession(authOptions),
  ]);

  const initialPhotos = photosResult.data?.photos ?? [];
  const initialHasMore = photosResult.data?.hasMore ?? false;
  const currentUserId = session?.user?.id;

  return (
    <HomePageClient
      initialPhotos={initialPhotos}
      initialHasMore={initialHasMore}
      seed={seed}
      currentUserId={currentUserId}
    >
      {/* These DogCards are SERVER-RENDERED - images in initial HTML */}
      {initialPhotos.map((photo, index) => {
        const isOwner =
          currentUserId != null &&
          (currentUserId === photo.userId || currentUserId === "admin");

        return (
          <DogCard
            key={photo.id}
            id={photo.id}
            src={photo.src}
            alt={photo.alt}
            userId={photo.userId}
            ownerDisplayName={photo.ownerDisplayName}
            ownerProfilePicture={photo.ownerProfilePicture}
            isOwner={isOwner}
            showInfoPanel={true}
            priority={index < 6}
            slide={buildSlide(photo)}
            enableLightbox={true}
            // Note: gallery comes from GalleryContext, not props
          />
        );
      })}
    </HomePageClient>
  );
}
