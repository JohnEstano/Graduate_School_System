import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { usePage, router } from '@inertiajs/react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const sidebar = useSidebar();
    const isCollapsed = sidebar?.state === 'collapsed';
    const { first_login } = usePage().props as { first_login?: boolean };

    // Check if this is a first login and trigger a page reload to get updated user data
    useEffect(() => {
        if (first_login) {
            console.log('First login detected - reloading to fetch updated user data...');
            // Use Inertia router to reload the page with fresh data
            setTimeout(() => {
                router.reload({ only: ['auth', 'user'] });
            }, 100);
        }
    }, [first_login]);

    // Sidebar width in px (match your sidebar.tsx)
    const SIDEBAR_WIDTH = 256; // 16rem = 256px

    // Use width, not just maxWidth
    const mainContentStyle = isCollapsed
        ? { width: '100vw', transition: 'width 0.3s' }
        : { width: `calc(100vw - ${SIDEBAR_WIDTH}px)`, transition: 'width 0.3s' };

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                className="transition-all duration-300 overflow-x-auto"
                variant="sidebar"
                style={mainContentStyle}
            >
                <div className="sticky top-0 z-30 bg-white border-b rounded-tl-lg rounded-tr-lg border-gray-200">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                </div>
                {children}
            </AppContent>
        </AppShell>
    );
}
