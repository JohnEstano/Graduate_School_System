import { usePage } from '@inertiajs/react';
import { CircleEllipsis, Ellipsis, EllipsisVertical, Users, CalendarDays, ClipboardList, Award } from 'lucide-react';
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
        total_programs: number;
        pending_approvals: number;
        faculty_count: number;
        graduate_students: number;
    };
};

export default function DeanDashboard() {
    const {
        auth: { user },
        stats = {
            total_programs: 0,
            pending_approvals: 0,
            faculty_count: 0,
            graduate_students: 0
        }
    } = usePage<PageProps>().props;

    return (
        <UnifiedDashboardLayout user={user}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Academic Programs</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_programs}</div>
                        <p className="text-xs text-muted-foreground">Active programs</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <EllipsisVertical className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_approvals}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.faculty_count}</div>
                        <p className="text-xs text-muted-foreground">Active faculty</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Graduate Students</CardTitle>
                        <CircleEllipsis className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.graduate_students}</div>
                        <p className="text-xs text-muted-foreground">Enrolled students</p>
                    </CardContent>
                </Card>
            </div>

            {/* Executive Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Executive Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Academic Performance</p>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                                </div>
                                <span className="text-sm">85%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Faculty Satisfaction</p>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                                </div>
                                <span className="text-sm">92%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Program Completion</p>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '78%'}}></div>
                                </div>
                                <span className="text-sm">78%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions for Dean */}
            <Card>
                <CardHeader>
                    <CardTitle>Dean Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <Award className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Review Programs</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <Users className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Faculty Management</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <ClipboardList className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Final Approvals</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center hover:bg-muted cursor-pointer transition-colors">
                            <CalendarDays className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">Academic Calendar</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </UnifiedDashboardLayout>
    );
}
