import {
  Blocks,
  BookOpen,
  Component,
  Home,
  Layers3,
  LayoutDashboard,
  Palette,
  PanelsTopLeft,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
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

export type PublicNavFeature = NavItem & {
  description: string;
  icon: LucideIcon;
};

export type PublicNavGroup = {
  title: string;
  description: string;
  items: PublicNavFeature[];
};

export const publicNavItems: NavItem[] = [
  {
    title: "Components",
    href: "/components",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export const publicNavGroups: PublicNavGroup[] = [
  {
    title: "Foundations",
    description: "Start with the design decisions that keep products aligned.",
    items: [
      {
        title: "Design Tokens",
        href: "/components",
        description: "Color, spacing, radius, shadow, and motion standards.",
        icon: Palette,
      },
      {
        title: "Typography",
        href: "/components",
        description:
          "Reusable type scales for headings, body copy, and labels.",
        icon: BookOpen,
      },
      {
        title: "Responsive Shells",
        href: "/dashboard",
        description: "Public and dashboard layouts built for real app growth.",
        icon: PanelsTopLeft,
      },
    ],
  },
  {
    title: "Components",
    description: "Composable UI blocks powered by shadcn and Radix primitives.",
    items: [
      {
        title: "Primitives",
        href: "/components",
        description: "Buttons, inputs, sheets, menus, and shared controls.",
        icon: Component,
      },
      {
        title: "App Patterns",
        href: "/components",
        description: "Empty, loading, error, form, and search patterns.",
        icon: Layers3,
      },
      {
        title: "Search & Filters",
        href: "/dashboard/analytics",
        description: "Product patterns for finding and refining content.",
        icon: Search,
      },
    ],
  },
  {
    title: "Resources",
    description: "Reference flows for building polished product experiences.",
    items: [
      {
        title: "Dashboard Demo",
        href: "/dashboard",
        description: "A scalable workspace shell with sidebar navigation.",
        icon: LayoutDashboard,
      },
      {
        title: "Accessibility",
        href: "/components",
        description:
          "Keyboard-friendly primitives and clear interaction states.",
        icon: ShieldCheck,
      },
      {
        title: "Launch Checklist",
        href: "/login",
        description: "Mock flows for validating forms and product surfaces.",
        icon: Rocket,
      },
    ],
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

export const dashboardUtilityItems: DashboardNavItem[] = [
  {
    title: "View site",
    href: "/",
    icon: Home,
  },
];

export const dashboardUser = {
  name: "Designer",
  email: "designer@example.com",
  initials: "DS",
} as const;
