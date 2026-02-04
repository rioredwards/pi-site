"use client";

import { useSyncExternalStore } from "react";

type PointerType = "fine" | "coarse";

function getPointerType(): PointerType {
  if (typeof window === "undefined") return "fine";
  return window.matchMedia("(pointer: coarse)").matches ? "coarse" : "fine";
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(pointer: coarse)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function usePointerType(): PointerType {
  return useSyncExternalStore(subscribe, getPointerType, () => "fine");
}
