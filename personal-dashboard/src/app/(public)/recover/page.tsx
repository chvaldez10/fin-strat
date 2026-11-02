import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
export default function RecoverPage() {
  return (
    <Suspense fallback={<output>Loading recovery…</output>}>
      <AuthForm mode="recover" />
    </Suspense>
  );
}
