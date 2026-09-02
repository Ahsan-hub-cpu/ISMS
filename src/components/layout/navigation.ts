import {
  ClipboardCheck,
  FileCheck2,
  FolderLock,
  LayoutDashboard,
  Library,
  ListChecks,
  ScrollText,
  ShieldAlert,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { can, type Permission } from "@/modules/auth/domain/permissions";
import type { UserRole } from "@/modules/auth/domain/user";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see the entry; omitted means visible to everyone. */
  permission?: Permission;
  /** Modules that are not implemented yet are shown but not clickable. */
  available: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const allSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, available: true }],
  },
  {
    title: "Compliance",
    items: [
      {
        label: "Frameworks",
        href: "/frameworks",
        icon: Library,
        permission: "frameworks:read",
        available: true,
      },
      {
        label: "Control Register",
        href: "/register",
        icon: ListChecks,
        permission: "register:read",
        available: true,
      },
      {
        label: "Assessments",
        href: "/assessments",
        icon: ClipboardCheck,
        permission: "assessments:read",
        available: true,
      },
      { label: "Gaps", href: "/gaps", icon: ShieldAlert, permission: "gaps:read", available: true },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Evidence",
        href: "/evidence",
        icon: FolderLock,
        permission: "evidence:read",
        available: true,
      },
      {
        label: "Remediation",
        href: "/remediation",
        icon: Wrench,
        permission: "remediation:read",
        available: true,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: FileCheck2,
        permission: "reports:read",
        available: true,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users & Roles",
        href: "/admin/users",
        icon: Users,
        permission: "users:read",
        available: true,
      },
      {
        label: "Audit Log",
        href: "/admin/audit-log",
        icon: ScrollText,
        permission: "audit:read",
        available: true,
      },
    ],
  },
];

/** Menu entries the given role is allowed to see. Empty sections are dropped. */
export const navigationFor = (role: UserRole): NavSection[] =>
  allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(role, item.permission)),
    }))
    .filter((section) => section.items.length > 0);
