"use client";

import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/app/db/actions";
import { getProfilePictureUrl } from "@/app/lib/utils";
import { User as UserType } from "@/app/lib/types";
import { LogIn, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInModal } from "./ui/signInModal";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [profile, setProfile] = useState<UserType | null>(null);

  // Fetch user profile when session is available
  useEffect(() => {
    async function loadProfile() {
      if (session?.user?.id) {
        const result = await getUserProfile(session.user.id);
        if (result.data) {
          setProfile(result.data);
        }
      }
    }
    loadProfile();
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (session) {
    // Use custom profile data if available, otherwise fallback to OAuth data
    const profilePictureUrl = profile?.profilePicture
      ? getProfilePictureUrl(profile.profilePicture)
      : session.user?.image;
    const displayName = profile?.displayName || session.user?.name || session.user?.email;
    const profileUrl = session.user?.id ? `/profile/${encodeURIComponent(session.user.id)}` : "#";

    return (
      <div className="flex items-center gap-2">
        <Link href={profileUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={displayName || "User"}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {displayName}
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="flex items-center gap-1">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setShowSignInModal(true)}
        className="flex items-center gap-1">
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </Button>
      <SignInModal showSignInModal={showSignInModal} setShowSignInModal={setShowSignInModal} />
    </>
  );
}
