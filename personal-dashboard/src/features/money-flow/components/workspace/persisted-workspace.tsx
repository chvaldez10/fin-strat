"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { useUser } from "@/features/auth/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseMoneyCents } from "../../amounts";
import { SaveQueue } from "../../persistence/save-queue";
import type { MoneyFlowDocument, MoneyFlowAccountWorkspace } from "../../types";
import { MoneyFlowWorkspace } from "./money-flow-workspace";
import { LocalImport } from "./local-import";

type Root = NonNullable<FunctionReturnType<typeof api.moneyFlow.getCurrent>>;
type Account = FunctionReturnType<
  typeof api.moneyFlow.listAccounts
>["page"][number];
type Workspace = FunctionReturnType<typeof api.moneyFlow.getWorkspace>;
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

class WorkspaceWriter {
  private revisions: Record<string, number> = {};
  constructor(
    private root: Root,
    accounts: Account[],
    private save: (
      args: FunctionArgs<typeof api.moneyFlow.saveWorkspace>
    ) => Promise<FunctionReturnType<typeof api.moneyFlow.saveWorkspace>>
  ) {
    this.configure(root, accounts, save);
  }
  configure(root: Root, accounts: Account[], save: WorkspaceWriter["save"]) {
    this.root = root;
    this.save = save;
    for (const account of accounts)
      this.revisions[account.id] = Math.max(
        this.revisions[account.id] ?? 0,
        account.revision
      );
  }
  async write(workspace: Workspace["workspace"], revision: number) {
    const result = await this.save({
      documentId: this.root._id,
      accountId: workspace.id,
      expectedRevision: revision,
      counterpartRevisions: this.revisions,
      workspace: clean(workspace),
    });
    if (result.status === "saved")
      Object.assign(this.revisions, result.counterpartRevisions);
    return result;
  }
}

export function PersistedWorkspace() {
  const user = useUser();
  const root = useQuery(api.moneyFlow.getCurrent, user ? {} : "skip");
  if (!user || root === undefined)
    return <output className="p-6">Loading your private plan…</output>;
  return <LoadedPlan key={root?._id ?? user.id} root={root} userId={user.id} />;
}

function LoadedPlan({ root, userId }: { root: Root | null; userId: string }) {
  const {
    results: accounts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.moneyFlow.listAccounts,
    root ? { documentId: root._id } : "skip",
    { initialNumItems: 25 }
  );
  const [selected, setSelected] = useState<string | null>(
    () => root?.view.selectedAccountId ?? null
  );
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const accountId = selected ?? root?.view.selectedAccountId;
  const workspace = useQuery(
    api.moneyFlow.getWorkspace,
    root && accountId ? { documentId: root._id, accountId } : "skip"
  );
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 border-b p-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAdding((value) => !value)}
        >
          {adding ? "Close account form" : "Add account"}
        </Button>
        <LocalImport
          disabled={busy}
          root={root}
          accounts={accounts}
          userId={userId}
          onImported={() => {
            setSelected(null);
          }}
        />
        {status === "CanLoadMore" && (
          <Button onClick={() => loadMore(25)}>Load more accounts</Button>
        )}
      </div>
      {(adding || !root) && (
        <CreateAccount
          onCreated={(id) => {
            if (!root) setSelected(id);
            setAdding(false);
          }}
        />
      )}
      {root &&
        (workspace && accountId ? (
          <WorkspaceSession
            key={accountId}
            root={root}
            accounts={accounts}
            server={workspace}
            onSwitch={setSelected}
            onBusy={setBusy}
          />
        ) : (
          <output className="p-6">Loading account…</output>
        ))}
    </div>
  );
}

function CreateAccount({ onCreated }: { onCreated: (id: string) => void }) {
  const create = useMutation(api.moneyFlow.createAccount);
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [startMonth] = useState(() => new Date().toISOString().slice(0, 7));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const balance = parseMoneyCents(String(data.get("balance")), {
      allowNegative: true,
    });
    if (balance === null) {
      setError("Enter a valid balance with at most two decimal places.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await create({
        name: String(data.get("name")),
        institution: String(data.get("institution")),
        accountType: data.get("type") === "savings" ? "savings" : "chequing",
        openingBalanceCents: balance,
        startMonth: String(data.get("month")),
      });
      onCreated(result.accountId);
    } catch {
      setError(
        "Account could not be created. Check your details and connection, then retry."
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="m-4 max-w-lg space-y-4 rounded-xl border p-5"
      onSubmit={submit}
      aria-busy={pending}
    >
      <h2 className="text-xl font-semibold">Create an account workspace</h2>
      <p className="text-sm text-muted-foreground">
        Start with your own opening balance. No sample transactions will be
        added.
      </p>
      <label className="block" htmlFor="persisted-workspace-name">
        Account name
        <Input
          id="persisted-workspace-name"
          name="name"
          required
          maxLength={120}
        />
      </label>
      <label className="block" htmlFor="persisted-workspace-institution">
        Institution
        <Input
          id="persisted-workspace-institution"
          name="institution"
          required
          maxLength={120}
        />
      </label>
      <label className="block">
        Type
        <select name="type" className="ml-3 rounded border bg-background p-2">
          <option value="chequing">Chequing</option>
          <option value="savings">Savings</option>
        </select>
      </label>
      <label className="block" htmlFor="persisted-workspace-balance">
        Opening balance (CAD)
        <Input
          id="persisted-workspace-balance"
          name="balance"
          inputMode="decimal"
          required
          defaultValue="0.00"
        />
      </label>
      <label className="block" htmlFor="persisted-workspace-month">
        Plan start month
        <Input
          id="persisted-workspace-month"
          name="month"
          type="month"
          required
          defaultValue={startMonth}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <Button disabled={pending}>
        {pending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}

function WorkspaceSession({
  root,
  accounts,
  server,
  onSwitch,
  onBusy,
}: {
  root: Root;
  accounts: Account[];
  server: Workspace;
  onSwitch: (id: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const save = useMutation(api.moneyFlow.saveWorkspace),
    saveView = useMutation(api.moneyFlow.saveView);
  const [writer] = useState(() => new WorkspaceWriter(root, accounts, save));
  useLayoutEffect(() => {
    writer.configure(root, accounts, save);
  }, [writer, root, save, accounts]);
  const makeDocument = useCallback(
    (workspace: Workspace["workspace"]): MoneyFlowDocument => ({
      version: 4,
      id: root.domainId,
      userId: root.ownerId,
      currency: "CAD",
      scenario: root.scenario as MoneyFlowDocument["scenario"],
      view: {
        ...root.view,
        selectedAccountId: workspace.id,
      } as MoneyFlowDocument["view"],
      accounts: [workspace as MoneyFlowAccountWorkspace],
    }),
    [root]
  );
  const [initial, setInitial] = useState(() => makeDocument(server.workspace));
  const [epoch, setEpoch] = useState(0);
  const [queue] = useState(
    () =>
      new SaveQueue<Workspace["workspace"]>(
        server.revision,
        (workspace, revision) => writer.write(workspace, revision)
      )
  );
  const state = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );
  const lastGraph = useRef(JSON.stringify(server.workspace));
  const viewPending = useRef<MoneyFlowDocument["view"] | null>(null);
  const viewRunning = useRef<Promise<boolean> | null>(null);
  const [viewError, setViewError] = useState(false);
  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayed = useRef<Workspace["workspace"] | null>(null);
  const drainViewport = () => {
    if (viewportTimer.current) clearTimeout(viewportTimer.current);
    if (delayed.current) {
      queue.enqueue(delayed.current);
      delayed.current = null;
    }
  };
  async function flushView(): Promise<boolean> {
    if (viewRunning.current) return viewRunning.current;
    viewRunning.current = (async () => {
      while (viewPending.current) {
        const value = viewPending.current;
        try {
          await saveView({ documentId: root._id, view: value });
          if (viewPending.current === value) viewPending.current = null;
          setViewError(false);
        } catch {
          setViewError(true);
          return false;
        }
      }
      return true;
    })().finally(() => {
      viewRunning.current = null;
    });
    return viewRunning.current;
  }
  const lastView = useRef(JSON.stringify(initial.view));
  function change(document: MoneyFlowDocument) {
    const workspace = clean(document.accounts[0]) as Workspace["workspace"];
    const fingerprint = JSON.stringify(workspace);
    if (fingerprint !== lastGraph.current) {
      onBusy(true);
      const previous = JSON.parse(lastGraph.current) as Workspace["workspace"];
      lastGraph.current = fingerprint;
      const viewportOnly =
        JSON.stringify({ ...workspace, viewport: previous.viewport }) ===
        JSON.stringify(previous);
      if (viewportOnly) {
        delayed.current = workspace;
        if (viewportTimer.current) clearTimeout(viewportTimer.current);
        viewportTimer.current = setTimeout(drainViewport, 300);
      } else {
        delayed.current = null;
        if (viewportTimer.current) clearTimeout(viewportTimer.current);
        queue.enqueue(workspace);
      }
    }
    if (JSON.stringify(document.view) !== lastView.current) {
      lastView.current = JSON.stringify(document.view);
      viewPending.current = document.view;
      void flushView();
    }
  }
  useEffect(() => {
    onBusy(
      state.status !== "saved" ||
        !!state.pending ||
        !!delayed.current ||
        !!viewPending.current
    );
  }, [state, viewError, onBusy]);
  useEffect(() => {
    // An acknowledgement can arrive through the subscription before its promise.
    // Wait for the writer to settle before considering a clean remote refresh.
    if (
      state.status !== "saved" ||
      state.pending ||
      delayed.current ||
      server.revision <= state.revision
    )
      return;
    queue.discard();
    setInitial(makeDocument(server.workspace));
    lastGraph.current = JSON.stringify(server.workspace);
    setEpoch((value) => value + 1);
    // Advance the writer without sending the remote snapshot back to the server.
    queue.acceptRemote(server.revision);
  }, [
    server.revision,
    server.workspace,
    state.status,
    state.revision,
    state.pending,
    queue,
    makeDocument,
  ]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        queue.getSnapshot().pending ||
        delayed.current ||
        viewPending.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (viewportTimer.current) clearTimeout(viewportTimer.current);
      if (delayed.current) queue.enqueue(delayed.current);
    };
  }, [queue]);
  async function switchAccount(id: string) {
    drainViewport();
    if (!(await queue.flush()) || !(await flushView())) return;
    try {
      await saveView({
        documentId: root._id,
        view: { ...JSON.parse(lastView.current), selectedAccountId: id },
      });
      onSwitch(id);
    } catch {
      setViewError(true);
    }
  }
  function reloadRemote() {
    if (
      !window.confirm(
        "Discard your unsaved edits and load the saved server version?"
      )
    )
      return;
    const remote = state.remote ?? server;
    queue.discard();
    queue.acceptRemote(remote.revision);
    const document = makeDocument(remote.workspace);
    setInitial(document);
    lastGraph.current = JSON.stringify(remote.workspace);
    lastView.current = JSON.stringify(document.view);
    setEpoch((value) => value + 1);
  }
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-3 border-b px-4 py-2 text-sm"
        aria-live="polite"
        data-testid="save-status"
      >
        <span>
          {state.status === "saved"
            ? "All changes saved"
            : state.status === "saving"
              ? "Saving…"
              : state.status === "failed"
                ? "Save failed. Your edits remain on this screen."
                : "This account changed elsewhere. Your edits are preserved."}
        </span>
        {state.status === "failed" && (
          <Button
            size="sm"
            onClick={() => {
              void queue.retry();
            }}
          >
            Retry save
          </Button>
        )}
        {state.status === "conflict" && (
          <>
            <Button size="sm" variant="outline" onClick={reloadRemote}>
              Load server version
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void queue.keepLocal();
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
                void flushView();
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
        onAccountChange={(id) => {
          void switchAccount(id);
        }}
      />
    </>
  );
}
