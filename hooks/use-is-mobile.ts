import { useSyncExternalStore } from "react";

function getIsMobile() {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function subscribe() {
  // Mobile status doesn't change, so no subscription needed
  return () => {};
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    getIsMobile,
    () => false, // Server snapshot
  );
}
