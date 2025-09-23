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

const assistantNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },


     {
        title: 'Applications',
        href: '/defense',
        icon: FileText,
        subItems: [
        { title: 'Comprehensive Exams', href: '/coordinator/compre-exam' },
         { title: 'Payment Receipt', href: '/coordinator/compre-payment'},

        ],
    },
   

    {
        title: 'Thesis & Dissertations',
        href: '/defense',
        icon: GraduationCap,
        subItems: [
            { title: 'Defense Request', href: '/defense-request' },

          //  { title: 'Defense Management', href: '/coordinator/defense-management', icon: Calendar },
            { title: 'Panelists', href: '/panelists', icon: SquareUserRound },
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
    //{ title: 'Messages', href: '/messages', icon: MessageSquareText },
];

const facultyNavItems: MainNavItem[] = [
    /*
        
        { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    {
        title: 'Thesis & Dissertations',
        href: '/defense',
        icon: GraduationCap,
        subItems: [
            { title: 'Assigned Defense Requests', href: '/defense-request' },
            { title: 'All Defense Requirements', href: '/all-defense-requirements' },
            { title: 'Panelists', href: '/panelists', icon: SquareUserRound },
        ],
    },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },

    */


    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Defense Requirements', href: '/all-defense-requirements', icon: GraduationCap },
    { title: 'Schedules', href: '/schedules', icon: CalendarFold },

];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    const staffRoles = ['Administrative Assistant', 'Coordinator', 'Dean'];
    const isStaff = staffRoles.includes(user.role);
    const isFaculty = user.role === 'Faculty' || user.role === 'Adviser';
    const items = isStaff ? assistantNavItems : (isFaculty ? facultyNavItems : studentNavItems);

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
                // error handling (ignore for now)
            }
        }

        fetchCount();
        // Poll every 60 seconds
        const pollInterval = setInterval(fetchCount, 60000);
        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    let navItems = items;

    if (isStaff) {
        // FIX: badge mapping should target "Thesis & Dissertations" (where Defense Request lives)
        navItems = assistantNavItems.map(item => {
            if (item.title === 'Thesis & Dissertations') {
                return {
                    ...item,
                    indicator: defenseRequestCount > 0,
                    subItems: item.subItems?.map(sub =>
                        sub.title === 'Defense Request'
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
