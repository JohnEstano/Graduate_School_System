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
}

export interface SubItems {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
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
    thesis_title: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    date_of_defense: string;
    mode_defense: string;
    status: string;
    priority: string;
   
}

export type DefenseRequestSummary = {
    id: number;
    thesis_title: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    date_of_defense: string;
    mode_defense: string;
    status: string;
    priority: string;
    
};

type TableDefenseRequestsProps = {
  paged: DefenseRequestFull[];
  columns: Record<string, boolean>;
  selected: number[];
  toggleSelectOne: (id: number) => void;
  headerChecked: boolean;
  toggleSelectAll: () => void;
  toggleSort: () => void;
  sortDir: 'asc' | 'desc' | null | undefined;
  setSelectedRequest: (r: DefenseRequestFull) => void;
  setSelectedIndex: (i: number) => void;
  sorted: DefenseRequestFull[];
  selectedRequest: DefenseRequestFull | null;
  selectedIndex: number;
  onStatusChange: (id: number, status: string) => void;
  onPriorityChange: (id: number, priority: string) => void;
};
