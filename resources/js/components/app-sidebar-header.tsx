import { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Notifications from "@/components/notifications";
import { usePage } from '@inertiajs/react';
import type { Notification } from "@/types";

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const bellBtnRef = useRef<HTMLButtonElement>(null);

    const page = usePage<{ notifications?: Notification[]; unreadCount?: number }>();
    const unreadCount = typeof page.props.unreadCount === "number" ? page.props.unreadCount : 0;
    const notifications = Array.isArray(page.props.notifications) ? page.props.notifications : [];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
            if (bellBtnRef.current && bellBtnRef.current.contains(e.target as Node)) return;
            setOpen(false);
        }
        if (open) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [open]);

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 relative dark:bg-background dark:border-border">
            <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="mr-5 relative">
                    <Sheet>
                        <SheetTrigger>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Button
                                        ref={bellBtnRef}
                                        variant="ghost"
                                        className="h-8 w-8 p-3 rounded-full hover:bg-accent hover:scale-110 transition-transform duration-150 dark:text-muted-foreground dark:hover:bg-muted"
                                        aria-label="Show notifications"
                                    >
                                        <Bell className="size-5 stroke-[1.5]" />
                                    </Button>
                                    {unreadCount > 0 && (
                                        <span className="absolute text-white top-0 right-0 px-1 min-w-4 translate-x-1/5 translate-y-1/9 origin-center flex items-center justify-center rounded-full text-[10px] bg-rose-500 text-destructive-foreground dark:bg-rose-900 dark:text-rose-200">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </SheetTrigger>
                        <SheetContent className='w-[100px] sm:w-[340px] dark:bg-background dark:text-muted-foreground'>
                            <SheetHeader>
                                <SheetTitle>Notifications</SheetTitle>
                            </SheetHeader>
                            <Notifications notifications={notifications} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
