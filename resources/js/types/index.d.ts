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
}
export type Panelist = {
    id: number;
    name: string;
    email: string;
    status: 'Available' | 'Not Available';
    date_available: string | null;
    created_at: string;
    updated_at: string;
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
