"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { decodeStoredMoneyFlowDocument } from "../../persistence/document-codec";
import type { MoneyFlowDocument } from "../../types";

type Backup = { key: string; raw: string; document: MoneyFlowDocument | null };
export function LocalImport({
  root,
  accounts,
  userId,
  onImported,
  disabled,
}: {
  root: FunctionReturnType<typeof api.moneyFlow.getCurrent>;
  accounts: FunctionReturnType<typeof api.moneyFlow.listAccounts>["page"];
  userId: string;
  onImported: () => void;
  disabled: boolean;
}) {
  const importLocal = useMutation(api.moneyFlow.importLocal);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  function inspect() {
    try {
      const keys = [
        ...new Set([
          `personal-dashboard:money-flow:${userId}`,
          "personal-dashboard:money-flow:user_chris_demo",
          "personal-dashboard:money-flow",
        ]),
      ];
      const found: Backup[] = [];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        let document: MoneyFlowDocument | null = null;
        try {
          const value: unknown = JSON.parse(raw);
          const owner =
            value &&
            typeof value === "object" &&
            "userId" in value &&
            typeof value.userId === "string"
              ? value.userId
              : "user_chris_demo";
          document = decodeStoredMoneyFlowDocument(value, owner);
        } catch {
          /* Keep the unreadable original available for download. */
        }
        found.push({ key, raw, document });
      }
      setBackups(found);
      setMessage(
        found.length
          ? "Save open edits before importing. Import only data you own. The old demo identity is not proof of ownership. Original browser records will remain untouched."
          : "No supported local Money Flow backup was found in this browser."
      );
    } catch {
      setMessage("Browser storage is unavailable. No backup was changed.");
    }
  }
  async function importBackup(backup: Backup) {
    if (!backup.document || pending || disabled) return;
    if (
      !window.confirm(
        root
          ? "Replace your entire server plan with this browser backup? This includes all accounts. Confirm this backup belongs to you. Save any open edits first."
          : "Import this browser backup into your account? Confirm that it belongs to you."
      )
    )
      return;
    setPending(true);
    try {
      const result = await importLocal({
        document: backup.document,
        replaceExisting: !!root,
        expectedRevision: root?.revision,
        accountRevisions: Object.fromEntries(
          accounts.map((account) => [account.id, account.revision])
        ),
      });
      setMessage(
        result.alreadyImported
          ? "This backup was already imported. No duplicate was created."
          : "Import committed. Your original browser backup is intact."
      );
      onImported();
      // A committed replacement changes the complete plan, so load the server's selected workspace.
      if (!result.alreadyImported) window.location.reload();
    } catch {
      setMessage(
        "Import failed or the server plan changed. Your browser backup and current server data are intact. Reload and retry after saving open edits."
      );
    } finally {
      setPending(false);
    }
  }
  function download(backup: Backup) {
    const url = URL.createObjectURL(
      new Blob([backup.raw], { type: "application/json" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "money-flow-browser-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <details className="max-w-full text-sm">
      <summary className="cursor-pointer">Recover browser data</summary>
      <div className="space-y-3 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={inspect}
          disabled={pending}
        >
          Look for local backups
        </Button>
        <output className="max-w-lg">{message}</output>
        {backups.map((backup) => (
          <div
            key={backup.key}
            className="flex max-w-lg flex-wrap items-center gap-2 rounded border p-3"
          >
            <p className="w-full break-all">
              {backup.key}
              {!backup.document && " — unreadable; download for recovery"}
            </p>
            <Button
              size="sm"
              disabled={pending || disabled || !backup.document}
              onClick={() => {
                void importBackup(backup);
              }}
            >
              {root ? "Replace server plan" : "Import my backup"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => download(backup)}
            >
              Download backup
            </Button>
          </div>
        ))}
      </div>
    </details>
  );
}
