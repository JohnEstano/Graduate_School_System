import React, { useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { MainNavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface NavMainProps {
  items: MainNavItem[];
}

export function NavMain({ items = [] }: NavMainProps) {
  const page = usePage();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setOpenMap((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Graduate School</SidebarGroupLabel>
      <SidebarMenu> 
        {items.map((item) => {
          const isActive = item.href === page.url;
          const hasSubs = !!item.subItems?.length;
          const isOpen = Boolean(openMap[item.title]);

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
                    <button className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch
                      className="w-full flex items-center gap-2"
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {hasSubs && isOpen && (
                <div className="flex ml-6 mt-1">
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <div className="flex flex-col space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = sub.href === page.url;
                      return (
                        <SidebarMenuItem key={sub.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isSubActive}
                            tooltip={undefined}
                          >
                            <Link
                              href={sub.href}
                              prefetch
                              className="block text-sm py-1"
                            >
                              {sub.title}
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
