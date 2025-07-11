import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MainNavItem, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Bell, FileText, CreditCard, CalendarSync} from 'lucide-react';
import AppLogo from './app-logo';


const mainNavItems: MainNavItem[] = [
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

            {
                title: 'Comprehensive Exam',
                href: '/comprehensive-exam',
               
            },
            {
                title: 'Defense Requests',
                href: '/defense-requests',

            }
        ]
    },
    {
        title: 'Payment',
        href: '/payment',
        icon: CreditCard,
    },
  
       {
        title: 'Schedule',
        href: '/schedule',
        icon: CalendarSync,
    },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
    },
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="offcanvas" className='px-3 pt-5' variant="inset">
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
