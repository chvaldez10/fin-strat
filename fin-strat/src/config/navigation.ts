import {
  CalendarDays,
  CircleDollarSign,
  Home,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Search,
  Settings,
  Sparkle,
  Sparkles,
  Target,
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
    title: "Trackers",
    href: "/trackers",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
  },
];

export const publicUserNav = {
  title: "Profile",
  href: "/user/profile",
  initials: "CH",
  name: "Chris",
} as const;

export const publicNavGroups: PublicNavGroup[] = [
  {
    title: "Track",
    description: "A few places to keep an eye on the things that drift.",
    items: [
      {
        title: "Habits",
        href: "/trackers",
        description: "Small recurring routines, streaks, and check-ins.",
        icon: ListChecks,
      },
      {
        title: "Notes",
        href: "/trackers",
        description: "Loose thoughts, reminders, and personal references.",
        icon: NotebookPen,
      },
      {
        title: "Calendar",
        href: "/dashboard",
        description: "Upcoming dates and things that need a little attention.",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "Review",
    description: "Quick scans for money, goals, and current curiosities.",
    items: [
      {
        title: "Money",
        href: "/dashboard/analytics",
        description: "Budget signals, subscriptions, and watchlist items.",
        icon: CircleDollarSign,
      },
      {
        title: "Goals",
        href: "/dashboard",
        description: "Current priorities and progress worth nudging forward.",
        icon: Target,
      },
      {
        title: "Search",
        href: "/dashboard/analytics",
        description: "Find a saved thing without remembering where it lives.",
        icon: Search,
      },
    ],
  },
  {
    title: "Personalize",
    description: "Keep the dashboard small, private, and tuned to you.",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        description: "The main daily scan for whatever matters right now.",
        icon: LayoutDashboard,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        description: "Adjust sections, reminders, and quiet-mode preferences.",
        icon: Settings,
      },
      {
        title: "Quick Capture",
        href: "/login",
        description: "Drop in a thought before it disappears.",
        icon: Sparkle,
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
    title: "Watchlist",
    href: "/dashboard/analytics",
    icon: Search,
    items: [
      {
        title: "Money and notes",
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
  title: "Personal Dashboard",
  subtitle: "Life signals",
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
  name: "Chris",
  email: "personal dashboard",
  initials: "CH",
} as const;
