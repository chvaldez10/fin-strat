import { LoadingState } from "@/components/patterns";

export default function Loading() {
  return (
    <LoadingState
      variant="dashboard"
      className="min-h-0 flex-1 items-start justify-start px-0"
    />
  );
}
