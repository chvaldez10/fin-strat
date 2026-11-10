import { LoadingState } from "@/components/patterns/loading-state";

export default function Loading() {
  return (
    <LoadingState label="Opening Money view…" className="min-h-40 flex-1" />
  );
}
