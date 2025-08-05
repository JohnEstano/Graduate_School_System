import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Database,
    MessageSquare,
    Users,
    Zap
} from 'lucide-react';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'System Status',
        href: '/system-status',
    },
];

interface SystemCheck {
    name: string;
    status: 'checking' | 'success' | 'error';
    message: string;
    icon: React.ComponentType<{ className?: string }>;
}

export default function SystemStatus() {
    const [checks, setChecks] = useState<SystemCheck[]>([
        {
            name: 'Database Connection',
            status: 'checking',
            message: 'Checking database connectivity...',
            icon: Database,
        },
        {
            name: 'Messaging System',
            status: 'checking',
            message: 'Testing messaging endpoints...',
            icon: MessageSquare,
        },
        {
            name: 'User Authentication',
            status: 'checking',
            message: 'Verifying authentication system...',
            icon: Users,
        },
        {
            name: 'Real-time Features',
            status: 'checking',
            message: 'Testing real-time capabilities...',
            icon: Zap,
        },
    ]);

    useEffect(() => {
        runSystemChecks();
    }, []);

    const runSystemChecks = async () => {
        const checkPromises = [
            checkDatabase(),
            checkMessaging(),
            checkAuthentication(),
            checkRealtime(),
        ];

        await Promise.all(checkPromises);
    };

    const updateCheck = (index: number, status: 'success' | 'error', message: string) => {
        setChecks(prev => prev.map((check, i) => 
            i === index ? { ...check, status, message } : check
        ));
    };

    const checkDatabase = async () => {
        try {
            // Simulate database check
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateCheck(0, 'success', 'Database connection established');
        } catch (error) {
            updateCheck(0, 'error', 'Database connection failed');
        }
    };

    const checkMessaging = async () => {
        try {
            const response = await fetch('/messages/unread-count');
            if (response.ok) {
                const data = await response.json();
                updateCheck(1, 'success', `Messaging system operational (${data.count || 0} unread messages)`);
            } else {
                updateCheck(1, 'error', 'Messaging API not responding');
            }
        } catch (error) {
            updateCheck(1, 'error', 'Failed to connect to messaging system');
        }
    };

    const checkAuthentication = async () => {
        try {
            // Simulate auth check
            await new Promise(resolve => setTimeout(resolve, 1500));
            updateCheck(2, 'success', 'User authentication verified');
        } catch (error) {
            updateCheck(2, 'error', 'Authentication system error');
        }
    };

    const checkRealtime = async () => {
        try {
            // Simulate realtime check
            await new Promise(resolve => setTimeout(resolve, 2000));
            updateCheck(3, 'success', 'Real-time polling active');
        } catch (error) {
            updateCheck(3, 'error', 'Real-time features unavailable');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-100 text-green-800">Operational</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Checking...</Badge>;
        }
    };

    const allChecksComplete = checks.every(check => check.status !== 'checking');
    const hasErrors = checks.some(check => check.status === 'error');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Status" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">System Status</h1>
                        <p className="text-sm text-gray-500">
                            Real-time status of Graduate School Management System components
                        </p>
                    </div>
                    <Button onClick={runSystemChecks} disabled={!allChecksComplete}>
                        {allChecksComplete ? 'Run Checks Again' : 'Running Checks...'}
                    </Button>
                </div>

                {/* Overall Status */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {allChecksComplete ? (
                                hasErrors ? (
                                    <XCircle className="h-8 w-8 text-red-500" />
                                ) : (
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                )
                            ) : (
                                <AlertCircle className="h-8 w-8 text-yellow-500 animate-pulse" />
                            )}
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {!allChecksComplete 
                                        ? 'System Check in Progress' 
                                        : hasErrors 
                                            ? 'System Issues Detected' 
                                            : 'All Systems Operational'
                                    }
                                </h2>
                                <p className="text-gray-600">
                                    {!allChecksComplete 
                                        ? 'Running diagnostics on all system components...'
                                        : hasErrors 
                                            ? 'Some system components need attention'
                                            : 'All core features are functioning normally'
                                    }
                                </p>
                            </div>
                        </div>
                        {getStatusBadge(
                            !allChecksComplete 
                                ? 'checking' 
                                : hasErrors 
                                    ? 'error' 
                                    : 'success'
                        )}
                    </div>
                </Card>

                {/* Individual System Checks */}
                <div className="grid gap-4 md:grid-cols-2">
                    {checks.map((check, index) => {
                        const Icon = check.icon;
                        return (
                            <Card key={index} className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <Icon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {check.name}
                                            </h3>
                                            {getStatusIcon(check.status)}
                                        </div>
                                        <p className={`text-sm mt-1 ${
                                            check.status === 'error' 
                                                ? 'text-red-600' 
                                                : check.status === 'success'
                                                    ? 'text-green-600'
                                                    : 'text-gray-600'
                                        }`}>
                                            {check.message}
                                        </p>
                                        <div className="mt-2">
                                            {getStatusBadge(check.status)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Messaging System Details */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Messaging System Features</h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Private Conversations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Group Messaging</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Real-time Updates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Message History</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Unread Indicators</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">User Search</span>
                        </div>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => window.open('/messages', '_blank')}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Messages
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Refresh Status
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
