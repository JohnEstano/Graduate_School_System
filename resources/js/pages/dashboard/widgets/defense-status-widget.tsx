import React from 'react';
import { GraduationCap, Hourglass, Check, X, ChevronRight } from 'lucide-react';

type DefenseRequirement = {
    id: number;
    thesis_title: string;
    status: string;
};

type DefenseRequest = {
    status: string;
};

type Props = {
    defenseRequirement?: DefenseRequirement;
    defenseRequest?: DefenseRequest;
};

function getStatusInfo(req?: DefenseRequirement, request?: DefenseRequest) {
    if (!req) {
        return {
            status: "No Submission",
            statusIcon: <Hourglass className="h-4 w-4 text-gray-400" />,
            statusColor: "text-gray-400",
            thesisTitle: null,
        };
    }

    let status = "Pending Review";
    let statusIcon = <Hourglass className="h-4 w-4 text-yellow-600" />;
    let statusColor = "text-yellow-600";
    let thesisTitle = req.thesis_title;

    if (request) {
        const reqStatus = request.status?.toLowerCase();
        if (reqStatus === "approved") {
            status = "Approved";
            statusIcon = <Check className="h-4 w-4 text-green-600" />;
            statusColor = "text-green-600";
        } else if (reqStatus === "rejected") {
            status = "Rejected";
            statusIcon = <X className="h-4 w-4 text-rose-600" />;
            statusColor = "text-rose-600";
        }
    }

    return { status, statusIcon, statusColor, thesisTitle };
}

const DefenseStatusWidget: React.FC<Props> = ({ defenseRequirement, defenseRequest }) => {
    const info = getStatusInfo(defenseRequirement, defenseRequest);

    return (
        <div className="flex-1 border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-5 bg-white dark:bg-zinc-900 flex flex-col transition min-h-[220px]">
            {/* Header */}
            <a
                href="/defense-requirements"
                className="flex items-center justify-between mb-2 group cursor-pointer select-none"
                style={{ textDecoration: 'none' }}
            >
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Defense Status
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-rose-500 p-2">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </span>
                    <ChevronRight className="h-6 w-6 text-gray-400 transition-transform transition-colors duration-200 group-hover:text-rose-500 group-hover:translate-x-1" />
                </div>
            </a>
            {/* Table */}
            <div className="overflow-x-auto mt-2">
                <table className="min-w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 px-2 text-left font-medium text-gray-700 dark:text-gray-300">Thesis Title</th>
                            <th className="py-2 px-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-2 px-2 text-gray-500 dark:text-gray-400 truncate">
                                {info.thesisTitle || <span className="italic text-gray-400">None</span>}
                            </td>
                            <td className="py-2 px-2">
                                <span className={`flex items-center gap-2 ${info.statusColor}`}>
                                    {info.statusIcon}
                                    <span>{info.status}</span>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DefenseStatusWidget;