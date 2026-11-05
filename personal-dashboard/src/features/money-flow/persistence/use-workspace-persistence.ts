"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { MoneyFlowDocument, MoneyFlowAccountWorkspace } from "../types";
import { SaveQueue, type SaveState } from "./save-queue";
import { WorkspaceWriter } from "./workspace-writer";
import {
  withWorkspaceAccess,
  type WorkspaceWriteAccess,
} from "./workspace-write-access";
import type {
  MoneyFlowPlan,
  MoneyFlowAccountSummary,
  MoneyFlowWorkspaceSnapshot,
} from "./convex-types";

export type WorkspacePersistenceOptions = {
  root: MoneyFlowPlan;
  accounts: MoneyFlowAccountSummary[];
  server: MoneyFlowWorkspaceSnapshot;
};
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Owns the live draft and acknowledged writes, without routing or presentation. */
export function useWorkspacePersistence(
  { root, accounts, server }: WorkspacePersistenceOptions,
  access: WorkspaceWriteAccess
) {
  const save = useMutation(api.moneyFlow.saveWorkspace),
    saveView = useMutation(api.moneyFlow.saveView);
  const mounted = useRef(true);
  const { canWrite } = access;
  const guardedAccess = useCallback(
    () => mounted.current && canWrite(),
    [canWrite]
  );
  const writeAccess = { ...access, canWrite: guardedAccess };
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [writer] = useState(
    () => new WorkspaceWriter(root, accounts, save, access)
  );
  useLayoutEffect(() => {
    writer.configure(root, accounts, save, {
      sessionId: access.sessionId,
      canWrite: guardedAccess,
      onLost: access.onLost,
    });
  }, [
    writer,
    root,
    save,
    accounts,
    access.sessionId,
    access.onLost,
    guardedAccess,
  ]);
  const makeDocument = useCallback(
    (
      workspace: MoneyFlowWorkspaceSnapshot["workspace"]
    ): MoneyFlowDocument => ({
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
      new SaveQueue<MoneyFlowWorkspaceSnapshot["workspace"]>(
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
  const [viewSaving, setViewSaving] = useState(false);
  const [viewportPending, setViewportPending] = useState(false);
  const viewportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayed = useRef<MoneyFlowWorkspaceSnapshot["workspace"] | null>(null);
  const drainViewport = () => {
    if (viewportTimer.current) clearTimeout(viewportTimer.current);
    if (delayed.current) {
      queue.enqueue(delayed.current);
      delayed.current = null;
      setViewportPending(false);
    }
  };
  async function flushView(): Promise<boolean> {
    if (viewRunning.current) return viewRunning.current;
    if (!viewPending.current) return true;
    setViewSaving(true);
    async function saveNextView(): Promise<boolean> {
      if (viewPending.current) {
        const value = viewPending.current;
        try {
          await withWorkspaceAccess(writeAccess, () =>
            saveView({
              documentId: root._id,
              accountId: server.workspace.id,
              sessionId: access.sessionId,
              view: value,
            })
          );
          if (viewPending.current === value) viewPending.current = null;
          setViewError(false);
        } catch {
          setViewError(true);
          return false;
        }
        // Keep view writes ordered while coalescing edits made during a save.
        return saveNextView();
      }
      return true;
    }
    viewRunning.current = saveNextView().finally(() => {
      viewRunning.current = null;
      setViewSaving(false);
    });
    return viewRunning.current;
  }
  const lastView = useRef(JSON.stringify(initial.view));
  function change(document: MoneyFlowDocument) {
    const workspace = clean(
      document.accounts[0]
    ) as MoneyFlowWorkspaceSnapshot["workspace"];
    const fingerprint = JSON.stringify(workspace);
    if (fingerprint !== lastGraph.current) {
      const previous = JSON.parse(
        lastGraph.current
      ) as MoneyFlowWorkspaceSnapshot["workspace"];
      lastGraph.current = fingerprint;
      const viewportOnly =
        JSON.stringify({ ...workspace, viewport: previous.viewport }) ===
        JSON.stringify(previous);
      if (viewportOnly) {
        setViewportPending(true);
        delayed.current = workspace;
        if (viewportTimer.current) clearTimeout(viewportTimer.current);
        viewportTimer.current = setTimeout(drainViewport, 300);
      } else {
        setViewportPending(false);
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
  async function saveAccountSelection(id: string) {
    drainViewport();
    if (!(await queue.flush()) || !(await flushView())) return false;
    setViewSaving(true);
    try {
      await withWorkspaceAccess(writeAccess, () =>
        saveView({
          documentId: root._id,
          accountId: server.workspace.id,
          sessionId: access.sessionId,
          view: { ...JSON.parse(lastView.current), selectedAccountId: id },
        })
      );
      return true;
    } catch {
      setViewError(true);
      return false;
    } finally {
      setViewSaving(false);
    }
  }
  function reloadServerVersion() {
    const remote = state.remote ?? server;
    queue.discard();
    queue.acceptRemote(remote.revision);
    const document = makeDocument(remote.workspace);
    setInitial(document);
    lastGraph.current = JSON.stringify(remote.workspace);
    lastView.current = JSON.stringify(document.view);
    setEpoch((value) => value + 1);
  }
  const saveStatus: SaveState<
    MoneyFlowWorkspaceSnapshot["workspace"]
  >["status"] =
    state.status === "conflict"
      ? "conflict"
      : state.status === "failed" || viewError
        ? "failed"
        : state.status === "saving" ||
            state.pending ||
            viewSaving ||
            viewportPending
          ? "saving"
          : "saved";

  async function flush() {
    drainViewport();
    return (await queue.flush()) && (await flushView());
  }
  async function saveNow() {
    drainViewport();
    const saved =
      queue.getSnapshot().status === "failed"
        ? await queue.retry()
        : await queue.flush();
    return saved && (await flushView());
  }
  return {
    document: initial,
    editorVersion: epoch,
    status: saveStatus,
    workspaceStatus: state.status,
    viewError,
    change,
    flush,
    saveNow,
    saveAccountSelection,
    reloadServerVersion,
    retrySave: () => queue.retry(),
    retryView: flushView,
    keepLocal: () => queue.keepLocal(),
  };
}
