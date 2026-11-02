"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { useUser } from "./use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Profile() {
  const user = useUser();
  const update = useMutation(api.users.updateProfile);
  const createInvitation = useMutation(api.invitations.create);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      await update({ name: String(data.get("name")) });
      setMessage("Profile saved.");
    } catch {
      setMessage("Profile could not be saved. Your changes are still here.");
    } finally {
      setPending(false);
    }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    setLink("");
    try {
      const kind = data.get("kind") === "recovery" ? "recovery" : "invite";
      const result = await createInvitation({
        email: String(data.get("email")),
        kind,
        role: "member",
      });
      const url = new URL(
        kind === "invite" ? "/register" : "/recover",
        window.location.origin
      );
      url.searchParams.set(
        kind === "invite" ? "invite" : "token",
        result.token
      );
      url.searchParams.set("email", result.email);
      setLink(url.toString());
      setMessage(
        kind === "invite"
          ? "Invitation created. It expires in 7 days. Deliver the link privately."
          : "Recovery link created. It expires in 1 hour. Deliver it privately to the account owner."
      );
    } catch {
      setMessage("Could not create this link. Check the email and connection.");
    } finally {
      setPending(false);
    }
  }
  if (!user) return <output>Loading your profile…</output>;
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-bold">Your profile</h1>
      <p>{user.email}</p>
      <form onSubmit={save} className="space-y-4">
        <label className="block" htmlFor="profile-name">
          Name
          <Input
            id="profile-name"
            name="name"
            defaultValue={user.name}
            required
            maxLength={80}
          />
        </label>
        <Button type="submit" disabled={pending}>
          Save profile
        </Button>
      </form>
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await signOut();
            router.replace("/login");
            router.refresh();
          } catch {
            setMessage("Sign-out failed. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        Sign out
      </Button>
      {user.role === "admin" && (
        <section className="space-y-4 rounded-xl border p-5">
          <h2 className="text-xl font-semibold">Manage access</h2>
          <form onSubmit={invite} className="space-y-4">
            <label className="block" htmlFor="profile-email">
              Recipient email
              <Input id="profile-email" name="email" type="email" required />
            </label>
            <label className="block">
              Link type
              <select
                name="kind"
                className="ml-3 rounded border bg-background p-2"
              >
                <option value="invite">Member invitation</option>
                <option value="recovery">Password recovery</option>
              </select>
            </label>
            <Button type="submit" disabled={pending}>
              Create private link
            </Button>
          </form>
          {link && (
            <label htmlFor="private-link" className="block break-all text-sm">
              Private link
              <Input
                id="private-link"
                aria-label="Private access link"
                readOnly
                value={link}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
          )}
        </section>
      )}
      <output>{message}</output>
    </div>
  );
}
