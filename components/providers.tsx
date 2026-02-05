"use client";

import { SessionProvider } from "next-auth/react";
import { LightboxProvider } from "@/components/lightbox-image/index";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LightboxProvider>{children}</LightboxProvider>
    </SessionProvider>
  );
}
