"use client";

import { getUserProfile } from "@/app/db/actions";
import { User as UserType } from "@/app/lib/types";
import { getProfilePictureUrl } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Login01Icon, Logout01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex cursor-pointer items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={displayName || "User"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={UserIcon} size={16} className="text-muted-foreground" />
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{displayName}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={profileUrl} className="cursor-pointer">
              <HugeiconsIcon icon={UserIcon} size={16} className="mr-2" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex cursor-pointer items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon icon={UserIcon} size={16} className="text-muted-foreground" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => setShowSignInModal(true)}
            className="cursor-pointer"
          >
            <HugeiconsIcon icon={Login01Icon} size={16} className="mr-2" />
            Sign In
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    </>
  );
}
