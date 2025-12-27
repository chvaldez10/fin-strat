"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function PageHeader() {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;
    
    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-background">
      <SidebarTrigger />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <ThemeToggle />
    </header>
  );
}

