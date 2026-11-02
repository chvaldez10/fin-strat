"use client";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
export function useUser() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  return user
    ? {
        ...user,
        initials: user.name
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
      }
    : null;
}
