export type SaveResult<T> =
  | { status: "saved"; revision: number; workspace: T }
  | { status: "conflict"; current: { revision: number; workspace: T } };
export type SaveState<T> = {
  status: "saved" | "saving" | "failed" | "conflict";
  revision: number;
  pending: T | null;
  remote: { revision: number; workspace: T } | null;
};

/** One writer per mounted workspace. Later edits replace pending snapshots, never an in-flight request. */
export class SaveQueue<T> {
  private state: SaveState<T>;
  private listeners = new Set<() => void>();
  private running: Promise<boolean> | null = null;
  private sequence = 0;
  constructor(
    revision: number,
    private write: (value: T, revision: number) => Promise<SaveResult<T>>
  ) {
    this.state = { status: "saved", revision, pending: null, remote: null };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<SaveState<T>>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  enqueue(value: T) {
    this.sequence++;
    this.update({ pending: value });
    if (this.state.status !== "conflict" && this.state.status !== "failed")
      void this.flush();
  }
  flush(): Promise<boolean> {
    if (this.running) return this.running;
    if (this.state.status === "conflict" || this.state.status === "failed")
      return Promise.resolve(false);
    this.running = this.drain().finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async drain(): Promise<boolean> {
    while (this.state.pending !== null) {
      const value = this.state.pending,
        sequence = this.sequence;
      this.update({ status: "saving" });
      try {
        const result = await this.write(value, this.state.revision);
        if (result.status === "conflict") {
          this.update({ status: "conflict", remote: result.current });
          return false;
        }
        this.update({
          revision: result.revision,
          pending: sequence === this.sequence ? null : this.state.pending,
        });
      } catch {
        this.update({ status: "failed" });
        return false;
      }
    }
    this.update({ status: "saved" });
    return true;
  }
  retry() {
    if (this.state.status !== "conflict") {
      this.update({ status: "saved" });
      return this.flush();
    }
    return Promise.resolve(false);
  }
  keepLocal() {
    if (!this.state.remote) return Promise.resolve(false);
    this.update({
      revision: this.state.remote.revision,
      status: "saved",
      remote: null,
    });
    return this.flush();
  }
  discard() {
    this.sequence++;
    this.update({
      pending: null,
      status: "saved",
      revision: this.state.remote?.revision ?? this.state.revision,
      remote: null,
    });
  }
  acceptRemote(revision: number) {
    if (!this.state.pending && !this.running) this.update({ revision });
  }
}
