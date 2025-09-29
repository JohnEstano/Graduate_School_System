import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Users, CalendarDays, ClipboardList, Settings, Mail, UserCheck, BookOpen, Shield, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "@inertiajs/react";

type ActiveUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    last_activity: string;
    is_online: boolean;
};

type Program = {
    id: number;
    name: string;
    code: string;
    coordinator_id: number;
    coordinator_name: string;
    status: 'active' | 'inactive';
    students_count: number;
    created_at: string;
};

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    activeUsers?: ActiveUser[];
    allUsers?: any[];
    programs?: Program[];
    coordinators?: any[];
    stats?: {
        total_users: number;
        active_sessions: number;
        total_programs: number;
        pending_requests: number;
    };
};

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

export default function SuperAdminDashboard() {
    const {
        auth: { user },
        activeUsers = [],
        allUsers = [],
        programs = [],
        coordinators = [],
        stats = { total_users: 0, active_sessions: 0, total_programs: 0, pending_requests: 0 }
    } = usePage<PageProps>().props;

    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [newProgram, setNewProgram] = useState({
        name: '',
        code: '',
        coordinator_id: '',
        description: ''
    });
    const [notification, setNotification] = useState({
        recipient_type: 'all',
        subject: '',
        message: '',
        recipient_roles: []
    });

    // Dashboard header with greeting
    const greeting = isDaytime() ? 'Good morning' : 'Good evening';

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-auto rounded-xl pt-6 pr-7 pl-7 pb-6">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {greeting}, {user?.name ?? 'Super Admin'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getFormattedDate()} • System Administrator
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDaytime() ? (
                            <Sun className="size-6 text-yellow-500" />
                        ) : (
                            <Moon className="size-6 text-blue-400" />
                        )}
                    </div>
                </div>
                <Separator />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_users}</div>
                        <p className="text-xs text-muted-foreground">All registered accounts</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_sessions}</div>
                        <p className="text-xs text-muted-foreground">Currently online users</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Programs</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_programs}</div>
                        <p className="text-xs text-muted-foreground">Active programs</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_requests}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
                <button
                    onClick={() => setSelectedTab('overview')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTab === 'overview'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setSelectedTab('users')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTab === 'users'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setSelectedTab('programs')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTab === 'programs'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Programs
                </button>
                <button
                    onClick={() => setSelectedTab('notifications')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTab === 'notifications'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Notifications
                </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Users Monitor */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Active Users Monitor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {activeUsers.slice(0, 5).map((user) => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.role}</p>
                                            </div>
                                        </div>
                                        <Badge variant={user.is_online ? 'default' : 'secondary'}>
                                            {user.is_online ? 'Online' : 'Offline'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedTab('users')}>
                                View All Users
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Programs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Recent Programs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {programs.slice(0, 5).map((program) => (
                                    <div key={program.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{program.name}</p>
                                            <p className="text-xs text-muted-foreground">{program.coordinator_name}</p>
                                        </div>
                                        <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                            {program.students_count} students
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedTab('programs')}>
                                Manage Programs
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedTab === 'users' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            User Monitoring & Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">All System Users</h3>
                                <Badge variant="outline">{allUsers.length} Total Users</Badge>
                            </div>
                            
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>Role</div>
                                    <div>Status</div>
                                    <div>Last Active</div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {allUsers.map((user, index) => (
                                        <div key={user.id} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div>
                                                <Badge variant="secondary">{user.role}</Badge>
                                            </div>
                                            <div>
                                                <Badge variant={user.is_online ? 'default' : 'outline'}>
                                                    {user.is_online ? 'Online' : 'Offline'}
                                                </Badge>
                                            </div>
                                            <div className="text-muted-foreground">
                                                {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedTab === 'programs' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Program Management
                                </CardTitle>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>Add New Program</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Program</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="program-name">Program Name</Label>
                                                <Input
                                                    id="program-name"
                                                    value={newProgram.name}
                                                    onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                                                    placeholder="e.g., Master of Science in Computer Science"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="program-code">Program Code</Label>
                                                <Input
                                                    id="program-code"
                                                    value={newProgram.code}
                                                    onChange={(e) => setNewProgram({...newProgram, code: e.target.value})}
                                                    placeholder="e.g., MSCS"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="coordinator">Coordinator</Label>
                                                <Select value={newProgram.coordinator_id} onValueChange={(value) => setNewProgram({...newProgram, coordinator_id: value})}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select coordinator" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {coordinators.map((coordinator) => (
                                                            <SelectItem key={coordinator.id} value={coordinator.id.toString()}>
                                                                {coordinator.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    value={newProgram.description}
                                                    onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                                                    placeholder="Program description..."
                                                />
                                            </div>
                                            <Button className="w-full">Create Program</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-6 gap-4 p-4 bg-muted font-medium text-sm">
                                    <div>Program Name</div>
                                    <div>Code</div>
                                    <div>Coordinator</div>
                                    <div>Students</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {programs.map((program) => (
                                        <div key={program.id} className="grid grid-cols-6 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{program.name}</div>
                                            <div className="text-muted-foreground">{program.code}</div>
                                            <div>{program.coordinator_name}</div>
                                            <div>
                                                <Badge variant="outline">{program.students_count}</Badge>
                                            </div>
                                            <div>
                                                <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                                    {program.status}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline">Edit</Button>
                                                <Button size="sm" variant="destructive">Delete</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedTab === 'notifications' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Send Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="recipient-type">Recipients</Label>
                                <Select value={notification.recipient_type} onValueChange={(value) => setNotification({...notification, recipient_type: value})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="students">Students Only</SelectItem>
                                        <SelectItem value="faculty">Faculty Only</SelectItem>
                                        <SelectItem value="coordinators">Coordinators Only</SelectItem>
                                        <SelectItem value="staff">Staff Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={notification.subject}
                                    onChange={(e) => setNotification({...notification, subject: e.target.value})}
                                    placeholder="Email subject line"
                                />
                            </div>
                            <div>
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={notification.message}
                                    onChange={(e) => setNotification({...notification, message: e.target.value})}
                                    placeholder="Enter your message here..."
                                    rows={6}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1">Send Notification</Button>
                                <Button variant="outline">Save as Draft</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                            <Link href="/super-admin/users">
                                <Users className="h-6 w-6" />
                                Manage Users
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                            <Link href="/super-admin/programs">
                                <BookOpen className="h-6 w-6" />
                                Programs
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                            <Link href="/super-admin/logs">
                                <Activity className="h-6 w-6" />
                                System Logs
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                            <Link href="/super-admin/settings">
                                <Settings className="h-6 w-6" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}