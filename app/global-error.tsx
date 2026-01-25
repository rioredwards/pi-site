"use client";

import { ErrorContent } from "@/components/error-content";
import { useEffect } from "react";
import { devLog } from "./lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    devLog("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <ErrorContent error={error} reset={reset} />
      </body>
    </html>
  );
}
