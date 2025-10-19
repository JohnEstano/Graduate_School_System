import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MainNavItem, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CalendarFold, Calendar, CreditCard, DollarSign, FileText, GraduationCap, LayoutGrid, MessageSquareText, ScrollText, SquareUserRound, Users, Box, LibraryBig, Send, BadgeDollarSign } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from "react";

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        };
        is_adviser?: boolean; // <-- Add this
    };
};

const studentNavItems: MainNavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Submissions',
        href: '/submission',
        icon: Send,
        subItems: [
            { title: 'Comprehensive Exam', href: '/comprehensive-exam' },
            { title: 'Defense Requirements', href: '/defense-requirements' },
        ],
    },
    {
        title: 'My Documents', // <-- Add this block
        href: '/student/documents',
        icon: FileText,
    },
    {
        title: 'Academic Records',
        href: '/academic-records',
        icon: LibraryBig,
    },
    {
        title: 'Payments',
        href: '/payment',
        icon: CreditCard,
    },
    {
        title: 'Schedules',
        href: '/schedule',
        icon: CalendarFold,

    },
    

];

const coordinatorNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    {
        title: 'Thesis & Dissertations',
        href: '/coordinator/defense-requests',
        icon: GraduationCap,
        subItems: [
            { title: 'Defense Requests', href: '/coordinator/defense-requests' },
            { title: 'Panel Assignment', href: '/panelists' },
            { title: 'Adviser List', href: '/coordinator/adviser-list'},
        ],
    },
    {
        title: 'Applications',
        href: '/defense',
        icon: FileText,
        subItems: [
            { title: 'Comprehensive Exams', href: '/coordinator/compre-exam' },
            { title: 'Payment Receipt', href: '/coordinator/compre-payment' },
        ],
    },
    { title: 'Honorarium', href: '/honorarium-summary', icon: DollarSign },
    { title: 'Student Records', href: '/student-records', icon: Users },
     { title: 'Payment Rates', href: '/dean/payment-rates', icon: DollarSign },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
   
];

const assistantNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Defense Requests', href: '/assistant/all-defense-list', icon: FileText }, 
   
    {
        title: 'Applications',
        href: '/defense',
        icon: FileText,
        subItems: [
            { title: 'Comprehensive Exams', href: '/coordinator/compre-exam' },
            { title: 'Payment Receipt', href: '/coordinator/compre-payment' },
        ],
    },
    { title: 'Honorarium', href: '/honorarium-summary', icon: DollarSign },
    { title: 'Student Records', href: '/student-records', icon: Users },
     { title: 'Payment Rates', href: '/dean/payment-rates', icon: DollarSign },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
    
];

const facultyNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
];

const deanNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Defense Requests', href: '/dean/defense-requests', icon: FileText },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
    { title: 'Payment Rates', href: '/dean/payment-rates', icon: DollarSign },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const {
        auth: { user, is_adviser }, 
    } = usePage<PageProps>().props;

    let navItems: MainNavItem[];

    if (user.role === 'Coordinator') {
        navItems = coordinatorNavItems;
    } else if (user.role === 'Dean') {
        navItems = deanNavItems;
    } else if (user.role === 'Administrative Assistant') {
        navItems = assistantNavItems;
    } else if (user.role === 'Faculty' || user.role === 'Adviser') {
        navItems = facultyNavItems;
    } else {
        navItems = studentNavItems;
    }

    // Expanded menus state
    const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem("sidebar.expandedMenus");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("sidebar.expandedMenus", JSON.stringify(expandedMenus));
    }, [expandedMenus]);

    // Show "Others" section for Faculty, Coordinator, Dean, or actual Adviser
    const showOthers =
        user.role === 'Faculty' ||
        user.role === 'Coordinator' ||
        user.role === 'Dean' ||
        is_adviser; // <-- Only show if user is an actual adviser

    // Items for the Others section
    const othersNavItems: MainNavItem[] = [
        {
            title: 'My Students',
            href: '/adviser/students-list',
            icon: Users,
        },
        {
            title: 'Defense Requirements',
            href: '/all-defense-requirements',
            icon: GraduationCap,
        },
    ];

    return (
        <Sidebar collapsible="offcanvas" className="px-3 pt-5" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="xl" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={navItems}
                    expandedMenus={expandedMenus}
                    setExpandedMenus={setExpandedMenus}
                />
                {showOthers && (
                    <div className="mb-2">
                        <NavMain
                            items={othersNavItems}
                            expandedMenus={expandedMenus}
                            setExpandedMenus={setExpandedMenus}
                            sectionTitle="Others"
                        />
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
