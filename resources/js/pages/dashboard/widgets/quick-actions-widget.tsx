import { CalendarDays, Users, Receipt, Settings } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"; // Adjust import path as needed

const actions = [
    {
        label: "Schedules",
        href: "/schedules",
        icon: <CalendarDays className="size-5 text-white" size={20} />,
        bg: "bg-rose-500",
    },
    {
        label: "Student Records",
        href: "/students",
        icon: <Users className="size-5 text-white" size={20} />,
        bg: "bg-rose-500",
    },
    {
        label: "Honorarium Summary",
        href: "/honorarium",
        icon: <Receipt className="size-5 text-white" size={20} />,
        bg: "bg-rose-500",
    },
    {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="size-5 text-gray-600" size={20} />,
        bg: "bg-blue-50",
    },
];

export default function QuickActionsWidget() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="flex gap-4">
                {actions.map((action) => (
                    <Tooltip key={action.label}>
                        <TooltipTrigger asChild>
                            <Link
                                href={action.href}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <span
                                    className={`rounded-full ${action.bg} flex items-center justify-center w-10 h-10 transition group-hover:scale-105`}
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