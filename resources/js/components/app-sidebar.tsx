import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MainNavItem, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CalendarFold, Calendar, CreditCard, DollarSign, FileText, GraduationCap, LayoutGrid, MessageSquareText, ScrollText, SquareUserRound, Users, Box, LibraryBig, Send } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from "react";

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        };
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
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
    { title: 'Adviser List', href: '/coordinator/adviser-list', icon: Users },
];

const assistantNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Defense Requests', href: '/assistant/all-defense-list', icon: FileText }, // Only this for AA
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
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
];

const facultyNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Defense Requirements', href: '/all-defense-requirements', icon: GraduationCap },
    { title: 'My Students', href: '/adviser/students-list', icon: Users }, // <-- Add this line
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
];

const deanNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Programs', href: '/dean/programs', icon: LibraryBig },
    { title: 'Users', href: '/dean/users', icon: Users },
    { title: 'Defense Requests', href: '/dean/defense-requests', icon: FileText },
    { title: 'Schedules', href: '/dean/schedules', icon: CalendarFold },
    { title: 'Payment Rates', href: '/dean/payment-rates', icon: DollarSign },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const {
        auth: { user },
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

    // Only show badge for coordinator's "Defense Requests" submenu
    const [defenseRequestCount, setDefenseRequestCount] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;

        async function fetchCount() {
            try {
                const res = await fetch('/api/defense-requests/count');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setDefenseRequestCount(data.count);
                }
            } catch {
                // ignore
            }
        }

        fetchCount();
        const pollInterval = setInterval(fetchCount, 60000);
        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    // Only add badge for coordinator
    if (user.role === 'Coordinator') {
        navItems = navItems.map(item => {
            if (item.title === 'Thesis & Dissertations') {
                return {
                    ...item,
                    indicator: defenseRequestCount > 0,
                    subItems: item.subItems?.map(sub =>
                        sub.title === 'Defense Requests'
                            ? { ...sub, count: defenseRequestCount }
                            : sub
                    ),
                };
            }
            return item;
        });
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
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
