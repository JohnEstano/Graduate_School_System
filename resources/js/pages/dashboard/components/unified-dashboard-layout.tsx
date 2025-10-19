import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface UnifiedDashboardLayoutProps {
    user: {
        name: string;
        role: string;
    } | null;
    children: React.ReactNode;
    customGreeting?: string;
}

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

export default function UnifiedDashboardLayout({ user, children, customGreeting }: UnifiedDashboardLayoutProps) {
    const greeting = customGreeting || (isDaytime() ? 'Good morning' : 'Good evening');
    
    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-auto rounded-xl pt-6 pr-7 pl-7 pb-6">
            {/* Unified Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {greeting}, {user?.name ?? 'User'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getFormattedDate()} • {user?.role ?? 'Role'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDaytime() ? (
                            <Sun className="size-6 text-yellow-500" />
                        ) : (
                            <Moon className="size-6 text-blue-400" />
                        )}
                    </div>
                </div>
                <Separator />
            </div>

            {/* Content Area */}
            {children}
        </div>
    );
}