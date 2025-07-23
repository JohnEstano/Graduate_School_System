import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';

import AssistantDashboard from './dashboard-layouts/assistant-dashboard';
import CoordinatorDashboard from './dashboard-layouts/coordinator-dashboard';
import DeanDashboard from './dashboard-layouts/dean-dashboard';
import StudentDashboard from './dashboard-layouts/student-dashboard';

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

    switch (user.role) {
        case 'Student':
            ComponentToRender = StudentDashboard;
            break;
        case 'Administrative Assistant':
            ComponentToRender = AssistantDashboard;
            break;
        case 'Coordinator':
            ComponentToRender = CoordinatorDashboard;
            break;
        case 'Dean':
            ComponentToRender = DeanDashboard;
            break;
        default:
            ComponentToRender = () => <div className="p-6 text-red-600">Unauthorized role: {user.role}</div>;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <ComponentToRender user={user} />
        </AppLayout>
    );
}
