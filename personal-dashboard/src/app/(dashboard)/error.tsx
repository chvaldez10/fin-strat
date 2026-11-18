"use client";

import { ErrorState } from "@/components/patterns";

export default function Error({
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  return <ErrorState className="min-h-0 flex-1 py-12" onAction={retry} />;
}
