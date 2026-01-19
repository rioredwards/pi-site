import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
