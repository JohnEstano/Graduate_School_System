import React from "react";
import { Paperclip, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

type FileAttachment = {
    id: number;
    defense_title: string;
    defense_type?: string; // <-- Add this
    field: string;
    label: string;
    filename: string;
    path: string;
    url: string;
    size: number | null;
    submitted_at?: string;
};

type Props = {
    files: FileAttachment[];
};

function formatLabel(label: string) {
    // Replace "Proposal" with "Manuscript" (case-insensitive)
    return label.replace(/proposal/i, "Manuscript");
}

function getFileExtension(filename: string) {
    const match = filename.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toUpperCase() : "";
}

// Helper to group files by thesis title
function groupBy<T>(arr: T[], key: (item: T) => string) {
    return arr.reduce((acc, item) => {
        const k = key(item);
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

export default function ShowAllDocuments({ files }: Props) {
    if (!files.length) {
        return <div className="text-center text-muted-foreground">No attachments submitted yet.</div>;
    }

    // Group files by thesis title
    const grouped = groupBy(files, f => f.defense_title);

    return (
        <div className="flex flex-col gap-10">
            {Object.entries(grouped).map(([title, groupFiles], idx) => (
                <div key={title}>
                    {/* Thesis Title and Defense Type Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{title}</h2>
                        {/* Use the first file's defense_type as badge */}
                        {groupFiles[0].defense_type && (
                            <span className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {groupFiles[0].defense_type}
                            </span>
                        )}
                    </div>
                    {/* Cards Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {groupFiles.map((file, i) => (
                            <div
                                key={i}
                                className="relative flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 transition-shadow hover:shadow-lg group min-h-[180px] aspect-[0.85/1] overflow-hidden justify-between"
                            >
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 z-10"
                                    title="View"
                                    tabIndex={0}
                                    aria-label={`View ${formatLabel(file.label)}`}
                                />
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 z-20">
                                    <div className="flex flex-col min-w-0">
                                        <div
                                            className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[120px]"
                                            title={formatLabel(file.label)}
                                        >
                                            {formatLabel(file.label)}
                                        </div>
                                        <div
                                            className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]"
                                            title={file.filename}
                                        >
                                            {file.filename}
                                        </div>
                                    </div>
                                    <Paperclip className="w-5 h-5 text-zinc-400 ml-2 flex-shrink-0" />
                                </div>
                                {/* Footer */}
                                <div className="border-t border-zinc-200 dark:border-zinc-700 px-2 py-2 flex flex-col gap-1 z-20 relative mt-auto">
                                    <div className="flex justify-between items-center gap-1">
                                        <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300">
                                            {getFileExtension(file.filename)}
                                        </span>
                                        <div className="flex gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-500 hover:text-zinc-900"
                                                tabIndex={0}
                                            >
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="View"
                                                    onClick={e => e.stopPropagation()}
                                                    tabIndex={0}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-500 hover:text-zinc-900"
                                                tabIndex={0}
                                            >
                                                <a
                                                    href={file.url}
                                                    download={file.filename}
                                                    title="Download"
                                                    onClick={e => e.stopPropagation()}
                                                    tabIndex={0}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 text-right mt-1">
                                        {file.submitted_at ? `Submitted ${dayjs(file.submitted_at).format("MMM D, YYYY h:mm A")}` : ""}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Separator between thesis sections */}
                    {idx < Object.entries(grouped).length - 1 && (
                        <hr className="my-8 border-zinc-300 dark:border-zinc-700" />
                    )}
                </div>
            ))}
        </div>
    );
}