"use client";

import { ErrorContent } from "@/components/error-content";
import { useEffect } from "react";
import { devLog } from "./lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    devLog("Application error:", error);
  }, [error]);

  return <ErrorContent error={error} reset={reset} />;
}
