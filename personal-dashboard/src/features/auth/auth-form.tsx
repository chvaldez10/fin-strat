"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({
  mode,
}: Readonly<{ mode: "login" | "register" | "recover" }>) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
        ? "Accept your invitation"
        : "Recover your account";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    if (mode !== "login" && data.get("password") !== data.get("confirm")) {
      setError("Passwords must match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      data.delete("confirm");
      if (mode === "recover")
        data.set("token", String(data.get("invitationCode")));
      else data.set("flow", mode === "register" ? "signUp" : "signIn");
      await signIn(mode === "recover" ? "recovery" : "password", data);
      const next = search.get("next");
      router.replace(
        next?.startsWith("/dashboard") || next?.startsWith("/user/")
          ? next
          : "/dashboard"
      );
      router.refresh();
    } catch {
      setError(
        mode === "login"
          ? "Sign-in failed. Check your email and password, or try again when connected."
          : "Unable to continue. Check your details and invitation or recovery code. Ask an administrator for a new link if it expired."
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mx-auto my-16 w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="my-4 text-sm text-muted-foreground">
        {mode === "login"
          ? "Your private workspace is waiting."
          : "Accounts are invitation-only. Your administrator supplies a one-time link."}
      </p>
      <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
        {mode === "register" && (
          <label className="block" htmlFor="auth-form-name">
            Name
            <Input
              id="auth-form-name"
              name="name"
              autoComplete="name"
              required
              maxLength={80}
            />
          </label>
        )}
        <label className="block" htmlFor="auth-form-email">
          Email
          <Input
            id="auth-form-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={search.get("email") ?? ""}
            required
            maxLength={254}
          />
        </label>
        {mode !== "login" && (
          <label className="block" htmlFor="auth-form-invitationCode">
            {mode === "register" ? "Invitation code" : "Recovery code"}
            <Input
              id="auth-form-invitationCode"
              name="invitationCode"
              defaultValue={search.get("invite") ?? search.get("token") ?? ""}
              required
              minLength={32}
              maxLength={256}
              autoComplete="off"
            />
          </label>
        )}
        <label className="block" htmlFor="auth-form-password">
          {mode === "recover" ? "New password" : "Password"}
          <Input
            id="auth-form-password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={12}
            maxLength={128}
          />
        </label>
        {mode !== "login" && (
          <label className="block" htmlFor="auth-form-confirm">
            Confirm password
            <Input
              id="auth-form-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={pending} type="submit">
          {pending
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : "Set password"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Need access or a password reset? Ask your administrator for an
            invitation or recovery link.
          </>
        ) : (
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        )}
      </p>
    </section>
  );
}
