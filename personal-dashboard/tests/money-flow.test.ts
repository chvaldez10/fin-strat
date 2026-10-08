import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { parseMoneyCents } from "../src/features/money-flow/amounts.js";
import { createDemoMoneyFlowDocument } from "../src/features/money-flow/mock-data.js";
import { decodeStoredMoneyFlowDocument } from "../src/features/money-flow/persistence/document-codec.js";
import { loadMoneyFlow } from "../src/features/money-flow/repository.js";
import {
  removeTransfers,
  updateTransfer,
} from "../src/features/money-flow/transfers.js";

test("linked transfer edits update both financial schedules while preserving labels and the input document", () => {
  const document = createDemoMoneyFlowDocument("review-user");
  const before = structuredClone(document);
  const sourceAccount = document.accounts.find(
    (account) => account.id === "account-scotiabank"
  )!;
  const source = sourceAccount.transfers.find(
    (transfer) => transfer.linkedTransferId
  )!;
  const targetAccount = document.accounts.find(
    (account) => account.id === source.counterpartyAccountId
  )!;
  const target = targetAccount.transfers.find(
    (transfer) => transfer.linkedTransferId === source.linkedTransferId
  )!;
  const changes = {
    baseMonthlyAmountCents: 25000,
    startMonth: document.scenario.startMonth,
    endMonth: undefined,
    monthOverrides: { [document.view.selectedMonth]: 12300 },
    label: "Updated transfer",
  };
  const result = updateTransfer(document, sourceAccount.id, source.id, changes);
  const updatedSource = result.accounts
    .find((account) => account.id === sourceAccount.id)!
    .transfers.find((transfer) => transfer.id === source.id)!;
  const updatedTarget = result.accounts
    .find((account) => account.id === targetAccount.id)!
    .transfers.find((transfer) => transfer.id === target.id)!;
  assert.equal(updatedSource.baseMonthlyAmountCents, 25000);
  assert.equal(updatedTarget.baseMonthlyAmountCents, 25000);
  assert.deepEqual(updatedTarget.monthOverrides, changes.monthOverrides);
  assert.equal(updatedTarget.label, target.label);
  assert.equal(updatedSource.label, changes.label);
  assert.deepEqual(document, before);
});

test("linked transfer deletion removes its counterpart and leaves unrelated flows intact", () => {
  const document = createDemoMoneyFlowDocument("review-user");
  const sourceAccount = document.accounts.find(
    (account) => account.id === "account-scotiabank"
  )!;
  const source = sourceAccount.transfers.find(
    (transfer) => transfer.linkedTransferId
  )!;
  const count = document.accounts.reduce(
    (sum, account) => sum + account.transfers.length,
    0
  );
  const result = removeTransfers(document, sourceAccount.id, [source.id]);
  assert.equal(
    result.accounts.reduce((sum, account) => sum + account.transfers.length, 0),
    count - 2
  );
  assert.equal(
    result.accounts.some((account) =>
      account.transfers.some(
        (transfer) => transfer.linkedTransferId === source.linkedTransferId
      )
    ),
    false
  );
  assert.equal(
    document.accounts.reduce(
      (sum, account) => sum + account.transfers.length,
      0
    ),
    count
  );
});

const userId = "review-user";
const storageKey = `personal-dashboard:money-flow:${userId}`;
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (previousWindow)
    Object.defineProperty(globalThis, "window", previousWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

function useStorage(
  getItem: (key: string) => string | null,
  setItem: (key: string, value: string) => void = () => {
    throw new Error("Unexpected write");
  }
) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem, setItem, removeItem: () => {} } },
  });
}

test("money parsing preserves exact cents and rejects malformed or unsafe amounts", () => {
  for (const [input, cents] of [
    ["0", 0],
    ["0.29", 29],
    [".50", 50],
    [" 12.3 ", 1230],
    ["90071992547409.91", Number.MAX_SAFE_INTEGER],
  ] as const)
    assert.equal(parseMoneyCents(input), cents);
  for (const input of [
    "",
    "12abc",
    "1e3",
    "1.999",
    "NaN",
    "Infinity",
    "-1",
    "90071992547409.92",
  ])
    assert.equal(parseMoneyCents(input), null, input);
  assert.equal(parseMoneyCents("-1.29", { allowNegative: true }), -129);
});

test("loading current records preserves intentional zero amounts without rewriting storage", () => {
  const document = createDemoMoneyFlowDocument(userId);
  for (const account of document.accounts)
    for (const transfer of account.transfers)
      transfer.baseMonthlyAmountCents = 0;
  useStorage((key) => (key === storageKey ? JSON.stringify(document) : null));
  assert.deepEqual(loadMoneyFlow(userId), document);
});

test("untrusted records reject invalid nodes, duplicate IDs, unsafe money, and dates without throwing", () => {
  const fixtures: Array<
    (document: ReturnType<typeof createDemoMoneyFlowDocument>) => void
  > = [
    (document) => {
      (document.accounts[0].nodes as unknown[])[0] = null;
    },
    (document) => {
      document.accounts[0].nodes.push(document.accounts[0].nodes[0]);
    },
    (document) => {
      document.accounts[0].transfers[0].baseMonthlyAmountCents = 0.5;
    },
    (document) => {
      document.accounts[0].transfers[0].baseMonthlyAmountCents = -1;
    },
    (document) => {
      document.accounts[0].viewport.zoom = 0;
    },
    (document) => {
      document.view.selectedMonth = "2000-01";
    },
    (document) => {
      document.scenario.forecastMonthCount = Number.MAX_SAFE_INTEGER;
    },
  ];
  for (const mutate of fixtures) {
    const document = createDemoMoneyFlowDocument(userId);
    mutate(document);
    assert.equal(decodeStoredMoneyFlowDocument(document, userId), null);
  }
});

test("legacy records owned by another user cannot be migrated into the active user", () => {
  const document = createDemoMoneyFlowDocument("another-user");
  assert.equal(decodeStoredMoneyFlowDocument(document, userId), null);
  assert.equal(
    decodeStoredMoneyFlowDocument({ ...document, version: 3 }, userId),
    null
  );
});

test("corrupt saved data and unavailable storage are surfaced rather than replaced", () => {
  for (const value of ["not-json", "null", "{}"]) {
    useStorage((key) => (key === storageKey ? value : null));
    assert.throws(() => loadMoneyFlow(userId), /not been overwritten/);
  }
  useStorage(() => {
    throw new Error("Storage blocked");
  });
  assert.throws(() => loadMoneyFlow(userId), /Storage blocked/);
});

test("valid legacy migration is persisted before its original key is removed", () => {
  const document = createDemoMoneyFlowDocument(userId);
  const account = document.accounts[0];
  const legacy = {
    id: document.id,
    userId,
    version: 3,
    currency: "CAD",
    scenario: {
      ...document.scenario,
      openingBalanceCents: account.openingBalanceCents,
    },
    nodes: account.nodes,
    transfers: account.transfers,
    viewport: account.viewport,
    view: { selectedMonth: document.view.selectedMonth, mode: "canvas" },
  };
  const entries = new Map([
    ["personal-dashboard:money-flow", JSON.stringify(legacy)],
  ]);
  useStorage(
    (key) => entries.get(key) ?? null,
    (key, value) => entries.set(key, value)
  );
  const result = loadMoneyFlow(userId);
  assert.equal(result.version, 4);
  assert.equal(
    result.accounts[0].openingBalanceCents,
    account.openingBalanceCents
  );
  assert.deepEqual(result.accounts[0].transfers, account.transfers);
  assert.deepEqual(JSON.parse(entries.get(storageKey)!), result);
});
