import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MainNavItem, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Bell, CalendarFold, CalendarSync, CreditCard, DollarSign, File, FileText, LayoutGrid, MessageSquareText, ScrollText, Users } from 'lucide-react';
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
        icon: FileText,
        subItems: [
            { title: 'Comprehensive Exam', href: '/comprehensive-exam' },
            { title: 'Defense Requests', href: '/defense-request' },
        ],
    },
    {
        title: 'Payments',
        href: '/payment',
        icon: CreditCard,
    },
    {
        title: 'Schedules',
        href: '/schedule',
        icon: CalendarSync,
    },
    {
        title: 'Notifications',
        href: '/notification',
        icon: Bell,
    },
];

const assistantNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    {
        title: 'Requests',
        href: '/requests',
        icon: ScrollText,
        subItems: [
            { title: 'Defense Requests', href: '/defense-request' },
            { title: 'Comprehensive Exams', href: '/comprehensive-exam' },
            { title: 'Payment Receipt', href: '/payment-receipt' },
        ],
    },
    {
        title: 'Honorarium',
        href: '/honorarium',
        icon: DollarSign,
        subItems: [
            { title: 'Honorarium Summary', href: '/honorarium-summary' },
            { title: 'Generate Report', href: '/generate-report' },
        ],
    },
    { title: 'Student Records', href: '/student-records', icon: Users },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },
    { title: 'Messages', href: '/messages', icon: MessageSquareText },


];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    const staffRoles = ['Administrative Assistant', 'Coordinator', 'Dean'];
    const isStaff = staffRoles.includes(user.role);
    const items = isStaff ? assistantNavItems : studentNavItems;

    const [defenseRequestCount, setDefenseRequestCount] = useState<number>(0);

    useEffect(() => {
        async function fetchCount() {
            try {
                const res = await fetch('/api/defense-requests/count');
                if (res.ok) {
                    const data = await res.json();
                    setDefenseRequestCount(data.count);
                }
            } catch {

                //errrrroorror
            }
        }
        fetchCount();
        const interval = setInterval(fetchCount, 1000);
        return () => clearInterval(interval);
    }, []);

    let navItems = items;
    if (isStaff) {
        navItems = assistantNavItems.map(item => {
            if (item.title === 'Requests') {
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
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
