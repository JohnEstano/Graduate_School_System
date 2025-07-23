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
    [key: string]: unknown; // This allows for additional properties...
}

export interface DefenseRequest {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    school_id: string;
    program: string;
    thesis_title: string;
    date_of_defense: string;
    mode_defense: string;
    defense_type: string;
    advisers_endorsement?: string;
    rec_endorsement?: string;
    proof_of_payment?: string;
    reference_no?: string;
    defense_adviser: string;
    defense_chairperson: string;
    defense_panelist1: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'needs-info';
    created_at?: string;
}
