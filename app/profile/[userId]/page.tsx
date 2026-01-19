import { getServerSession } from "next-auth";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/auth";
import { getUserProfile } from "@/app/db/actions";
import { getProfilePictureUrl } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { User, Pencil } from "lucide-react";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);
  const result = await getUserProfile(decodedUserId);

  if (result.error || !result.data) {
    return { title: "User Not Found | DogTownUSA" };
  }

  const displayName = result.data.displayName || "Anonymous User";
  return {
    title: `${displayName}'s Profile | DogTownUSA`,
    description: `View ${displayName}'s profile on DogTownUSA`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const decodedUserId = decodeURIComponent(userId);

  const [session, profileResult] = await Promise.all([
    getServerSession(authOptions),
    getUserProfile(decodedUserId),
  ]);

  if (profileResult.error || !profileResult.data) {
    notFound();
  }

  const profile = profileResult.data;
  const isOwner = session?.user?.id === decodedUserId;
  const profilePictureUrl = getProfilePictureUrl(profile.profilePicture);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Profile Picture */}
          <div className="relative">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={profile.displayName || "User"}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-background shadow-lg"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted ring-4 ring-background shadow-lg">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.displayName || "Anonymous User"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {profile.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {isOwner && (
              <Link href="/profile/edit" className="mt-4 inline-block">
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Additional Info Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 text-muted-foreground">
            {isOwner
              ? "This is your public profile. Other users can see your display name and profile picture."
              : "This user hasn't added any additional information yet."}
          </p>
        </div>
      </div>
    </div>
  );
}
