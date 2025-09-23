import React, { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';

type NavItem = { title:string; href:string; roles?:string[] };

const baseNav: NavItem[] = [
  { title:'Profile',    href:'/settings/profile' },
  { title:'Password',   href:'/settings/password' },
  { title:'Appearance', href:'/settings/appearance' },
];

const extraNav: NavItem[] = [
  { title:'Document Templates', href:'/settings/documents', roles:['Dean','Coordinator'] },
  { title:'E‑Signatures',       href:'/settings/signatures' },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
  const page = usePage();
  const role = (page.props as any)?.auth?.user?.role;
  const items = [...baseNav, ...extraNav.filter(i => !i.roles || i.roles.includes(role))];
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <div className="px-4 py-6">
      <Heading title="Settings" description="Manage your profile and account settings" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="w-full max-w-xl lg:w-56">
          <nav className="flex flex-col space-y-1">
            {items.map(i => {
              const active = path === i.href || path.startsWith(i.href + '/');
              return (
                <a
                  key={i.href}
                  href={i.href}
                  className={[
                    'px-3 py-2 rounded text-sm transition-colors',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    active
                      ? 'bg-gray-200 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100'
                      : ''
                  ].join(' ')}
                >
                  {i.title}
                </a>
              );
            })}
          </nav>
        </aside>
        <Separator className="my-6 md:hidden" />
        <div className="flex-1 md:max-w-3xl">
          <section className="max-w-2xl space-y-10">{children}</section>
        </div>
      </div>
    </div>
  );
}
