import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const role = v.union(v.literal("admin"), v.literal("member"));
export const scenario = v.object({
  name: v.string(),
  startMonth: v.string(),
  forecastMonthCount: v.number(),
});
export const view = v.object({
  selectedMonth: v.string(),
  selectedAccountId: v.string(),
  mode: v.union(v.literal("canvas"), v.literal("table")),
});
export const node = v.object({
  id: v.string(),
  kind: v.union(
    v.literal("chequing"),
    v.literal("income"),
    v.literal("expense"),
    v.literal("account"),
    v.literal("note")
  ),
  label: v.string(),
  position: v.object({ x: v.number(), y: v.number() }),
  note: v.optional(v.string()),
});
export const transfer = v.object({
  id: v.string(),
  linkedTransferId: v.optional(v.string()),
  counterpartyAccountId: v.optional(v.string()),
  sourceNodeId: v.string(),
  targetNodeId: v.string(),
  baseMonthlyAmountCents: v.number(),
  startMonth: v.string(),
  endMonth: v.optional(v.string()),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  monthOverrides: v.optional(
    v.record(v.string(), v.union(v.number(), v.null()))
  ),
  label: v.optional(v.string()),
});
export const viewport = v.object({
  x: v.number(),
  y: v.number(),
  zoom: v.number(),
});
export const workspace = v.object({
  id: v.string(),
  institution: v.string(),
  name: v.string(),
  accountType: v.union(v.literal("chequing"), v.literal("savings")),
  openingBalanceCents: v.number(),
  centerNodeId: v.string(),
  nodes: v.array(node),
  transfers: v.array(transfer),
  viewport,
});
export const preferenceFields = {
  reducedMotion: v.boolean(),
  weeklyReview: v.boolean(),
  showMoney: v.boolean(),
};

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(role),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_role", ["role"]),
  invitations: defineTable({
    tokenHash: v.string(),
    email: v.optional(v.string()),
    role,
    kind: v.union(v.literal("invite"), v.literal("recovery")),
    expiresAt: v.number(),
    createdBy: v.optional(v.id("users")),
    usedBy: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
  }).index("by_token", ["tokenHash"]),
  moneyFlowDocuments: defineTable({
    ownerId: v.id("users"),
    domainId: v.string(),
    version: v.literal(4),
    currency: v.literal("CAD"),
    scenario,
    view,
    revision: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
  moneyFlowAccounts: defineTable({
    ownerId: v.id("users"),
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    workspace,
    revision: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_document", ["ownerId", "documentId"])
    .index("by_document_account", ["documentId", "accountId"]),
  moneyFlowWorkspaceLeases: defineTable({
    ownerId: v.id("users"),
    documentId: v.id("moneyFlowDocuments"),
    accountId: v.string(),
    sessionId: v.union(v.string(), v.null()),
    generation: v.number(),
    expiresAt: v.number(),
  }).index("by_documentId_and_accountId", ["documentId", "accountId"]),
  watchlistCaptures: defineTable({
    ownerId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index("by_owner_created", ["ownerId", "createdAt"])
    .index("by_owner_legacy", ["ownerId", "legacyId"]),
  preferences: defineTable({
    ownerId: v.id("users"),
    ...preferenceFields,
  }).index("by_owner", ["ownerId"]),
  imports: defineTable({
    ownerId: v.id("users"),
    key: v.string(),
    completedAt: v.number(),
    documentId: v.optional(v.id("moneyFlowDocuments")),
  }).index("by_owner_key", ["ownerId", "key"]),
});
