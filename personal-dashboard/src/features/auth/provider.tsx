"use client";
import { useState, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [client] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url)
      throw new Error(
        "Configure NEXT_PUBLIC_CONVEX_URL before starting the dashboard."
      );
    return new ConvexReactClient(url);
  });
  return (
    <ConvexAuthNextjsProvider client={client}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
