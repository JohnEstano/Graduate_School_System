import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { BadgeDollarSign, BookOpen, Receipt, Settings, User2, Users } from 'lucide-react';

type Props = {
    userRole?: string;
};

const STUDENT_ACTIONS = [
    {
        label: 'Academic Records',
        href: '/academic-records',
        icon: <BookOpen className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Payments',
        href: '/payments',
        icon: <Receipt className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
];

const ADMIN_ACTIONS = [
    {
        label: 'Payments',
        href: '/payments',
        icon: <Receipt className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Honorariums',
        href: '/honorariums',
        icon: <BadgeDollarSign className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Panelists',
        href: '/panelists',
        icon: <Users className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
];

const Adviser_ACTIONS = [
    {
        label: 'My Students',
        href: '/adviser/students-list',
        icon: <User2 className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="size-5 font-extrabold text-zinc-800 dark:text-zinc-100" size={20} />,
    },
];

const MANAGE_ROLES = ['Coordinator', 'Dean', 'Administrative Assistant'];

export default function QuickActionsWidget({ userRole }: Props) {
    let actions;
    if (userRole === 'Adviser') {
        actions = Adviser_ACTIONS;
    } else if (MANAGE_ROLES.includes(userRole || '')) {
        actions = ADMIN_ACTIONS;
    } else {
        actions = STUDENT_ACTIONS;
    }

    return (
        <div className="rounded-xl p-2 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="flex justify-center gap-1 md:gap-1">
                {actions.map((action) => (
                    <Tooltip key={action.label}>
                        <TooltipTrigger asChild>
                            <Link href={action.href} className="group flex flex-col items-center gap-1">
                                <span className="flex h-10 w-10 items-center justify-center">{action.icon}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="border-none bg-black text-white shadow-lg">
                            {action.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}
