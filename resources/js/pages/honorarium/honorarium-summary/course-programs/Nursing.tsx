import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React from 'react';

// This interface is the same for all department pages
interface DepartmentPageProps {
    departmentName: string;
    departmentSlug: string;
}

// The component name matches the filename (PascalCase)
const NursingPage: React.FC<DepartmentPageProps> = ({ departmentName, departmentSlug }) => {
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Honorarium', href: '/honorarium' },
        { title: 'Honorarium Search', href: '/honorarium-search' },
        {
            title: departmentName, // This will correctly show "Nursing"
            href: `/honorarium/${departmentSlug}`,
            isActive: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${departmentName} Honorarium`} />

            <div className="bg-white shadow-sm rounded-lg p-6 mt-4">
                <div className="border-b border-gray-200 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {departmentName}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Honorarium records and management for the Nursing department.
                    </p>
                </div>
                 <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Department Overview</h2>
                    <p className="text-gray-600">
                        This is the main content area for the {departmentName} department. 
                    </p>
                </div>
            </div>
        </AppLayout>
    );
};

// Export the component so Inertia can use it
export default NursingPage;
