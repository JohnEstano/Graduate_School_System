import React from "react";
import { usePage, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";
import ShowAllDocuments from "./show-all-documents";
import { GraduationCap } from "lucide-react";

type FileAttachment = {
    id: number;
    defense_title: string;
    field: string;
    label: string;
    filename: string;
    path: string;
    url: string;
    size: number | null;
    submitted_at?: string;
};

type PageProps = {
    files: FileAttachment[];
    auth: { user: { id: number; first_name: string; last_name: string; school_id: string } };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "My Documents", href: "/student/documents" },
];

export default function StudentDocumentsIndex() {
    const { props } = usePage<PageProps>();
    const { files } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Document Attachments" />
            <div className="flex flex-col px-7 pt-5 pb-5 w-full">
                {/* Header */}
                <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-6">
                    <div className="flex flex-row items-center justify-between w-full p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500 dark:border-rose-700">
                                <GraduationCap className="h-5 w-5 text-rose-400 dark:text-rose-300" />
                            </div>
                            <div>
                                <span className="text-base font-semibold dark:text-white">
                                    My Documents
                                </span>
                                <p className="block text-xs text-muted-foreground dark:text-zinc-400">
                                    This section shows all your submitted document attachments for defense requirements.
                                </p>
                            </div>
                        </div>
                        {/* Toolbar/filter row placeholder */}
                    </div>
                    {/* <div className="p-4">Toolbar/Filters row (optional)</div> */}
                </div>
                {/* Cards grid OUTSIDE the header */}
                <ShowAllDocuments files={files} />
            </div>
        </AppLayout>
    );
}