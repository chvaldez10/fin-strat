"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/config/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const labelByHref = new Map(
  dashboardNavItems.flatMap((item) => [
    [item.href, item.title],
    ...(item.items?.map((subItem) => [subItem.href, subItem.title] as const) ??
      []),
  ])
);

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function DashboardPageHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const dashboardSegments =
    pathSegments[0] === "dashboard" ? pathSegments.slice(1) : pathSegments;
  const parentNavItem = dashboardNavItems.find((item) =>
    item.items?.some(
      (subItem) => subItem.href === pathname && subItem.href !== item.href
    )
  );
  const currentNavItem = parentNavItem?.items?.find(
    (subItem) => subItem.href === pathname
  );
  const exactNavItem = dashboardNavItems.find(
    (item) => item.href === pathname
  );
  const breadcrumbs = parentNavItem && currentNavItem
    ? [
        {
          href: parentNavItem.href,
          label: parentNavItem.title,
          isLast: false,
        },
        {
          href: currentNavItem.href,
          label: currentNavItem.title,
          isLast: true,
        },
      ]
    : exactNavItem
      ? [
          {
            href: exactNavItem.href,
            label: exactNavItem.title,
            isLast: true,
          },
        ]
      : dashboardSegments.map((segment, index) => {
          const candidateHref = `/dashboard/${dashboardSegments
            .slice(0, index + 1)
            .join("/")}`;
          const registeredLabel = labelByHref.get(candidateHref);

          return {
            href: registeredLabel ? candidateHref : undefined,
            label: registeredLabel ?? formatSegment(segment),
            isLast: index === dashboardSegments.length - 1,
          };
        });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            {breadcrumbs.length === 0 ? (
              <BreadcrumbPage>Overview</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Overview</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {breadcrumbs.map((crumb) => (
            <Fragment key={`${crumb.label}-${crumb.href ?? "text"}`}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <ThemeToggle />
    </header>
  );
}
