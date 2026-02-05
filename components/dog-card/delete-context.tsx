"use client";

import { createContext, useContext } from "react";

interface DeleteContextValue {
  onDeleteClick: (id: string) => void;
}

export const DeleteContext = createContext<DeleteContextValue | null>(null);

export function useDeleteContext() {
  return useContext(DeleteContext);
}
