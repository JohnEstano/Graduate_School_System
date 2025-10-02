import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface MainNavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    subItems?: SubItems[];
    indicator?: boolean;
    count?: number;
}

export interface SubItems {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    count?: number;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    school_id: string;
    program: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    role: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface DefenseRequest {
    id: number;
    school_id: string;
    submitted_by?: number;
    thesis_title: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    defense_type: string;
    date_of_defense: string;
    mode_defense: string;
    status: string;
    priority: string;
    last_status_updated_by?: string;
    last_status_updated_at?: string;
    defense_adviser?: string;
}
export type Panelist = {
  id: number;
  name: string;
  email: string;
  role: "Chairperson" | "Panel Member";
  status: "Assigned" | "Not Assigned";
  assignments?: {
    id: number;
    defense_type: "Proposal" | "Prefinal" | "Final";
    thesis_title: string;
    role?: "Chairperson" | "Panel Member"; // <-- add this
    receivable?: string | number | null;   // <-- add this
  }[];
  created_at: string;
  updated_at: string;
};

export type PanelistHonorariumSpec = {
  id: number;
  role: "Chairperson" | "Panel Member";
  defense_type: "Proposal" | "Prefinal" | "Final";
  amount: string;
};

export type DefenseRequestSummary = {
    id: number;
    thesis_title: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    defense_type: string;
    date_of_defense: string;
    mode_defense: string;
    status: string;
    priority: string;
    last_status_updated_by?: string;
    last_status_updated_at?: string;
};

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

type DefaultReceivable = {
  defense_type: string;
  receivable: number | string | null;
};

type Assignment = {
  id: number;
  defense_type: string;
  thesis_title?: string | null;
  role?: string | null;
  receivable?: number | string | null;
};

type PanelistWithAssignments = Panelist & {
  assignments?: Assignment[];
  default_receivables?: DefaultReceivable[];
};
