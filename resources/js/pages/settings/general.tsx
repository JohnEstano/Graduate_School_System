import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";

export default function GeneralSettings({ initialAcceptDefense }: { initialAcceptDefense: boolean }) {
  const [acceptDefense, setAcceptDefense] = useState(initialAcceptDefense);
  const [pendingValue, setPendingValue] = useState(initialAcceptDefense);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSwitchChange(value: boolean) {
    setPendingValue(value);
    setDialogOpen(true);
  }

  async function confirmChange() {
    setLoading(true);
    setDialogOpen(false);
    setAcceptDefense(pendingValue);

    // Get CSRF token from meta tag
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

  return (
    <AppLayout breadcrumbs={[{ title: "General", href: "/settings/general" }]}>
      <Head title="General Settings" />
      <SettingsLayout>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <div className="flex items-center gap-4">
            <Switch
              checked={acceptDefense}
              onCheckedChange={handleSwitchChange}
              disabled={loading}
              aria-label="Accept defense submissions"
            />
            <span className="text-base font-medium">Accept defense submissions</span>
          </div>
          <div className="text-muted-foreground text-sm max-w-lg">
            When enabled, students can submit defense requirements. When disabled, submissions are blocked. Only applicable to your program.
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {pendingValue ? "Enable Defense Submissions?" : "Disable Defense Submissions?"}
              </DialogTitle>
              <DialogDescription>
                {pendingValue
                  ? "Enabling this will allow students to submit defense requirements."
                  : "Disabling this will block all new defense requirement submissions from students. Existing workflows will not be affected."}
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
      </SettingsLayout>
    </AppLayout>
  );
}