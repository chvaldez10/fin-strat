/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_moneyFlowAccess from "../lib/moneyFlowAccess.js";
import type * as lib_workspaceLease from "../lib/workspaceLease.js";
import type * as moneyFlow from "../moneyFlow.js";
import type * as moneyFlowSessions from "../moneyFlowSessions.js";
import type * as permissions from "../permissions.js";
import type * as preferences from "../preferences.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
import type * as watchlist from "../watchlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  invitations: typeof invitations;
  "lib/moneyFlowAccess": typeof lib_moneyFlowAccess;
  "lib/workspaceLease": typeof lib_workspaceLease;
  moneyFlow: typeof moneyFlow;
  moneyFlowSessions: typeof moneyFlowSessions;
  permissions: typeof permissions;
  preferences: typeof preferences;
  users: typeof users;
  validation: typeof validation;
  watchlist: typeof watchlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
