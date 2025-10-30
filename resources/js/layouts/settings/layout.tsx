import React, { PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';

type NavItem = { title:string; href:string; roles?:string[] };


// Role-based settings navigation logic
// Student: hide General and E‑Signatures
// Coordinator/Dean: show Document Templates for esignatures
// AA: hide Document Templates, E‑Signatures, and General
const baseNav: NavItem[] = [
  { title:'Profile',    href:'/settings/profile' },
  { title:'General',    href:'/settings/general', roles:['Coordinator','Adviser','Faculty'] },
 // { title:'Password',   href:'/settings/password' },
  { title:'Appearance', href:'/settings/appearance' },
];

const extraNav: NavItem[] = [
  //{ title:'Document Templates', href:'/settings/documents', roles:['Dean','Coordinator'] },
  { title:'E‑Signatures',       href:'/settings/signatures', roles:['Dean','Coordinator','Adviser','Faculty'] },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
  const page = usePage();
  const role = (page.props as any)?.auth?.user?.role;
  // Only filter links by role for those that specify roles
  let items = [...baseNav, ...extraNav];
  if (role === 'Student') {
    // Hide General and E‑Signatures for students
    items = items.filter(i => i.title !== 'General' && i.title !== 'E‑Signatures' && i.title !== 'Document Templates');
  } else if (role === 'Administrative Assistant' || role === 'AA') {
    // Hide Document Templates, E‑Signatures, and General for AA
    items = items.filter(i => i.title !== 'Document Templates' && i.title !== 'E‑Signatures' && i.title !== 'General');
  } else if (role === 'Coordinator' || role === 'Dean') {
    // Show Document Templates for esignatures (already included by roles)
    items = items.filter(i => i.title !== 'Password'); // Optionally hide password for these roles
  } else {
    // For Adviser/Faculty, show General and E‑Signatures, hide Document Templates
    items = items.filter(i => i.title !== 'Document Templates');
  }
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
                    'px-3 py-2 rounded-md text-sm font-medium',
                    'text-zinc dark:text-white',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    active
                      ? 'bg-zinc-100 dark:bg-zinc-700 font-medium text-zinc-900 dark:text-zinc-100'
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
