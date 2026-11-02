import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const id = await getAuthUserId(ctx);
  const user = id ? await ctx.db.get(id) : null;
  if (!user || !user.role)
    throw new ConvexError("Sign in with an invited account to continue.");
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin")
    throw new ConvexError("Administrator access is required.");
  return user;
}

export async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function normalizedEmail(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new ConvexError("Enter a valid email address.");
  return value.trim().toLowerCase();
}
