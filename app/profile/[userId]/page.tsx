import { authOptions } from "@/app/auth";
import { getPhotosByUserId, getUserProfile } from "@/app/db/actions";
import { getProfilePictureUrl } from "@/lib/utils";
import { ProfilePhotosGridClient } from "@/components/profile-photos-grid-client";
import { DogCard } from "@/components/dog-card/dog-card";
import { type LightboxSlide } from "@/components/lightbox-image/index";
import { Button } from "@/components/ui/button";
import { PencilEdit01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

// Force dynamic rendering - profile data must be fetched at runtime
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  noStore();
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);
  const result = await getUserProfile(decodedUserId);

  if (result.error || !result.data) {
    return { title: "User Not Found | DogTown" };
  }

  const displayName = result.data.displayName || "Anonymous User";
  return {
    title: `${displayName}'s Profile | DogTown`,
    description: `View ${displayName}'s profile on DogTown`,
  };
}

export default async function ProfilePage({ params }: Props) {
  noStore();
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);

  const [session, profileResult, photosResult] = await Promise.all([
    getServerSession(authOptions),
    getUserProfile(decodedUserId),
    getPhotosByUserId(decodedUserId),
  ]);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  const profile = profileResult.data;
  const photos = photosResult.data || [];
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === decodedUserId;
  const profilePictureUrl = getProfilePictureUrl(profile.profilePicture);

  // Build slides for lightbox gallery
  const slides: LightboxSlide[] = photos.map((p) => ({
    src: p.src,
    alt: p.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${p.ownerDisplayName || "Anonymous"}`,
  }));

  // Build lookup for delete confirmation dialog
  const photoLookup = Object.fromEntries(
    photos.map((p) => [p.id, { src: p.src, alt: p.alt }])
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Profile Picture */}
          <div className="relative">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={profile.displayName || "User"}
                className="h-32 w-32 rounded-full object-cover shadow-lg ring-4 ring-background"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted shadow-lg ring-4 ring-background">
                <HugeiconsIcon
                  icon={UserIcon}
                  size={64}
                  className="text-muted-foreground"
                />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.displayName || "Anonymous User"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since{" "}
              {profile.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {isOwner && (
              <Link href="/profile/edit" className="mt-4 inline-block">
                <Button variant="outline" size="sm" className="gap-2">
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Photos Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            {isOwner
              ? "Your Posts"
              : `${profile.displayName || "User"}'s Posts`}
          </h2>
          {photos.length > 0 ? (
            <ProfilePhotosGridClient photoLookup={photoLookup}>
              {photos.map((photo, index) => {
                const photoIsOwner =
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
                    isOwner={photoIsOwner}
                    showInfoPanel={false}
                    priority={true}
                    slide={slides[index]}
                    gallery={slides}
                    galleryIndex={index}
                    enableLightbox={true}
                  />
                );
              })}
            </ProfilePhotosGridClient>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                {isOwner
                  ? "You haven't posted any photos yet. Share your first dog photo!"
                  : "This user hasn't posted any photos yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
