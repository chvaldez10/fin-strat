import { DashboardPageHeader } from "@/components/layout/dashboard/page-header";
import { DashboardSidebar } from "@/components/layout/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen min-w-0 w-full">
        <DashboardSidebar />
        <SidebarInset>
          <DashboardPageHeader />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
