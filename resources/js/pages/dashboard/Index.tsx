import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';

import AssistantDashboard from './dashboard-layouts/assistant-dashboard';
import CoordinatorDashboard from './dashboard-layouts/coordinator-dashboard';
import DeanDashboard from './dashboard-layouts/dean-dashboard';
import StudentDashboard from './dashboard-layouts/student-dashboard';
import FacultyDashboard from './dashboard-layouts/faculty-dashboard';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        };
    };
};

export default function DashboardIndex() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;

    let ComponentToRender: React.FC<{ user: { name: string; role: string } }>;
    // Prefer effective_role (computed server-side) when available
    const activeRole = (user as any)?.effective_role || user.role;

    switch (activeRole) {
        case 'Student':
            ComponentToRender = StudentDashboard;
            break;
        case 'Administrative Assistant':
        case 'Assistant':
            ComponentToRender = AssistantDashboard;
            break;
        case 'Coordinator':
            ComponentToRender = CoordinatorDashboard;
            break;
        case 'Dean':
            ComponentToRender = DeanDashboard;
            break;
        case 'Faculty':
            ComponentToRender = FacultyDashboard;
            break;
        default:
            ComponentToRender = () => (
                <div className="p-6 text-amber-600">
                    <p className="font-medium">Limited Access</p>
                    <p className="text-sm text-gray-500">Your role "{activeRole}" does not yet have a dedicated dashboard.</p>
                </div>
            );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <ComponentToRender user={user} />
        </AppLayout>
    );
}
