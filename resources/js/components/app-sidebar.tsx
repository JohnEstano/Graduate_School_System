import { usePage, Link } from '@inertiajs/react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavFooter } from '@/components/nav-footer'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { MainNavItem, type NavItem } from '@/types'
import { LayoutGrid, FileText, Bell, CalendarSync, CreditCard, MessageSquareText, DollarSign , Users, File} from 'lucide-react'
import AppLogo from './app-logo'

type PageProps = {
    auth: {
        user: {
            id: number
            name: string
            role: string
        }
    }
}

const studentNavItems: MainNavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid
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
        icon: CreditCard
    },
    {
        title: 'Schedules',
        href: '/schedule',
        icon: CalendarSync
    },
    {
        title: 'Notifications',
        href: '/notification',
        icon: Bell
    },
]

const assistantNavItems: MainNavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Requests', href: '/requests', icon: File },
    {
        title: 'Honorarium',
        href: '/honorarium',
        icon: DollarSign,
        subItems: [
            { title: 'Honorarium Summary', href: '/honorarium-summary' },
            { title: 'Generate Report', href: '/generate-report' },
        ]

    },
    { title: 'Student Records', href: '/student-records', icon: Users },
    { title: 'Messaging', href: '/messaging', icon: MessageSquareText },
    { title: 'Notifications', href: '/notifications', icon: Bell },

]

const footerNavItems: NavItem[] = []

export function AppSidebar() {
    const {
        auth: { user },
    } = usePage<PageProps>().props
    const items =
        user.role === 'Administrative Assistant'
            ? assistantNavItems
            : studentNavItems

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
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
