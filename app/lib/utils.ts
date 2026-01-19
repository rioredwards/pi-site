import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Profile picture URL builder - not a server action, just a utility
const PROFILE_PICTURE_READ_BASE_URL = "/api/assets/profiles/";

export function getProfilePictureUrl(filename: string | null): string | null {
  if (!filename) return null;
  return PROFILE_PICTURE_READ_BASE_URL + filename;
}

// Safe for both client and server - always exists as a function
// In production, this becomes a no-op
export const devLog =
  process.env.NODE_ENV === "production"
    ?  
      (..._args: unknown[]) => {}
    : (...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log(...args);
      };
