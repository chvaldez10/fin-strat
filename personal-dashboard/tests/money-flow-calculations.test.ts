import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateMoneyFlowForecast,
  calculateMoneyFlowTotals,
} from "../src/features/money-flow/calculations.js";
import { createDemoMoneyFlowDocument } from "../src/features/money-flow/mock-data.js";
import { addMonths } from "../src/features/money-flow/months.js";
import { decodeStoredMoneyFlowDocument } from "../src/features/money-flow/persistence/document-codec.js";

test("carry-forward and monthly totals share exact cents, including a deliberate zero override", () => {
  const document = createDemoMoneyFlowDocument("test");
  const account = document.accounts[0];
  const first = document.scenario.startMonth,
    second = addMonths(first, 1);
  account.transfers[0].monthOverrides = { [first]: 0 };
  const forecast = calculateMoneyFlowForecast(document);
  assert.equal(forecast[0].transferAmounts[account.transfers[0].id], 0);
  assert.equal(
    forecast[1].startingBalanceCents,
    forecast[0].projectedBalanceCents
  );
  assert.deepEqual(calculateMoneyFlowTotals(document, second), forecast[1]);
  assert.equal(
    forecast.every((month) =>
      Number.isSafeInteger(month.projectedBalanceCents)
    ),
    true
  );
});

test("shared legacy graphs retain all accounts, nodes, transfers and paired schedules", () => {
  const demo = createDemoMoneyFlowDocument("test");
  const first = demo.accounts[0],
    second = demo.accounts[1];
  const transfer = {
    id: "between-accounts",
    sourceNodeId: first.centerNodeId,
    targetNodeId: second.centerNodeId,
    baseMonthlyAmountCents: 0,
    startMonth: demo.scenario.startMonth,
    monthOverrides: { [demo.scenario.startMonth]: 0 },
  };
  const legacy = {
    id: demo.id,
    userId: demo.userId,
    version: 4,
    currency: "CAD",
    scenario: demo.scenario,
    view: demo.view,
    viewport: first.viewport,
    accounts: demo.accounts.map((account) => ({
      id: account.id,
      nodeId: account.centerNodeId,
      institution: account.institution,
      name: account.name,
      openingBalanceCents: account.openingBalanceCents,
    })),
    nodes: [...first.nodes, ...second.nodes],
    transfers: [transfer],
  };
  const result = decodeStoredMoneyFlowDocument(legacy, "test");
  assert.ok(result);
  assert.equal(result.accounts.length, 2);
  for (const account of result.accounts) {
    assert.equal(account.nodes.length, legacy.nodes.length);
    assert.deepEqual(
      account.transfers[0].monthOverrides,
      transfer.monthOverrides
    );
    assert.equal(account.transfers[0].baseMonthlyAmountCents, 0);
    assert.equal(
      account.transfers[0].linkedTransferId,
      "legacy:between-accounts"
    );
    assert.notEqual(account.transfers[0].counterpartyAccountId, account.id);
  }
});
