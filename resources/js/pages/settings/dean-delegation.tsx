import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";
import { Loader2, ShieldCheck } from "lucide-react";

type Coordinator = {
  id: number;
  name: string;
  email: string;
  program?: string;
  can_sign_on_behalf: boolean;
};

export default function DeanDelegationSettings() {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  async function loadCoordinators() {
    setLoading(true);
    try {
      const res = await fetch('/api/dean/coordinator-delegation');
      if (res.ok) {
        const data = await res.json();
        setCoordinators(data);
      }
    } catch (err) {
      console.error('Failed to load coordinators:', err);
      toast.error('Failed to load coordinators');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoordinators();
  }, []);

  async function toggleDelegation(coordinatorId: number, currentValue: boolean) {
    setUpdating(coordinatorId);
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const res = await fetch('/api/dean/coordinator-delegation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token || '',
        },
        body: JSON.stringify({
          coordinator_id: coordinatorId,
          can_sign_on_behalf: !currentValue,
        }),
      });

      if (res.ok) {
        setCoordinators(prev =>
          prev.map(c =>
            c.id === coordinatorId ? { ...c, can_sign_on_behalf: !currentValue } : c
          )
        );
        toast.success(!currentValue ? 'Delegation granted' : 'Delegation revoked');
      } else {
        toast.error('Failed to update delegation');
      }
    } catch (err) {
      console.error('Error updating delegation:', err);
      toast.error('Failed to update delegation');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Coordinator Delegation", href: "/settings/dean-delegation" }]}>
      <Head title="Coordinator Delegation" />
      <SettingsLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Coordinator Delegation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Allow coordinators to approve and sign defense endorsements using your signature.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No coordinators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    coordinators.map(coord => (
                      <TableRow key={coord.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{coord.name}</div>
                            <div className="text-xs text-muted-foreground">{coord.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{coord.program || '—'}</span>
                        </TableCell>
                        <TableCell>
                          {coord.can_sign_on_behalf ? (
                            <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              Delegated
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Delegated</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">
                              {coord.can_sign_on_behalf ? 'Revoke' : 'Grant'}
                            </span>
                            <Switch
                              checked={coord.can_sign_on_behalf}
                              onCheckedChange={() => toggleDelegation(coord.id, coord.can_sign_on_behalf)}
                              disabled={updating === coord.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
