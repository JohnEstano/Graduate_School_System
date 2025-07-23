import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
// 1. CRITICAL: Make sure 'Link' is imported from Inertia.
import { Head, Link } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Honorarium', href: '/honorarium' },
    { title: 'Honorarium Search', href: '/honorarium-search' },
];

interface DepartmentButton {
    id: number;
    label: string;
}

const ALL_DEPARTMENTS: DepartmentButton[] = [
    { id: 1, label: 'Information Technology' },
    { id: 2, label: 'Nursing' },
    { id: 3, label: 'MedTech' },
    { id: 4, label: 'Business' },
    { id: 5, label: 'Engineering' },
    { id: 6, label: 'Pharmacy' },
    { id: 7, label: 'Computer Science' },
    { id: 8, label: 'Music' },
    { id: 9, label: 'Education' },
];

const HonorariumSearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    const createSlug = (text: string) => {
        return text.toLowerCase().replace(/\s+/g, '-');
    };

    const filteredDepartments = useMemo(() => {
        if (!searchTerm) return ALL_DEPARTMENTS;
        return ALL_DEPARTMENTS.filter((button) =>
            button.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Honorarium Department Search" />
            <div className="max-w-4xl mx-auto">
                <div className="sticky top-0 z-10 bg-white mt-3 py-4 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search departments..."
                            className="w-96 pl-10 pr-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4 py-6">
                    {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((dept) => (
                            // 2. CRITICAL: This MUST be a <Link> component.
                            // In the browser, it will become an <a> tag.
                            <Link
                                key={dept.id}
                                href={`/honorarium/${createSlug(dept.label)}`}
                                className="flex items-center justify-center w-48 h-20 p-3 bg-blue-600 text-white text-center font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                            >
                                {dept.label}
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-500">No departments found.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

export default HonorariumSearch;
