import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SaveQueue,
  type SaveResult,
} from "../src/features/money-flow/persistence/save-queue.js";

test("rapid saves serialize and coalesce using the acknowledged revision", async () => {
  const calls: Array<{ value: string; revision: number }> = [];
  let finish!: (value: SaveResult<string>) => void;
  const queue = new SaveQueue<string>(4, async (value, revision) => {
    calls.push({ value, revision });
    if (calls.length === 1)
      return new Promise((resolve) => {
        finish = resolve;
      });
    return { status: "saved", revision: revision + 1, workspace: value };
  });
  queue.enqueue("first");
  queue.enqueue("second");
  queue.enqueue("third");
  assert.equal(calls.length, 1);
  finish({ status: "saved", revision: 5, workspace: "first" });
  assert.equal(await queue.flush(), true);
  assert.deepEqual(calls, [
    { value: "first", revision: 4 },
    { value: "third", revision: 5 },
  ]);
  assert.equal(queue.getSnapshot().revision, 6);
  assert.equal(queue.getSnapshot().pending, null);
});

test("failed writes retain the latest draft and retry without inventing revisions", async () => {
  let fail = true;
  const revisions: number[] = [];
  const queue = new SaveQueue<string>(7, async (value, revision) => {
    revisions.push(revision);
    if (fail) throw new Error("offline");
    return { status: "saved", revision: revision + 1, workspace: value };
  });
  queue.enqueue("draft");
  assert.equal(await queue.flush(), false);
  assert.equal(queue.getSnapshot().status, "failed");
  queue.enqueue("latest draft");
  assert.equal(queue.getSnapshot().pending, "latest draft");
  fail = false;
  assert.equal(await queue.retry(), true);
  assert.deepEqual(revisions, [7, 7]);
});

test("conflicts preserve edits until an explicit keep or discard decision", async () => {
  let conflict = true;
  const revisions: number[] = [];
  const queue = new SaveQueue<string>(0, async (value, revision) => {
    revisions.push(revision);
    return conflict
      ? { status: "conflict", current: { revision: 3, workspace: "remote" } }
      : { status: "saved", revision: revision + 1, workspace: value };
  });
  queue.enqueue("mine");
  await queue.flush();
  assert.equal(queue.getSnapshot().pending, "mine");
  assert.equal(await queue.retry(), false);
  queue.enqueue("latest mine");
  conflict = false;
  assert.equal(await queue.keepLocal(), true);
  assert.deepEqual(revisions, [0, 3]);
  assert.equal(queue.getSnapshot().revision, 4);
  conflict = true;
  queue.enqueue("discard me");
  await queue.flush();
  queue.discard();
  assert.equal(queue.getSnapshot().pending, null);
  assert.equal(queue.getSnapshot().status, "saved");
});
