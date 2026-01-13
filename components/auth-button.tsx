"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { SignInModal } from "./ui/signInModal";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [showSignInModal, setShowSignInModal] = useState(false);

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-6 w-6 rounded-full"
          />
        )}
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session.user?.name || session.user?.email}
        </span>
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
