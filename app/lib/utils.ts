import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Profile picture URL builder - not a server action, just a utility
// Handles both local filenames and external OAuth URLs
const PROFILE_PICTURE_READ_BASE_URL = "/api/assets/profiles/";

export function getProfilePictureUrl(
  filenameOrUrl: string | null,
): string | null {
  if (!filenameOrUrl) return null;
  // If it's already a URL (OAuth profile picture), return as-is
  if (
    filenameOrUrl.startsWith("http://") ||
    filenameOrUrl.startsWith("https://")
  ) {
    return filenameOrUrl;
  }
  // Otherwise, build the local path for uploaded pictures
  return PROFILE_PICTURE_READ_BASE_URL + filenameOrUrl;
}

// Safe for both client and server - always exists as a function
// In production, this becomes a no-op
export const devLog =
  process.env.NODE_ENV === "production"
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (..._args: unknown[]) => {}
    : (...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log(...args);
      };

export function isMobile(): boolean {
  const isMobile =
    typeof window !== "undefined"
      ? window.matchMedia("(any-pointer:coarse)").matches
      : false;

  return isMobile;
}
