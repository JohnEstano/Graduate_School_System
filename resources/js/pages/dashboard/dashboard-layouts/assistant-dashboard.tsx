import { usePage } from '@inertiajs/react';
import { CircleEllipsis, Ellipsis, EllipsisVertical, Users, CalendarDays, ClipboardList, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UnifiedDashboardLayout from '../components/unified-dashboard-layout';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    stats?: {
        pending_applications: number;
        pending_defense_requests: number;
        pending_payments: number;
        upcoming_deadlines: number;
    };
};

export default function AssistantDashboard() {
    const {
        auth: { user },
        stats = {
            pending_applications: 0,
            pending_defense_requests: 0,
            pending_payments: 0,
            upcoming_deadlines: 0
        }
    } = usePage<PageProps>().props;

    return (
        <UnifiedDashboardLayout user={user}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                        <Ellipsis className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_applications}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Defense Requests</CardTitle>
                        <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_defense_requests}</div>
                        <p className="text-xs text-muted-foreground">Needs processing</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Confirmations</CardTitle>
                        <CircleEllipsis className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_payments}</div>
                        <p className="text-xs text-muted-foreground">Require verification</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                        <CircleEllipsis className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.upcoming_deadlines}</div>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <Users className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Review Applications</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <ClipboardList className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Process Requests</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <DollarSign className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Verify Payments</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <CalendarDays className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Manage Schedules</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </UnifiedDashboardLayout>
    );
}
