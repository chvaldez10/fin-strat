"use client";
import type { WorkspacePersistenceOptions } from "../../persistence/use-workspace-persistence";
import { useWorkspaceLease } from "../../persistence/use-workspace-lease";
import { MoneyFlowLoading } from "./money-flow-loading";
import { WorkspaceEditor } from "./workspace-editor";
import { WorkspaceSessionBlocked } from "./workspace-session-blocked";

type WorkspaceSessionProps = WorkspacePersistenceOptions & {
  onSwitch: (accountId: string) => void;
  onBack: () => void;
};

export function WorkspaceSession(props: WorkspaceSessionProps) {
  const lease = useWorkspaceLease(props.root, props.server.workspace.id);
  const { grant, sessionId } = lease;
  const active = lease.status === "active";
  if (lease.status === "checking") return <MoneyFlowLoading />;
  // Keep the editor mounted after displacement so any pending draft stays in
  // memory. Inert removes all pointer, keyboard and accessibility interaction.
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {grant && sessionId && (
        <div
          className={active ? "flex min-h-0 flex-1 flex-col" : "hidden"}
          inert={!active}
          aria-hidden={!active || undefined}
        >
          <WorkspaceEditor
            {...props}
            server={
              props.server.revision >= grant.snapshot.revision
                ? props.server
                : grant.snapshot
            }
            access={{
              sessionId,
              canWrite: lease.canWrite,
              onLost: lease.onLost,
            }}
          />
        </div>
      )}
      {!active && (
        <WorkspaceSessionBlocked status={lease.status} onBack={props.onBack} />
      )}
    </div>
  );
}
