"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveStatus } from "@/components/patterns/save-status";
import {
  useWorkspacePersistence,
  type WorkspacePersistenceOptions,
} from "../../persistence/use-workspace-persistence";
import { MoneyFlowWorkspace } from "./money-flow-workspace";

type WorkspaceSessionProps = WorkspacePersistenceOptions & {
  onSwitch: (accountId: string) => void;
  onBack: () => void;
};

export function WorkspaceSession({
  root,
  accounts,
  server,
  onSwitch,
  onBack,
}: WorkspaceSessionProps) {
  const {
    document: initial,
    editorVersion: epoch,
    status: saveStatus,
    workspaceStatus,
    viewError,
    change,
    flush,
    saveNow,
    saveAccountSelection,
    reloadServerVersion,
    retrySave,
    retryView,
    keepLocal,
  } = useWorkspacePersistence({ root, accounts, server });
  const [leaving, setLeaving] = useState(false);
  async function switchAccount(id: string) {
    if (await saveAccountSelection(id)) onSwitch(id);
  }
  async function backToAccounts() {
    if (leaving) return;
    setLeaving(true);
    try {
      if (await flush()) onBack();
    } finally {
      setLeaving(false);
    }
  }
  function reloadRemote() {
    if (
      window.confirm(
        "Discard your unsaved edits and load the saved server version?"
      )
    )
      reloadServerVersion();
  }
  return (
    <>
      <div
        className="flex min-h-10 shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 text-xs"
        data-testid="save-status"
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={leaving}
          onClick={() => {
            void backToAccounts();
          }}
        >
          <ArrowLeft aria-hidden="true" />
          Bank accounts
        </Button>
        <SaveStatus
          status={saveStatus}
          className={
            saveStatus === "saved" || saveStatus === "saving"
              ? "ml-auto"
              : undefined
          }
        />
        {workspaceStatus === "failed" && (
          <span role="alert">
            Your edits are still here. Retry saving before leaving.
          </span>
        )}
        {workspaceStatus === "conflict" && (
          <span role="alert">
            This account changed elsewhere. Your edits are preserved.
          </span>
        )}
        {workspaceStatus === "failed" && (
          <Button
            size="sm"
            onClick={() => {
              void retrySave();
            }}
          >
            Retry save
          </Button>
        )}
        {workspaceStatus === "conflict" && (
          <>
            <Button size="sm" variant="outline" onClick={reloadRemote}>
              Load server version
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void keepLocal();
              }}
            >
              Save my version instead
            </Button>
          </>
        )}
        {viewError && (
          <>
            <span role="alert">View preferences could not be saved.</span>
            <Button
              size="sm"
              onClick={() => {
                void retryView();
              }}
            >
              Retry view save
            </Button>
          </>
        )}
      </div>
      <MoneyFlowWorkspace
        key={epoch}
        initialDocument={initial}
        accountSummaries={accounts}
        onChange={change}
        onSave={saveNow}
        onAccountChange={(id) => {
          void switchAccount(id);
        }}
      />
    </>
  );
}
