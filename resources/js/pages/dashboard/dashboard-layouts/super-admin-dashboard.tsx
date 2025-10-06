import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Moon, Users, CalendarDays, ClipboardList, Settings, Mail, UserCheck, BookOpen, Shield, Database, GraduationCap } from 'lucide-react';
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

type Program = {
    id: number | string;
    name: string;
    code: string;
    coordinator_id: number;
    coordinator_name: string;
    coordinator_email: string;
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
    allUsers?: any[];
    programs?: Program[];
    coordinators?: any[];
    stats?: {
        total_users: number;
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
        allUsers = [],
        programs = [],
        coordinators = [],
        stats = { total_users: 0, total_programs: 0, pending_requests: 0 }
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
                <button
                    onClick={() => setSelectedTab('coordinators')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        selectedTab === 'coordinators'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Coordinators
                </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                User Management Dashboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{allUsers.filter(u => u.role === 'Student').length}</div>
                                    <div className="text-sm text-muted-foreground">Students</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{allUsers.filter(u => u.role === 'Faculty').length}</div>
                                    <div className="text-sm text-muted-foreground">Faculty</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{allUsers.filter(u => u.role === 'Coordinator').length}</div>
                                    <div className="text-sm text-muted-foreground">Coordinators</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">{allUsers.filter(u => u.role === 'Administrative Assistant').length}</div>
                                    <div className="text-sm text-muted-foreground">Admin Assistants</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{allUsers.filter(u => u.role === 'Dean').length}</div>
                                    <div className="text-sm text-muted-foreground">Deans</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-600">{allUsers.filter(u => !['Student', 'Faculty', 'Coordinator', 'Administrative Assistant', 'Dean'].includes(u.role)).length}</div>
                                    <div className="text-sm text-muted-foreground">Others</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                Students ({allUsers.filter(u => u.role === 'Student').length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-950 font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>School ID</div>
                                    <div>Program</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {allUsers.filter(u => u.role === 'Student').map((user) => (
                                        <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.program || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'Student').length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No students found</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Faculty Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-green-600" />
                                Faculty ({allUsers.filter(u => u.role === 'Faculty').length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-4 p-4 bg-green-50 dark:bg-green-950 font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>School ID</div>
                                    <div>Program</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {allUsers.filter(u => u.role === 'Faculty').map((user) => (
                                        <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.program || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'Faculty').length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No faculty found</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coordinators Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-600" />
                                Coordinators ({allUsers.filter(u => u.role === 'Coordinator').length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-4 p-4 bg-purple-50 dark:bg-purple-950 font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>Program</div>
                                    <div>School ID</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {allUsers.filter(u => u.role === 'Coordinator').map((user) => (
                                        <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div className="text-muted-foreground">{user.program || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'Coordinator').length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No coordinators found</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Administrative Assistants Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-orange-600" />
                                Administrative Assistants ({allUsers.filter(u => u.role === 'Administrative Assistant').length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-4 p-4 bg-orange-50 dark:bg-orange-950 font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>School ID</div>
                                    <div>Program</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {allUsers.filter(u => u.role === 'Administrative Assistant').map((user) => (
                                        <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.program || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'Administrative Assistant').length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No administrative assistants found</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deans Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-red-600" />
                                Deans ({allUsers.filter(u => u.role === 'Dean').length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-4 p-4 bg-red-50 dark:bg-red-950 font-medium text-sm">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>School ID</div>
                                    <div>Program</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {allUsers.filter(u => u.role === 'Dean').map((user) => (
                                        <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{user.name || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.email}</div>
                                            <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                            <div className="text-muted-foreground">{user.program || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'Dean').length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground">No deans found</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Roles Section */}
                    {allUsers.filter(u => !['Student', 'Faculty', 'Coordinator', 'Administrative Assistant', 'Dean'].includes(u.role)).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-gray-600" />
                                    Other Roles ({allUsers.filter(u => !['Student', 'Faculty', 'Coordinator', 'Administrative Assistant', 'Dean'].includes(u.role)).length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-950 font-medium text-sm">
                                        <div>Name</div>
                                        <div>Email</div>
                                        <div>Role</div>
                                        <div>School ID</div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {allUsers.filter(u => !['Student', 'Faculty', 'Coordinator', 'Administrative Assistant', 'Dean'].includes(u.role)).map((user) => (
                                            <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-t text-sm">
                                                <div className="font-medium">{user.name || 'N/A'}</div>
                                                <div className="text-muted-foreground">{user.email}</div>
                                                <div>
                                                    <Badge variant="secondary">{user.role}</Badge>
                                                </div>
                                                <div className="text-muted-foreground">{user.school_id || 'N/A'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
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
                                <div className="grid grid-cols-7 gap-4 p-4 bg-muted font-medium text-sm">
                                    <div>Program Name</div>
                                    <div>Code</div>
                                    <div>Coordinator</div>
                                    <div>Email</div>
                                    <div>Students</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {programs.map((program) => (
                                        <div key={program.id} className="grid grid-cols-7 gap-4 p-4 border-t text-sm">
                                            <div className="font-medium">{program.name}</div>
                                            <div className="text-muted-foreground font-mono text-xs">{program.code}</div>
                                            <div className="font-medium text-blue-600">{program.coordinator_name}</div>
                                            <div className="text-muted-foreground text-xs">{program.coordinator_email}</div>
                                            <div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {program.students_count} students
                                                </Badge>
                                            </div>
                                            <div>
                                                <Badge variant={program.status === 'active' ? 'default' : 'secondary'} 
                                                       className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                    {program.status}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                                    View
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {programs.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p>No programs found</p>
                                    </div>
                                )}
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

            {/* Coordinator Assignments Tab */}
            {selectedTab === 'coordinators' && (
                <CoordinatorAssignmentsManager />
            )}
        </div>
    );
}

// Coordinator Assignments Manager Component
function CoordinatorAssignmentsManager() {
    const [assignments, setAssignments] = React.useState([]);
    const [coordinators, setCoordinators] = React.useState([]);
    const [programs, setPrograms] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddDialog, setShowAddDialog] = React.useState(false);
    const [newAssignment, setNewAssignment] = React.useState({
        coordinator_user_id: '',
        program_name: '',
        notes: ''
    });

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assignmentsRes, coordinatorsRes, programsRes] = await Promise.all([
                fetch('/api/coordinator-assignments'),
                fetch('/api/coordinator-assignments/coordinators'),
                fetch('/api/coordinator-assignments/programs')
            ]);

            const assignmentsData = await assignmentsRes.json();
            const coordinatorsData = await coordinatorsRes.json();
            const programsData = await programsRes.json();

            setAssignments(assignmentsData.assignments || []);
            setCoordinators(coordinatorsData.coordinators || []);
            setPrograms(programsData.programs || []);
        } catch (error) {
            console.error('Error loading coordinator assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssignment = async () => {
        if (!newAssignment.coordinator_user_id || !newAssignment.program_name) {
            alert('Please select both coordinator and program');
            return;
        }

        try {
            const response = await fetch('/api/coordinator-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(newAssignment)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Program assigned successfully!');
                setShowAddDialog(false);
                setNewAssignment({ coordinator_user_id: '', program_name: '', notes: '' });
                loadData();
            } else {
                alert(data.error || 'Failed to assign program');
            }
        } catch (error) {
            console.error('Error adding assignment:', error);
            alert('Failed to assign program. Please try again.');
        }
    };

    const handleRemoveAssignment = async (id: number) => {
        if (!confirm('Are you sure you want to remove this program assignment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/coordinator-assignments/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Assignment removed successfully!');
                loadData();
            } else {
                alert(data.error || 'Failed to remove assignment');
            }
        } catch (error) {
            console.error('Error removing assignment:', error);
            alert('Failed to remove assignment. Please try again.');
        }
    };

    // Group assignments by coordinator
    const assignmentsByCoordinator = assignments.reduce((acc: any, assignment: any) => {
        const key = assignment.coordinator_id;
        if (!acc[key]) {
            acc[key] = {
                coordinator: assignment.coordinator_name,
                email: assignment.coordinator_email,
                programs: []
            };
        }
        acc[key].programs.push(assignment);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Coordinator Program Assignments</CardTitle>
                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Program
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Assign Program to Coordinator</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="coordinator">Coordinator</Label>
                                        <Select
                                            value={newAssignment.coordinator_user_id}
                                            onValueChange={(value) => setNewAssignment({...newAssignment, coordinator_user_id: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select coordinator..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {coordinators.map((coord: any) => (
                                                    <SelectItem key={coord.id} value={coord.id.toString()}>
                                                        {coord.name} ({coord.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="program">Program</Label>
                                        <Select
                                            value={newAssignment.program_name}
                                            onValueChange={(value) => setNewAssignment({...newAssignment, program_name: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select program..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs.map((program: string) => (
                                                    <SelectItem key={program} value={program}>
                                                        {program}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes (Optional)</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Add any notes about this assignment..."
                                            value={newAssignment.notes}
                                            onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                                            rows={3}
                                        />
                                    </div>
                                    <Button onClick={handleAddAssignment} className="w-full">
                                        Assign Program
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : Object.keys(assignmentsByCoordinator).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No coordinator assignments yet. Click "Assign Program" to get started.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.values(assignmentsByCoordinator).map((group: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">{group.coordinator}</h3>
                                            <p className="text-sm text-muted-foreground">{group.email}</p>
                                        </div>
                                        <Badge variant="secondary">{group.programs.length} programs</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {group.programs.map((assignment: any) => (
                                            <div key={assignment.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                                                <div className="flex-1">
                                                    <p className="font-medium">{assignment.program_name}</p>
                                                    {assignment.notes && (
                                                        <p className="text-sm text-muted-foreground">{assignment.notes}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Assigned {assignment.created_at} by {assignment.assigned_by_name}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}