import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";

export default function AdviserSettings({ initialAutoAccept, initialAdviserCode }: { initialAutoAccept: boolean, initialAdviserCode: string }) {
  const [autoAccept, setAutoAccept] = useState(initialAutoAccept);
  const [pendingAutoAccept, setPendingAutoAccept] = useState(initialAutoAccept);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adviserCode, setAdviserCode] = useState(initialAdviserCode);
  const [resetLoading, setResetLoading] = useState(false);

  function handleSwitchChange(value: boolean) {
    setPendingAutoAccept(value);
    setDialogOpen(true);
  }

  async function confirmChange() {
    setLoading(true);
    setDialogOpen(false);
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
    toast.success("Auto-accept setting updated!");
    setLoading(false);
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
    toast.success("Adviser code reset!");
    setResetLoading(false);
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Adviser Settings", href: "/settings/adviser" }]}>
      <Head title="Adviser Settings" />
      <SettingsLayout>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Adviser Code Management</h2>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Your Adviser Code</div>
            <div className="flex items-center gap-3">
              <Input value={adviserCode} disabled className="w-40 font-mono" />
              <Button onClick={handleResetCode} disabled={resetLoading} variant="destructive">
                {resetLoading ? "Resetting..." : "Reset Code"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Share this code with your students so they can register you as their adviser. If you suspect your code is compromised, reset it here.</div>
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-4">
              <Switch
                checked={autoAccept}
                onCheckedChange={handleSwitchChange}
                disabled={loading}
                aria-label="Auto-accept students"
              />
              <span className="text-base font-medium">Auto-accept students who enter your adviser code</span>
            </div>
            <div className="text-muted-foreground text-sm max-w-lg">
              When enabled, students who enter your code are automatically linked to you. When disabled, you must manually approve each student.
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {pendingAutoAccept ? "Enable Auto-Accept?" : "Disable Auto-Accept?"}
                </DialogTitle>
                <DialogDescription>
                  {pendingAutoAccept
                    ? "Students who enter your adviser code will be automatically linked to you."
                    : "You will need to manually approve each student who enters your adviser code."}
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
      </SettingsLayout>
    </AppLayout>
  );
}