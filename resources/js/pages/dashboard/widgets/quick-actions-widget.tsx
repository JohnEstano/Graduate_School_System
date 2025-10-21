import { CalendarDays, Receipt, Settings, BookOpen, User2, BadgeDollarSign, Users } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {
    userRole?: string;
};

const STUDENT_ACTIONS = [
    {
        label: "Academic Records",
        href: "/academic-records",
        icon: <BookOpen className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Payments",
        href: "/payments",
        icon: <Receipt className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
];

const ADMIN_ACTIONS = [
    {
        label: "Payments",
        href: "/payments",
        icon: <Receipt className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Honorariums",
        href: "/honorariums",
        icon: <BadgeDollarSign className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Panelists",
        href: "/panelists",
        icon: <Users className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
];

const FACULTY_ACTIONS = [
    {
        label: "My Students",
        href: "/adviser/students-list",
        icon: <User2 className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="size-5 text-zinc-800 dark:text-zinc-100 font-extrabold" size={20} />,
    },
];

const MANAGE_ROLES = ["Coordinator", "Dean", "Administrative Assistant"];

export default function QuickActionsWidget({ userRole }: Props) {
    let actions;
    if (userRole === "Faculty") {
        actions = FACULTY_ACTIONS;
    } else if (MANAGE_ROLES.includes(userRole || "")) {
        actions = ADMIN_ACTIONS;
    } else {
        actions = STUDENT_ACTIONS;
    }

    return (
        <div className="dark:bg-zinc-900 rounded-xl p-2">
            <h2 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="flex gap-1 md:gap-1 justify-center">
                {actions.map((action) => (
                    <Tooltip key={action.label}>
                        <TooltipTrigger asChild>
                            <Link
                                href={action.href}
                                className="flex flex-col items-center gap-1 group"
                            >
                                <span
                                    className="flex items-center justify-center w-10 h-10"
                                >
                                    {action.icon}
                                </span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent
                            side="bottom"
                            className="bg-black text-white border-none shadow-lg"
                        >
                            {action.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}