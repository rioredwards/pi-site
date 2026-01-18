import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe for both client and server - always exists as a function
// In production, this becomes a no-op
export const devLog =
  process.env.NODE_ENV === "production"
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log(...args); // TODO: remove this
      }
    : (...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log(...args);
      };
