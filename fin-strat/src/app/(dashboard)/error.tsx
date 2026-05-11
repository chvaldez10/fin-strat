"use client";

import { ErrorState } from "@/components/patterns";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState onAction={reset} />;
}
