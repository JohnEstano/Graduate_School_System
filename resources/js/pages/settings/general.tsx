import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function GeneralSettings({
    role,
    initialAcceptDefense,
    initialAutoAccept,
    initialAdviserCode,
    initialCoordinatorCode,
}: {
    role: string;
    initialAcceptDefense?: boolean;
    initialAutoAccept?: boolean;
    initialAdviserCode?: string;
    initialCoordinatorCode?: string;
}) {
    // Coordinator state
    const [acceptDefense, setAcceptDefense] = useState(initialAcceptDefense ?? false);
    const [pendingValue, setPendingValue] = useState(initialAcceptDefense ?? false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Adviser/Adviser state
    const [autoAccept, setAutoAccept] = useState(initialAutoAccept ?? false);
    const [pendingAutoAccept, setPendingAutoAccept] = useState(initialAutoAccept ?? false);
    const [adviserDialogOpen, setAdviserDialogOpen] = useState(false);
    const [adviserLoading, setAdviserLoading] = useState(false);
    const [adviserCode, setAdviserCode] = useState(initialAdviserCode ?? '');
    const [resetLoading, setResetLoading] = useState(false);

    // Coordinator code state
    const [coordinatorCode, setCoordinatorCode] = useState(initialCoordinatorCode ?? '');
    const [resetCoordinatorLoading, setResetCoordinatorLoading] = useState(false);

    // Fetch coordinator code on mount if role is Coordinator
    useEffect(() => {
        if (role === 'Coordinator' && !coordinatorCode) {
            fetch('/api/coordinator/code')
                .then((res) => res.json())
                .then((data) => setCoordinatorCode(data.coordinator_code));
        }
    }, [role, coordinatorCode]);

    // Coordinator logic
    function handleSwitchChange(value: boolean) {
        setPendingValue(value);
        setDialogOpen(true);
    }
    async function confirmChange() {
        setLoading(true);
        setDialogOpen(false);
        setAcceptDefense(pendingValue);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        await fetch('/api/settings/general', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || '',
            },
            body: JSON.stringify({ acceptDefense: pendingValue }),
        });
        setLoading(false);
    }

    // Adviser/Adviser logic
    function handleAdviserSwitchChange(value: boolean) {
        setPendingAutoAccept(value);
        setAdviserDialogOpen(true);
    }
    async function confirmAdviserChange() {
        setAdviserLoading(true);
        setAdviserDialogOpen(false);
        setAutoAccept(pendingAutoAccept);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        await fetch('/settings/adviser/auto-accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || '',
            },
            body: JSON.stringify({ autoAccept: pendingAutoAccept }),
        });
        toast.success('Auto-accept setting updated!');
        setAdviserLoading(false);
    }
    async function handleResetCode() {
        setResetLoading(true);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const res = await fetch('/settings/adviser/reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || '',
            },
        });
        const data = await res.json();
        setAdviserCode(data.adviser_code);
        toast.success('Adviser code reset!');
        setResetLoading(false);
    }
    async function handleResetCoordinatorCode() {
        setResetCoordinatorLoading(true);
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const res = await fetch('/api/coordinator/reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token || '',
            },
        });
        const data = await res.json();
        setCoordinatorCode(data.coordinator_code);
        toast.success('Coordinator code reset!');
        setResetCoordinatorLoading(false);
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'General', href: '/settings/general' }]}>
            <Head title="General Settings" />
            <SettingsLayout>
                <div className="space-y-8">
                    {role === 'Coordinator' && (
                        <>
                            {/* --- Coordinator Code Section --- */}
                            <div>
                                <div className="mb-1 text-base font-medium">Your Coordinator Code</div>
                                <div className="flex items-center gap-3">
                                    <Input value={coordinatorCode} disabled className="w-40 font-mono text-base" />
                                    <Button
                                        onClick={handleResetCoordinatorCode}
                                        disabled={resetCoordinatorLoading}
                                        className="rounded-md bg-rose-500 px-4 py-2 font-medium text-white transition-colors hover:bg-rose-600"
                                    >
                                        {resetCoordinatorLoading ? 'Resetting...' : 'Reset Code'}
                                    </Button>
                                </div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    Share this code with your advisers so they can register you as their coordinator. If you suspect your code is
                                    compromised, reset it here.
                                </div>
                            </div>
                            {/* --- Accept Defense Submissions Section --- */}
                            <div className="mt-20">
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={acceptDefense}
                                        onCheckedChange={handleSwitchChange}
                                        disabled={loading}
                                        aria-label="Accept defense submissions"
                                    />
                                    <span className="text-base font-medium">Accept defense submissions</span>
                                </div>
                                <div className="text-muted-foreground max-w-lg text-sm">
                                    When enabled, students can submit defense requirements. When disabled, submissions are blocked. Only applicable to
                                    your program.
                                </div>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle className="text-base font-semibold">
                                                {pendingValue ? 'Enable Defense Submissions?' : 'Disable Defense Submissions?'}
                                            </DialogTitle>
                                            <DialogDescription className="text-sm">
                                                {pendingValue
                                                    ? 'Enabling this will allow students to submit defense requirements.'
                                                    : 'Disabling this will block all new defense requirement submissions from students. Existing workflows will not be affected.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={confirmChange} disabled={loading}>
                                                Confirm
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </>
                    )}
                    {(role === 'Adviser' || role === 'Adviser') && (
                        <>
                            <div>
                                <div className="mb-2 text-lg font-semibold">Adviser Code</div>
                                <div className="mb-1 text-base font-medium">Your Adviser Code</div>
                                <div className="flex items-center gap-3">
                                    <Input value={adviserCode} disabled className="w-40 font-mono text-base" />
                                    <Button
                                        onClick={handleResetCode}
                                        disabled={resetLoading}
                                        className="rounded-md bg-rose-500 px-4 py-2 font-medium text-white transition-colors hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-600"
                                    >
                                        {resetLoading ? 'Resetting...' : 'Reset Code'}
                                    </Button>
                                </div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    Share this code with your students so they can register you as their adviser. If you suspect your code is
                                    compromised, reset it here.
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={autoAccept}
                                        onCheckedChange={handleAdviserSwitchChange}
                                        disabled={adviserLoading}
                                        aria-label="Auto-accept students"
                                    />
                                    <span className="text-base font-medium">Auto-accept students who enter your adviser code</span>
                                </div>
                                <div className="text-muted-foreground max-w-lg text-sm">
                                    When enabled, students who enter your adviser code are automatically registered as your students. When disabled,
                                    you must manually approve each student.
                                </div>
                            </div>
                            <Dialog open={adviserDialogOpen} onOpenChange={setAdviserDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle className="text-base font-semibold">
                                            {pendingAutoAccept ? 'Enable Auto-Accept?' : 'Disable Auto-Accept?'}
                                        </DialogTitle>
                                        <DialogDescription className="text-sm">
                                            {pendingAutoAccept
                                                ? 'Students who enter your adviser code will be automatically linked to you.'
                                                : 'You will need to manually approve each student who enters your adviser code.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setAdviserDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={confirmAdviserChange} disabled={adviserLoading}>
                                            Confirm
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
