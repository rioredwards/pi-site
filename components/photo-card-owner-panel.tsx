"use client";

import { User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn, getProfilePictureUrl } from "@/app/lib/utils";

interface PhotoCardOwnerPanelProps {
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  className?: string;
}

export function PhotoCardOwnerPanel({
  userId,
  ownerDisplayName,
  ownerProfilePicture,
  className,
}: PhotoCardOwnerPanelProps) {
  const [profilePicError, setProfilePicError] = useState(false);

  return (
    <Link
      href={`/profile/${encodeURIComponent(userId)}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "invisible absolute right-0 -bottom-20 left-0 z-30 flex items-center gap-3 rounded-t-2xl bg-background/70 px-4 py-3 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out group-hover:bottom-0 hover:bg-background/80",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {ownerProfilePicture && !profilePicError ? (
          <Image
            src={getProfilePictureUrl(ownerProfilePicture)!}
            alt={ownerDisplayName || "User"}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            onError={() => setProfilePicError(true)}
          />
        ) : (
          <HugeiconsIcon
            icon={User02Icon}
            size={20}
            className="text-muted-foreground"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">Uploaded by</p>
        <p className="truncate text-sm font-semibold text-foreground">
          {ownerDisplayName || "Anonymous"}
        </p>
      </div>
    </Link>
  );
}
