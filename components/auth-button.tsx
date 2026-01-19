"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={displayName || "User"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
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
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
