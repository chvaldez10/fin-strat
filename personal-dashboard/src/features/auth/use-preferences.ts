"use client";

import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { useUser } from "./use-user";

export type Preferences = FunctionReturnType<typeof api.preferences.get>;

export function usePreferences() {
  const user = useUser();
  return useQuery(api.preferences.get, user ? {} : "skip");
}
