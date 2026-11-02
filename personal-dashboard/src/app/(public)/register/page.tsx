import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
export default function RegisterPage() {
  return (
    <Suspense fallback={<output>Loading invitation…</output>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
