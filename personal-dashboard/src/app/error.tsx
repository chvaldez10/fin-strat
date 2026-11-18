"use client";

import { ErrorState } from "@/components/patterns";

export default function Error({
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  return <ErrorState onAction={retry} />;
}
