import { ConvexError } from "convex/values";

export type WorkspaceWriteAccess = {
  sessionId: string;
  canWrite: () => boolean;
  onLost: () => void;
};

export async function withWorkspaceAccess<T>(
  access: WorkspaceWriteAccess,
  write: () => Promise<T>
): Promise<T> {
  if (!access.canWrite())
    throw new Error("This canvas is inactive. Refresh to take over.");
  try {
    return await write();
  } catch (error) {
    if (
      error instanceof ConvexError &&
      typeof error.data === "object" &&
      error.data !== null &&
      "code" in error.data &&
      error.data.code === "WORKSPACE_SESSION_LOST"
    )
      access.onLost();
    throw error;
  }
}
