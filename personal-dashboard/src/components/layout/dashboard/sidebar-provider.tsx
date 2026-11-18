"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DASHBOARD_SIDEBAR_COOKIE } from "@/config/navigation";

export function DashboardSidebarProvider({
  defaultOpen,
  children,
}: Readonly<{ defaultOpen: boolean; children: ReactNode }>) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        document.cookie = `${DASHBOARD_SIDEBAR_COOKIE}=${open}; Path=/; Max-Age=604800; SameSite=Lax`;
      }}
    >
      {children}
    </SidebarProvider>
  );
}
