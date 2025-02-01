"use client";
import { lazy, Suspense } from "react";

export const PhotoUpload = lazy(() => import("@/components/photo-upload"));

export default function UploadPage() {
  return (
    <div className="container px-4 py-8 mx-auto min-h-96">
      <Suspense>{typeof window !== "undefined" && <PhotoUpload />}</Suspense>
    </div>
  );
}
