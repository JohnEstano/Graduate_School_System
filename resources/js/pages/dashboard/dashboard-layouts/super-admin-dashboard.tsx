import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Sun, Moon, Users, BookOpen, ClipboardList, Settings, Bell, GraduationCap, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
        } | null;
    };
    stats?: {
        total_users: number;
        total_programs: number;
        pending_requests: number;
    };
    examSettings?: {
        exam_window_open: boolean;
        payment_window_open: boolean;
        eligibility_bypass_enabled: boolean;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

function getFormattedDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

export default function SuperAdminDashboard() {
    const {
        auth: { user },
        stats = { total_users: 0, total_programs: 0, pending_requests: 0 },
        examSettings = { exam_window_open: true, payment_window_open: true, eligibility_bypass_enabled: false },
        flash
    } = usePage<PageProps>().props;

    const [selectedTab, setSelectedTab] = useState('overview');
    const [examWindowOpen, setExamWindowOpen] = useState(examSettings.exam_window_open);
    const [paymentWindowOpen, setPaymentWindowOpen] = useState(examSettings.payment_window_open);
    const [eligibilityBypassEnabled, setEligibilityBypassEnabled] = useState(examSettings.eligibility_bypass_enabled);
    const [isUpdating, setIsUpdating] = useState(false);

    const greeting = isDaytime() ? 'Good morning' : 'Good evening';

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Update local state when props change
    useEffect(() => {
        setExamWindowOpen(examSettings.exam_window_open);
        setPaymentWindowOpen(examSettings.payment_window_open);
        setEligibilityBypassEnabled(examSettings.eligibility_bypass_enabled);
    }, [examSettings.exam_window_open, examSettings.payment_window_open, examSettings.eligibility_bypass_enabled]);

    const handleExamWindowToggle = async (checked: boolean) => {
        setIsUpdating(true);
        setExamWindowOpen(checked); // Optimistic update
        
        router.post('/api/superadmin/settings/exam-window', 
            { value: checked },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                },
                onError: (errors: any) => {
                    toast.error('Failed to update setting', {
                        description: errors?.message || 'Please try again later'
                    });
                    // Revert on error
                    setExamWindowOpen(!checked);
                    setIsUpdating(false);
                }
            }
        );
    };

    const handlePaymentWindowToggle = async (checked: boolean) => {
        setIsUpdating(true);
        setPaymentWindowOpen(checked); // Optimistic update
        
        router.post('/api/superadmin/settings/payment-window', 
            { value: checked },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                },
                onError: (errors: any) => {
                    toast.error('Failed to update payment window setting', {
                        description: errors?.message || 'Please try again later'
                    });
                    // Revert on error
                    setPaymentWindowOpen(!checked);
                    setIsUpdating(false);
                }
            }
        );
    };

    const handleEligibilityBypassToggle = async (checked: boolean) => {
        setIsUpdating(true);
        setEligibilityBypassEnabled(checked); // Optimistic update
        
        router.post('/api/superadmin/settings/eligibility-bypass', 
            { value: checked },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                },
                onError: (errors: any) => {
                    toast.error('Failed to update eligibility bypass setting', {
                        description: errors?.message || 'Please try again later'
                    });
                    // Revert on error
                    setEligibilityBypassEnabled(!checked);
                    setIsUpdating(false);
                }
            }
        );
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-auto rounded-xl pt-6 px-4 md:px-8 pb-6">
            {/* Professional Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                                {greeting}, {user?.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{getFormattedDate()}</span>
                                <span>•</span>
                                <Badge variant="secondary" className="font-normal">
                                    System Administrator
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDaytime() ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                                <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Day Mode</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                <Moon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Night Mode</span>
                            </div>
                        )}
                    </div>
                </div>
                <Separator />
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_users}</div>
                        <p className="text-xs text-muted-foreground mt-1">All registered accounts</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Programs</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total_programs}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active programs</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.pending_requests}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Modern Tab Navigation */}
            <div className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: Settings },
                    { id: 'exam-settings', label: 'Comprehensive Exam', icon: GraduationCap },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                            selectedTab === tab.id
                                ? 'bg-background text-foreground shadow-sm'
                                : 'hover:bg-background/50 hover:text-foreground'
                        }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
                {selectedTab === 'overview' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Overview</CardTitle>
                                <CardDescription>Monitor and manage the Graduate School System</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle>System Status</AlertTitle>
                                    <AlertDescription>
                                        All systems operational. No issues detected.
                                    </AlertDescription>
                                </Alert>
                                <div className="text-sm text-muted-foreground">
                                    <p>Welcome to the SuperAdmin Dashboard. Use the tabs above to manage system settings, configure exam windows, and send notifications.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {selectedTab === 'exam-settings' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5" />
                                            Comprehensive Exam Settings
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Control student access to comprehensive exam submissions
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Exam Window Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                    <div className="space-y-1 flex-1">
                                        <Label htmlFor="exam-window" className="text-base font-semibold">
                                            Exam Window Status
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {examWindowOpen 
                                                ? 'Students can currently submit comprehensive exam applications' 
                                                : 'Comprehensive exam submissions are currently closed'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isUpdating && (
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        )}
                                        <Switch
                                            id="exam-window"
                                            checked={examWindowOpen}
                                            onCheckedChange={handleExamWindowToggle}
                                            disabled={isUpdating}
                                            className="data-[state=checked]:bg-green-500"
                                        />
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                                    examWindowOpen 
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                }`}>
                                    {examWindowOpen ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-green-900 dark:text-green-100">
                                                    Exam Window is Open
                                                </h3>
                                                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                                                    Students can submit comprehensive exam applications
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-red-900 dark:text-red-100">
                                                    Exam Window is Closed
                                                </h3>
                                                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                                                    Students cannot submit new applications at this time
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Information Alert */}
                                <Alert>
                                    <Settings className="h-4 w-4" />
                                    <AlertTitle>About Exam Window</AlertTitle>
                                    <AlertDescription className="text-sm space-y-2">
                                        <p>
                                            When the exam window is <strong>open</strong>, students who meet the eligibility requirements can submit comprehensive exam applications.
                                        </p>
                                        <p>
                                            When the exam window is <strong>closed</strong>, the submission form will be disabled for all students regardless of eligibility.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Payment Window Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                                            <GraduationCap className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <div>
                                            <CardTitle>Payment Submission Window</CardTitle>
                                            <CardDescription className="mt-1">
                                                Control student access to comprehensive exam payment submissions
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Payment Window Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                    <div className="space-y-1 flex-1">
                                        <Label htmlFor="payment-window" className="text-base font-semibold">
                                            Payment Window Status
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {paymentWindowOpen 
                                                ? 'Students can currently submit comprehensive exam payment receipts' 
                                                : 'Payment submissions are currently closed'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isUpdating && (
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        )}
                                        <Switch
                                            id="payment-window"
                                            checked={paymentWindowOpen}
                                            onCheckedChange={handlePaymentWindowToggle}
                                            disabled={isUpdating}
                                            className="data-[state=checked]:bg-green-500"
                                        />
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                                    paymentWindowOpen 
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                }`}>
                                    {paymentWindowOpen ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-green-900 dark:text-green-100">
                                                    Payment Window is Open
                                                </h3>
                                                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                                                    Students can submit payment receipts for approved applications
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-red-900 dark:text-red-100">
                                                    Payment Window is Closed
                                                </h3>
                                                <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                                                    Students cannot submit payment receipts at this time
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Information Alert */}
                                <Alert>
                                    <Settings className="h-4 w-4" />
                                    <AlertTitle>About Payment Window</AlertTitle>
                                    <AlertDescription className="text-sm space-y-2">
                                        <p>
                                            When the payment window is <strong>open</strong>, students with approved comprehensive exam applications can submit their payment receipts for verification.
                                        </p>
                                        <p>
                                            When the payment window is <strong>closed</strong>, the payment submission form will be disabled for all students regardless of their application status.
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Eligibility Bypass Card */}
                        <Card className="border-2 border-yellow-200 dark:border-yellow-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div>
                                            <CardTitle>Eligibility Bypass (Testing Mode)</CardTitle>
                                            <CardDescription className="mt-1">
                                                Override eligibility requirements for comprehensive exam applications
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Eligibility Bypass Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
                                    <div className="space-y-1 flex-1">
                                        <Label htmlFor="eligibility-bypass" className="text-base font-semibold text-yellow-900 dark:text-yellow-100">
                                            Bypass Eligibility Checks
                                        </Label>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                            {eligibilityBypassEnabled 
                                                ? '⚠️ All students can submit applications regardless of grades/balance' 
                                                : 'Students must meet all eligibility requirements'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isUpdating && (
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        )}
                                        <Switch
                                            id="eligibility-bypass"
                                            checked={eligibilityBypassEnabled}
                                            onCheckedChange={handleEligibilityBypassToggle}
                                            disabled={isUpdating}
                                            className="data-[state=checked]:bg-yellow-500"
                                        />
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                                    eligibilityBypassEnabled 
                                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' 
                                        : 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
                                }`}>
                                    {eligibilityBypassEnabled ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                                                <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                                    ⚠️ Eligibility Bypass is ENABLED
                                                </h3>
                                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
                                                    All students can submit applications without eligibility checks
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    Eligibility Bypass is Disabled
                                                </h3>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                                                    Normal eligibility requirements are enforced
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Warning Alert */}
                                <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
                                    <Shield className="h-4 w-4 text-yellow-600" />
                                    <AlertTitle className="text-yellow-900 dark:text-yellow-100">⚠️ Testing/Development Feature</AlertTitle>
                                    <AlertDescription className="text-sm space-y-2 text-yellow-800 dark:text-yellow-300">
                                        <p>
                                            When <strong>enabled</strong>, this bypass allows ALL students to submit comprehensive exam applications even if they:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Have incomplete grades</li>
                                            <li>Have outstanding tuition balance</li>
                                            <li>Don't meet registrar requirements</li>
                                        </ul>
                                        <p className="font-semibold mt-2">
                                            ⚠️ This should only be used for testing purposes and disabled in production!
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {selectedTab === 'notifications' && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Notifications</CardTitle>
                                <CardDescription>Send announcements to users</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Notification feature coming soon...</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
