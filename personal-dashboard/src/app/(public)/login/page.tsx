import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<output>Loading sign in…</output>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
