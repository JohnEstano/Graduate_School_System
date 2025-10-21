import { Separator } from '@/components/ui/separator';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MainNavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import React from 'react';

interface NavMainProps {
    items: MainNavItem[];
    expandedMenus: string[];
    setExpandedMenus: (menus: string[]) => void;
    sectionTitle?: string; // <-- add this
}

export function NavMain({ items = [], expandedMenus, setExpandedMenus, sectionTitle }: NavMainProps) {
    const page = usePage();

    const toggle = (title: string) => {
        const newMenus = expandedMenus.includes(title)
            ? expandedMenus.filter((t: string) => t !== title)
            : [...expandedMenus, title];
        setExpandedMenus(newMenus);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{sectionTitle || "Graduate School"}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = item.href === page.url;
                    const hasSubs = !!item.subItems?.length;
                    const isOpen = expandedMenus.includes(item.title);

                    return (
                        <React.Fragment key={item.title}>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    onClick={() => hasSubs && toggle(item.title)}
                                    tooltip={{ children: item.title }}
                                >
                                    {hasSubs ? (
                                        <button className="flex w-full items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                {item.icon && <item.icon className="size-4" />}
                                                {item.title}
                                                {item.indicator && (
                                                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                                )}
                                            </span>
                                            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                        </button>
                                    ) : (
                                        <Link href={item.href} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                {item.icon && <item.icon className="size-4" />}
                                                {item.title}
                                                {item.indicator && (
                                                    <span className="ml-1 w-1 h-1 rounded-full bg-zinc-500 inline-block" />
                                                )}
                                            </span>
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Submenu rendering */}
                            {hasSubs && isOpen && (
                                <div className="mt-1 ml-6 flex">
                                    <Separator orientation="vertical" className="mx-2 h-6" />
                                    <div className="flex flex-col space-y-1">
                                        {item.subItems!.map((sub) => {
                                            const isSubActive = sub.href === page.url;
                                            return (
                                                <SidebarMenuItem key={sub.title}>
                                                    <SidebarMenuButton asChild isActive={isSubActive} tooltip={undefined}>
                                                        <Link
                                                            href={sub.href}
                                                            className="flex items-center justify-between py-1"
                                                        >
                                                            <span>{sub.title}</span>
                                                            {sub.title === 'Defense Requests' && !!sub.count && (
                                                                <p className="ml-2 mr-2 text-xs text-rose-500 font-semibold">
                                                                    {sub.count}
                                                                </p>
                                                            )}
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
