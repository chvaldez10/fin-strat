import assert from "node:assert/strict";
import { test } from "node:test";
import { saveWatchlistCapture } from "../src/features/watchlist/captures.js";

const oldNote = {
  id: "old",
  text: "Keep this note",
  createdAt: "2026-10-08T00:00:00.000Z",
};
const newNote = { ...oldNote, id: "new", text: "A new note" };

test("captures prepend without losing existing notes and scope storage to the user", () => {
  let writtenKey = "";
  let writtenValue = "";
  saveWatchlistCapture(
    {
      getItem: () => JSON.stringify([oldNote]),
      setItem: (key, value) => {
        writtenKey = key;
        writtenValue = value;
      },
    },
    "owner",
    newNote
  );
  assert.equal(writtenKey, "personal-dashboard:watchlist-captures:owner");
  assert.deepEqual(JSON.parse(writtenValue), [newNote, oldNote]);
});

test("corrupt capture data is preserved and write failures are reported", () => {
  for (const value of ["not-json", "{}", "[null]", '[{"text":"incomplete"}]']) {
    assert.throws(() =>
      saveWatchlistCapture(
        {
          getItem: () => value,
          setItem: () => assert.fail("must not overwrite corrupt data"),
        },
        "owner",
        newNote
      )
    );
  }
  assert.throws(
    () =>
      saveWatchlistCapture(
        {
          getItem: () => "[]",
          setItem: () => {
            throw new Error("Quota exceeded");
          },
        },
        "owner",
        newNote
      ),
    /Quota exceeded/
  );
});
