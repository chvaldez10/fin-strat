import type { DashboardUser } from "./types";

export const currentMockUser: DashboardUser = {
  id: "user_chris_demo",
  name: "Chris",
  email: "personal dashboard",
  initials: "CH",
};

export function getCurrentMockUser() {
  return currentMockUser;
}
