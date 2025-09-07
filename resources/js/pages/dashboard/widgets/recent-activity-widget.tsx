import React from 'react';

type RecentActivityWidgetProps = {
    activities: string[];
};

export default function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
            <ul className="list-disc pl-5 space-y-1">
                {activities.length === 0 ? (
                    <li className="text-gray-500">No recent activity.</li>
                ) : (
                    activities.map((activity, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-200">{activity}</li>
                    ))
                )}
            </ul>
        </div>
    );
}