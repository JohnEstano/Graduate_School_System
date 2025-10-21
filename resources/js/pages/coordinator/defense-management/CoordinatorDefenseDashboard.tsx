import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, MapPin, Bell, Edit, Eye, CheckCircle, AlertCircle, PlusCircle, Check } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface DefenseRequest {
    id: number;
    student_name: string;
    school_id: string;
    program: string;
    thesis_title: string;
    defense_type: string;
    adviser: string;
    workflow_state: string;
    workflow_state_display: string;
    scheduling_status: string;
    formatted_schedule: string;
    panels_list: Array<{role: string; name: string}>;
    defense_chairperson?: string;
    defense_panelist1?: string;
    defense_panelist2?: string;
    defense_panelist3?: string;
    defense_panelist4?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    scheduled_end_time?: string;
    defense_duration_minutes?: number;
    formatted_time_range?: string;
    defense_mode?: string;
    defense_venue?: string;
    scheduling_notes?: string;
    panels_assigned_at?: string;
    schedule_set_at?: string;
    adviser_notified_at?: string;
    student_notified_at?: string;
    panels_notified_at?: string;
    submitted_at?: string;
    adviser_reviewed_at?: string;
}

interface FacultyMember {
    id: number;
    name: string;
    email?: string;
    type: 'faculty';
}

interface Panelist {
    id: number;
    name: string;
    email: string;
    type: 'panelist';
}

interface PanelMember {
    id: number;
    name: string;
    email?: string;
    type: 'faculty' | 'panelist';
}

interface Stats {
    pending_panels: number;
    panels_assigned: number;
    scheduled: number;
    completed: number;
}

interface Props {
    defenseRequests: DefenseRequest[];
    facultyMembers: FacultyMember[];
    panelists: Panelist[];
    availablePanelMembers: PanelMember[];
    stats: Stats;
    user: any;
}

export default function CoordinatorDefenseDashboard({ defenseRequests, facultyMembers, panelists, availablePanelMembers, stats, user }: Props) {
    // Sonner toast is imported directly
    const [selectedRequest, setSelectedRequest] = useState<DefenseRequest | null>(null);
    const [activeDialog, setActiveDialog] = useState<'panels' | 'schedule' | 'edit' | 'view' | null>(null);

    // Form for assigning panels
    const panelsForm = useForm({
        defense_chairperson: 'none',
        defense_panelist1: 'none',
        defense_panelist2: 'none',
        defense_panelist3: 'none',
        defense_panelist4: 'none',
    });

    // Form for scheduling defense
    const scheduleForm = useForm({
        scheduled_date: '',
        scheduled_time: '',
        scheduled_end_time: '',
        defense_mode: '',
        defense_venue: '',
        scheduling_notes: '',
    });

    // Form for updating defense
    const updateForm = useForm({
        defense_chairperson: 'none',
        defense_panelist1: 'none',
        defense_panelist2: 'none',
        defense_panelist3: 'none',
        defense_panelist4: 'none',
        scheduled_date: '',
        scheduled_time: '',
        defense_mode: '',
        defense_venue: '',
        scheduling_notes: '',
    });

    const handleAssignPanels = () => {
        if (!selectedRequest) return;
        
        // Convert "none" values to empty strings before submitting
        const formData = {
            defense_chairperson: panelsForm.data.defense_chairperson === 'none' ? '' : panelsForm.data.defense_chairperson,
            defense_panelist1: panelsForm.data.defense_panelist1 === 'none' ? '' : panelsForm.data.defense_panelist1,
            defense_panelist2: panelsForm.data.defense_panelist2 === 'none' ? '' : panelsForm.data.defense_panelist2,
            defense_panelist3: panelsForm.data.defense_panelist3 === 'none' ? '' : panelsForm.data.defense_panelist3,
            defense_panelist4: panelsForm.data.defense_panelist4 === 'none' ? '' : panelsForm.data.defense_panelist4,
        };
        
        panelsForm.setData(formData);
        
        panelsForm.post(route('coordinator.defense.assign-panels', selectedRequest.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                // Always move to scheduling after successful panel assignment
                toast.success('Defense panel assigned successfully! Now set the schedule.');
                
                // Automatically transition to scheduling dialog
                setActiveDialog('schedule');
                
                // Reset schedule form for fresh input
                scheduleForm.setData({
                    scheduled_date: '',
                    scheduled_time: '',
                    scheduled_end_time: '',
                    defense_mode: '',
                    defense_venue: '',
                    scheduling_notes: '',
                });
                
                panelsForm.reset();
            },
            onError: (errors) => {
                // Handle validation errors with user-friendly messages
                const errorMessages = Object.entries(errors).map(([field, message]) => {
                    // Format field names for better readability
                    const fieldName = field.replace('defense_', '').replace('_', ' ').toLowerCase();
                    return `${fieldName}: ${message}`;
                });
                
                // Show the first error as a toast
                if (errorMessages.length > 0) {
                    toast.error(errorMessages[0]);
                }
                
                // Keep dialog open for corrections
            },
        });
    };

    const handleScheduleDefense = () => {
        if (!selectedRequest) return;
        
        scheduleForm.post(route('coordinator.defense.schedule', selectedRequest.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                // Check for scheduling completion
                const flash = page.props.flash as { scheduling_completed?: boolean; success?: string } | undefined;
                if (flash?.success) {
                    toast.success(flash.success);
                }
                setActiveDialog(null);
                scheduleForm.reset();
                // Refresh the page to show updated data
                window.location.reload();
            },
            onError: (errors) => {
                // Handle validation errors with specific field targeting
                const errorEntries = Object.entries(errors);
                if (errorEntries.length > 0) {
                    const [field, message] = errorEntries[0];
                    
                    // Format field names for better readability
                    const fieldDisplayName = field
                        .replace('scheduled_', '')
                        .replace('defense_', '')
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase());
                    
                    toast.error(`${fieldDisplayName}: ${message}`);
                }
                
                // Keep the dialog open for user to correct the errors
            },
        });
    };

    const handleUpdateDefense = () => {
        if (!selectedRequest) return;
        
        // Convert "none" values to empty strings before submitting
        const formData = {
            ...updateForm.data,
            defense_chairperson: updateForm.data.defense_chairperson === 'none' ? '' : updateForm.data.defense_chairperson,
            defense_panelist1: updateForm.data.defense_panelist1 === 'none' ? '' : updateForm.data.defense_panelist1,
            defense_panelist2: updateForm.data.defense_panelist2 === 'none' ? '' : updateForm.data.defense_panelist2,
            defense_panelist3: updateForm.data.defense_panelist3 === 'none' ? '' : updateForm.data.defense_panelist3,
            defense_panelist4: updateForm.data.defense_panelist4 === 'none' ? '' : updateForm.data.defense_panelist4,
        };
        
        updateForm.setData(formData);
        
        updateForm.put(route('coordinator.defense.update', selectedRequest.id), {
            onSuccess: () => {
                setActiveDialog(null);
                updateForm.reset();
            },
        });
    };

    const handleSendNotifications = (parties: string[]) => {
        if (!selectedRequest) return;
        
        const form = useForm({
            notify_parties: parties,
        });

        form.post(route('coordinator.defense.notify', selectedRequest.id), {
            onSuccess: () => {
                // Handle success
            },
        });
    };

    const openDialog = (type: 'panels' | 'schedule' | 'edit' | 'view', request: DefenseRequest) => {
        setSelectedRequest(request);
        
        if (type === 'panels') {
            panelsForm.setData({
                defense_chairperson: request.defense_chairperson || 'none',
                defense_panelist1: request.defense_panelist1 || 'none',
                defense_panelist2: request.defense_panelist2 || 'none',
                defense_panelist3: request.defense_panelist3 || 'none',
                defense_panelist4: request.defense_panelist4 || 'none',
            });
        } else if (type === 'schedule') {
            scheduleForm.setData({
                scheduled_date: request.scheduled_date || '',
                scheduled_time: request.scheduled_time || '',
                scheduled_end_time: request.scheduled_end_time || '',
                defense_mode: request.defense_mode || '',
                defense_venue: request.defense_venue || '',
                scheduling_notes: request.scheduling_notes || '',
            });
        } else if (type === 'edit') {
            updateForm.setData({
                defense_chairperson: request.defense_chairperson || 'none',
                defense_panelist1: request.defense_panelist1 || 'none',
                defense_panelist2: request.defense_panelist2 || 'none',
                defense_panelist3: request.defense_panelist3 || 'none',
                defense_panelist4: request.defense_panelist4 || 'none',
                scheduled_date: request.scheduled_date || '',
                scheduled_time: request.scheduled_time || '',
                defense_mode: request.defense_mode || '',
                defense_venue: request.defense_venue || '',
                scheduling_notes: request.scheduling_notes || '',
            });
        }
        
        setActiveDialog(type);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending-panels': return 'bg-yellow-100 text-yellow-800';
            case 'panels-assigned': return 'bg-blue-100 text-blue-800';
            case 'scheduled': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout>
            <Head title="Defense Management" />
            <Toaster richColors position="bottom-right" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Panels</CardTitle>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pending_panels}</div>
                                <p className="text-xs text-gray-500">Awaiting panel assignment</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Panels Assigned</CardTitle>
                                <Users className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.panels_assigned}</div>
                                <p className="text-xs text-gray-500">Ready for scheduling</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                                <Calendar className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.scheduled}</div>
                                <p className="text-xs text-gray-500">Defense scheduled</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                <CheckCircle className="h-4 w-4 text-gray-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.completed}</div>
                                <p className="text-xs text-gray-500">Defense completed</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Approved Defense Requests</CardTitle>
                            <CardDescription>
                                Manage panel assignments, scheduling, and notifications for approved defense requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {defenseRequests.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No approved defense requests requiring scheduling at this time.
                                    </div>
                                ) : (
                                    defenseRequests.map((request) => (
                                        <Card key={request.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-lg font-semibold">{request.student_name}</h3>
                                                            <Badge className={getStatusColor(request.scheduling_status ?? 'pending-panels')}>
                                                                {(request.scheduling_status ?? 'pending-panels').replace('-', ' ').toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                                            <div>
                                                                <p><strong>ID:</strong> {request.school_id}</p>
                                                                <p><strong>Program:</strong> {request.program}</p>
                                                                <p><strong>Defense Type:</strong> {request.defense_type}</p>
                                                                <p><strong>Adviser:</strong> {request.adviser}</p>
                                                            </div>
                                                            <div>
                                                                <p><strong>Submitted:</strong> {request.submitted_at}</p>
                                                                <p><strong>Approved:</strong> {request.adviser_reviewed_at}</p>
                                                                {request.formatted_schedule !== 'Not scheduled' && (
                                                                    <p><strong>Schedule:</strong> {request.formatted_schedule}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-3">
                                                            <p className="font-medium text-sm mb-1">Thesis Title:</p>
                                                            <p className="text-sm text-gray-700">{request.thesis_title}</p>
                                                        </div>

                                                        {(request.panels_list ?? []).length > 0 && (
                                                            <div className="mt-3">
                                                                <p className="font-medium text-sm mb-1">Panel Members:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(request.panels_list ?? []).map((panel, index) => (
                                                                        <Badge key={index} variant="outline">
                                                                            {panel.role}: {panel.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 ml-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDialog('view', request)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDialog('panels', request)}
                                                        >
                                                            <Users className="h-4 w-4 mr-1" />
                                                            {request.defense_chairperson && request.scheduled_date ? 'Edit Assignment' : 
                                                             request.defense_chairperson ? 'Complete Scheduling' : 'Assign Panels & Schedule'}
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openDialog('edit', request)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>

                                                        {(request.defense_chairperson && request.scheduled_date) && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => handleSendNotifications(['adviser', 'student', 'panels'])}
                                                            >
                                                                <Bell className="h-4 w-4 mr-1" />
                                                                Notify All
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Assign Panels Dialog */}
            <Dialog open={activeDialog === 'panels'} onOpenChange={(open) => { if (!open) setActiveDialog(null); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Defense Panels</DialogTitle>
                        <DialogDescription>
                            Assign chairperson and panelists for {selectedRequest?.student_name}'s defense
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Panel Selection</span>
                        </div>
                        <p className="text-blue-600 text-xs mt-1">
                            Select from faculty members (including advisers) and panelists database. 
                            {availablePanelMembers.length > 0 && (
                                <span> {panelists.length} panelists and {facultyMembers.length} faculty members available.</span>
                            )}
                            <br />
                            <span className="font-medium">Note:</span> Advisers can serve as panel members.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Form validation summary */}
                        {Object.keys(panelsForm.errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-medium">Please fix the following:</span>
                                </div>
                                <ul className="text-red-600 text-xs mt-1 ml-6 list-disc">
                                    {Object.entries(panelsForm.errors).map(([field, error]) => (
                                        <li key={field}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="chairperson">Chairperson *</Label>
                            <Select
                                value={panelsForm.data.defense_chairperson}
                                onValueChange={(value) => panelsForm.setData('defense_chairperson', value)}
                            >
                                <SelectTrigger className={panelsForm.errors.defense_chairperson ? 'border-red-300' : ''}>
                                    <SelectValue placeholder="Select chairperson" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(availablePanelMembers ?? []).map((member) => (
                                        <SelectItem key={`${member.type}-${member.id}`} value={member.name}>
                                            {member.name} ({member.type === 'faculty' ? 'Faculty' : 'Panelist'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {panelsForm.errors.defense_chairperson && (
                                <p className="text-red-500 text-xs mt-1">{panelsForm.errors.defense_chairperson}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="panelist1">Panelist 1 *</Label>
                            <Select
                                value={panelsForm.data.defense_panelist1}
                                onValueChange={(value) => panelsForm.setData('defense_panelist1', value)}
                            >
                                <SelectTrigger className={panelsForm.errors.defense_panelist1 ? 'border-red-300' : ''}>
                                    <SelectValue placeholder="Select panelist 1" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(availablePanelMembers ?? []).map((member) => (
                                        <SelectItem key={`${member.type}-${member.id}`} value={member.name}>
                                            {member.name} ({member.type === 'faculty' ? 'Faculty' : 'Panelist'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {panelsForm.errors.defense_panelist1 && (
                                <p className="text-red-500 text-xs mt-1">{panelsForm.errors.defense_panelist1}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="panelist2">Panelist 2</Label>
                            <Select
                                value={panelsForm.data.defense_panelist2}
                                onValueChange={(value) => panelsForm.setData('defense_panelist2', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select panelist 2 (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {(availablePanelMembers ?? []).map((member) => (
                                        <SelectItem key={`${member.type}-${member.id}`} value={member.name}>
                                            {member.name} ({member.type === 'faculty' ? 'Faculty' : 'Panelist'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="panelist3">Panelist 3</Label>
                            <Select
                                value={panelsForm.data.defense_panelist3}
                                onValueChange={(value) => panelsForm.setData('defense_panelist3', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select panelist 3 (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {(availablePanelMembers ?? []).map((member) => (
                                        <SelectItem key={`${member.type}-${member.id}`} value={member.name}>
                                            {member.name} ({member.type === 'faculty' ? 'Faculty' : 'Panelist'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="panelist4">Panelist 4</Label>
                            <Select
                                value={panelsForm.data.defense_panelist4}
                                onValueChange={(value) => panelsForm.setData('defense_panelist4', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select panelist 4 (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {availablePanelMembers.map((member) => (
                                        <SelectItem key={`${member.type}-${member.id}`} value={member.name}>
                                            {member.name} ({member.type === 'faculty' ? 'Faculty' : 'Panelist'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAssignPanels}
                            disabled={panelsForm.processing || !panelsForm.data.defense_chairperson || !panelsForm.data.defense_panelist1}
                        >
                            {panelsForm.processing ? 'Processing...' : 'Assign Panels & Continue to Schedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Defense Dialog */}
            <Dialog open={activeDialog === 'schedule'} onOpenChange={(open) => { if (!open) setActiveDialog(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Step 2: Schedule Defense</DialogTitle>
                        <DialogDescription>
                            Panels assigned! Now set the date, time, and venue for {selectedRequest?.student_name}'s defense
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Panels Assigned Successfully</span>
                        </div>
                        <p className="text-green-600 text-xs mt-1">
                            Now complete the process by setting the defense schedule. Conflicts will be checked automatically.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Enhanced conflict detection display */}
                        {Object.keys(scheduleForm.errors).length > 0 && (
                            <div className="space-y-3">
                                {scheduleForm.errors.scheduled_time && scheduleForm.errors.scheduled_time.includes('Conflict Detected') && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-red-100 rounded-full p-2">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-red-800 mb-2">Scheduling Conflict Detected</h4>
                                                <div className="text-red-700 text-sm space-y-2">
                                                    {scheduleForm.errors.scheduled_time.split('\n').map((line, index) => {
                                                        if (line.trim() === '') return null;
                                                        if (line.includes('**')) {
                                                            // Handle bold text
                                                            const parts = line.split('**');
                                                            return (
                                                                <div key={index} className={line.startsWith('•') ? 'ml-3' : ''}>
                                                                    {parts.map((part, partIndex) => 
                                                                        partIndex % 2 === 1 ? 
                                                                            <strong key={partIndex} className="font-semibold">{part}</strong> : 
                                                                            <span key={partIndex}>{part}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div key={index} className={line.startsWith('•') ? 'ml-3' : ''}>
                                                                {line}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-red-200">
                                                    <p className="text-red-600 text-xs font-medium">
                                                        💡 Tip: Adjust the time slot or reassign panel members to resolve this conflict.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {scheduleForm.errors.defense_venue && scheduleForm.errors.defense_venue.includes('Venue Conflict') && (
                                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-orange-100 rounded-full p-2">
                                                <MapPin className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-orange-800 mb-2">Venue Conflict Detected</h4>
                                                <div className="text-orange-700 text-sm space-y-2">
                                                    {scheduleForm.errors.defense_venue.split('\n').map((line, index) => {
                                                        if (line.trim() === '') return null;
                                                        if (line.includes('**')) {
                                                            // Handle bold text
                                                            const parts = line.split('**');
                                                            return (
                                                                <div key={index}>
                                                                    {parts.map((part, partIndex) => 
                                                                        partIndex % 2 === 1 ? 
                                                                            <strong key={partIndex} className="font-semibold">{part}</strong> : 
                                                                            <span key={partIndex}>{part}</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return <div key={index}>{line}</div>;
                                                    })}
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-orange-200">
                                                    <p className="text-orange-600 text-xs font-medium">
                                                        💡 Tip: Select a different venue or adjust the time slot.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Other non-conflict errors */}
                                {Object.entries(scheduleForm.errors).some(([field, error]) => 
                                    !error.includes('Conflict Detected') && !error.includes('Venue Conflict')
                                ) && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-red-700 text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="font-medium">Please fix the following:</span>
                                        </div>
                                        <ul className="text-red-600 text-xs mt-1 ml-6 list-disc">
                                            {Object.entries(scheduleForm.errors).map(([field, error]) => {
                                                if (error.includes('Conflict Detected') || error.includes('Venue Conflict')) return null;
                                                return <li key={field}>{error}</li>;
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="date">Defense Date *</Label>
                            <Input
                                type="date"
                                value={scheduleForm.data.scheduled_date}
                                onChange={(e) => scheduleForm.setData('scheduled_date', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={scheduleForm.errors.scheduled_date ? 'border-red-300' : ''}
                            />
                            {scheduleForm.errors.scheduled_date && (
                                <p className="text-red-500 text-xs mt-1">{scheduleForm.errors.scheduled_date}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="time">Defense Start Time *</Label>
                            <Input
                                type="time"
                                value={scheduleForm.data.scheduled_time}
                                onChange={(e) => scheduleForm.setData('scheduled_time', e.target.value)}
                                className={scheduleForm.errors.scheduled_time ? 'border-red-300' : ''}
                            />
                            {scheduleForm.errors.scheduled_time && !scheduleForm.errors.scheduled_time.includes('Conflict Detected') && (
                                <p className="text-red-500 text-xs mt-1">{scheduleForm.errors.scheduled_time}</p>
                            )}
                            {scheduleForm.errors.scheduled_time && scheduleForm.errors.scheduled_time.includes('Conflict Detected') && (
                                <p className="text-red-500 text-xs mt-1">⚠️ Time conflict detected - see details above</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="end_time">Defense End Time *</Label>
                            <Input
                                type="time"
                                value={scheduleForm.data.scheduled_end_time}
                                onChange={(e) => scheduleForm.setData('scheduled_end_time', e.target.value)}
                                className={scheduleForm.errors.scheduled_end_time ? 'border-red-300' : ''}
                            />
                            {scheduleForm.errors.scheduled_end_time && (
                                <p className="text-red-500 text-xs mt-1">{scheduleForm.errors.scheduled_end_time}</p>
                            )}
                            {scheduleForm.data.scheduled_time && scheduleForm.data.scheduled_end_time && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Defense Schedule: {scheduleForm.data.scheduled_time} - {scheduleForm.data.scheduled_end_time}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="mode">Defense Mode *</Label>
                            <Select
                                value={scheduleForm.data.defense_mode}
                                onValueChange={(value) => scheduleForm.setData('defense_mode', value)}
                            >
                                <SelectTrigger className={scheduleForm.errors.defense_mode ? 'border-red-300' : ''}>
                                    <SelectValue placeholder="Select defense mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="face-to-face">Face-to-Face</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                            {scheduleForm.errors.defense_mode && (
                                <p className="text-red-500 text-xs mt-1">{scheduleForm.errors.defense_mode}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="venue">Venue/Link *</Label>
                            <Input
                                placeholder="Room number or online meeting link"
                                value={scheduleForm.data.defense_venue}
                                onChange={(e) => scheduleForm.setData('defense_venue', e.target.value)}
                                className={scheduleForm.errors.defense_venue ? 'border-red-300' : ''}
                            />
                            {scheduleForm.errors.defense_venue && !scheduleForm.errors.defense_venue.includes('Venue Conflict') && (
                                <p className="text-red-500 text-xs mt-1">{scheduleForm.errors.defense_venue}</p>
                            )}
                            {scheduleForm.errors.defense_venue && scheduleForm.errors.defense_venue.includes('Venue Conflict') && (
                                <p className="text-red-500 text-xs mt-1">🏛️ Venue conflict detected - see details above</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="notes">Scheduling Notes</Label>
                            <Textarea
                                placeholder="Additional notes or instructions..."
                                value={scheduleForm.data.scheduling_notes}
                                onChange={(e) => scheduleForm.setData('scheduling_notes', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleScheduleDefense}
                            disabled={scheduleForm.processing || !scheduleForm.data.scheduled_date || !scheduleForm.data.scheduled_time || !scheduleForm.data.scheduled_end_time || !scheduleForm.data.defense_mode || !scheduleForm.data.defense_venue}
                        >
                            {scheduleForm.processing ? 'Scheduling...' : 'Schedule Defense'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog - Simplified version */}
            <Dialog open={activeDialog === 'view'} onOpenChange={(open) => { if (!open) setActiveDialog(null); }}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Defense Request Details</DialogTitle>
                        <DialogDescription>
                            Complete information for {selectedRequest?.student_name}'s defense request
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium">Student Information</p>
                                    <p>Name: {selectedRequest.student_name}</p>
                                    <p>ID: {selectedRequest.school_id}</p>
                                    <p>Program: {selectedRequest.program}</p>
                                    <p>Defense Type: {selectedRequest.defense_type}</p>
                                    <p>Adviser: {selectedRequest.adviser}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Status Information</p>
                                    <p>Workflow State: {selectedRequest.workflow_state_display}</p>
                                    <p>Scheduling Status: {selectedRequest.scheduling_status.replace('-', ' ').toUpperCase()}</p>
                                    <p>Submitted: {selectedRequest.submitted_at}</p>
                                    <p>Approved: {selectedRequest.adviser_reviewed_at}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium mb-2">Thesis Title</p>
                                <p className="text-sm bg-gray-50 p-3 rounded">{selectedRequest.thesis_title}</p>
                            </div>

                            {selectedRequest.panels_list.length > 0 && (
                                <div>
                                    <p className="font-medium mb-2">Panel Members</p>
                                    <div className="space-y-1">
                                        {selectedRequest.panels_list.map((panel, index) => (
                                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                                <span className="font-medium">{panel.role}:</span>
                                                <span>{panel.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setActiveDialog(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
