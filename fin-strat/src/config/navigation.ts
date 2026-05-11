import {
  Blocks,
  LayoutDashboard,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
};

export type DashboardNavItem = NavItem & {
  icon: LucideIcon;
  items?: NavItem[];
};

export const publicNavItems: NavItem[] = [
  {
    title: "Components",
    href: "/pricing",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export const footerNavItems: NavItem[] = [
  {
    title: "Privacy",
    href: "#",
  },
  {
    title: "Terms",
    href: "#",
  },
  {
    title: "Contact",
    href: "#",
  },
];

export const dashboardNavItems: DashboardNavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Components",
    href: "/dashboard/analytics",
    icon: Blocks,
    items: [
      {
        title: "Overview",
        href: "/dashboard/analytics",
      },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    items: [
      {
        title: "General",
        href: "/dashboard/settings",
      },
    ],
  },
];

export const dashboardWorkspace = {
  title: "Component System",
  subtitle: "Design primitives",
  href: "/dashboard",
  icon: Sparkles,
} as const;

export const dashboardUser = {
  name: "Designer",
  email: "designer@example.com",
  initials: "DS",
} as const;
