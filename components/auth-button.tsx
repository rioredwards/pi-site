"use client";

import { getUserProfile } from "@/app/db/actions";
import { User as UserType } from "@/app/lib/types";
import { cn, getProfilePictureUrl } from "@/app/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Login01Icon, Logout01Icon, Moon02Icon, Sun01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, VariantProps } from "class-variance-authority";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { SignInModal } from "./ui/signInModal";

const iconSizeVariants = cva("transition-colors duration-200", {
  variants: {
    size: {
      sm: "h-6 w-6",
      lg: "h-8 w-8",
    },
    defaultVariants: {
      size: "lg",
    },
  },
});


export function AuthButton({ className, children, isActive, iconVariant = { size: "lg" }, hideSubMenuArrow }: { className?: string, children?: React.ReactNode, isActive?: boolean, iconVariant?: VariantProps<typeof iconSizeVariants>, hideSubMenuArrow?: boolean }) {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
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

  // if (status === "loading") {
  //   return (
  //     <Button variant="ghost" size="sm" disabled>
  //       <BounceLoader color={"oklch(0.75 0.15 55)"} loading={true} size={25} />
  //     </Button>
  //   );
  // }

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
          <button className={cn("outline-none ring-0 flex flex-col cursor-pointer items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none", className)}>
            <div className={cn(
              "flex w-full flex-col h-full group items-center justify-center gap-1 p-2 rounded-xl transition-colors duration-200",
              "group-hover:bg-primary/20"
            )}>
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={displayName || "User"}
                  className={cn(
                    "h-8 w-8 rounded-full object-cover",
                    iconSizeVariants(iconVariant)
                  )}
                />
              ) : (
                <HugeiconsIcon icon={UserIcon} className={cn(
                  iconSizeVariants(iconVariant),
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground group-hover:text-primary"
                )} />
              )}
              {children && children}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="font-medium">{displayName}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={profileUrl} className="cursor-pointer">
              <HugeiconsIcon icon={UserIcon} className={cn(iconSizeVariants(iconVariant), "mr-2")} />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer" hideArrow={hideSubMenuArrow}>
              <span className="dark:hidden">
                <HugeiconsIcon icon={Sun01Icon} size={20} className="mr-2" />
              </span>
              <span className="hidden dark:inline">
                <HugeiconsIcon icon={Moon02Icon} size={20} className="mr-2" />
              </span>
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            variant="destructive"
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
          <button className={cn("outline-none ring-0 flex flex-col cursor-pointer items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none", className)}>
            <div className={cn(
              "flex flex-col h-full group items-center justify-center gap-1 p-2 rounded-xl transition-colors duration-200",
              "group-hover:bg-primary/20"
            )}>
              {status === "loading" && <BounceLoader color={"oklch(0.75 0.15 55)"} loading={true} size={25} />}
              {status !== "loading" && (
                <>
                  <HugeiconsIcon icon={UserIcon} className={cn(
                    iconSizeVariants(iconVariant),
                    "h-6 w-6 transition-colors duration-200",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground group-hover:text-primary"
                  )} />
                  {children && children}
                </>)}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => setShowSignInModal(true)}
            className="cursor-pointer"
          >
            <HugeiconsIcon icon={Login01Icon} className={cn(iconSizeVariants(iconVariant), "mr-2")} />
            Sign In
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer" hideArrow={hideSubMenuArrow}>
              <span className="dark:hidden">
                <HugeiconsIcon icon={Sun01Icon} size={20} className="mr-2" />
              </span>
              <span className="hidden dark:inline">
                <HugeiconsIcon icon={Moon02Icon} size={20} className="mr-2" />
              </span>
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignInModal
        showSignInModal={showSignInModal}
        setShowSignInModal={setShowSignInModal}
      />
    </>
  );
}
