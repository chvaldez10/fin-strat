import { cookies } from "next/headers";
import { DashboardPageHeader } from "@/components/layout/dashboard/page-header";
import { DashboardSidebar } from "@/components/layout/dashboard/sidebar";
import { DashboardSidebarProvider } from "@/components/layout/dashboard/sidebar-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import { DASHBOARD_SIDEBAR_COOKIE } from "@/config/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const defaultOpen =
    (await cookies()).get(DASHBOARD_SIDEBAR_COOKIE)?.value !== "false";
  return (
    <DashboardSidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen min-w-0 w-full">
        <DashboardSidebar />
        <SidebarInset id="main-content" tabIndex={-1}>
          <DashboardPageHeader />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </DashboardSidebarProvider>
  );
}
