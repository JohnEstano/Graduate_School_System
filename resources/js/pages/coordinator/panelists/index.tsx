// resources/js/Pages/coordinator/panelists/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PanelistsListTable from './panelists-list-table';
import PanelistFormModal from './panelists-form-modal';
import { Toaster, toast } from 'sonner';
import { CheckCircle, CircleX, X, Trash2, Search, Users, PlusCircle, UserPlus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import type { Panelist, PaymentRate } from '@/types';

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Panelists", href: "/panelists" },
];

export default function PanelistsPage() {
  const { panelists: initialPanelists = [], paymentRates: initialPaymentRates = [] } = usePage().props as {
    panelists?: Panelist[];
    paymentRates?: PaymentRate[];
  };

  const [panelists, setPanelists] = useState<Panelist[]>(initialPanelists);
  const [selected, setSelected] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Panelist | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [paymentRates, setPaymentRates] = useState<PaymentRate[]>(initialPaymentRates);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
    setPanelists(initialPanelists);
  }, [initialPanelists]);

  // Fetch Payment Rates only if not provided by server
  useEffect(() => {
    if (initialPaymentRates && initialPaymentRates.length > 0) return;
    let mounted = true;
    axios.get('/dean/payment-rates/data')
      .then((res) => {
        if (!mounted) return;
        const rates = Array.isArray(res.data?.rates) ? res.data.rates : [];
        setPaymentRates(rates);
      })
      .catch(() => setPaymentRates([]));
    return () => { mounted = false; };
  }, [initialPaymentRates]);

  // Filtering logic
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = panelists;

    if (roleFilter.length > 0) {
      result = result.filter(
        (p) =>
          (Array.isArray(p.assignments) && p.assignments.some((a) => a.role && roleFilter.includes(a.role))) ||
          (!Array.isArray(p.assignments) && roleFilter.includes(p.role))
      );
    }

    if (statusFilter.length > 0) {
      result = result.filter((p) => {
        const assigned = Array.isArray(p.assignments) && p.assignments.length > 0;
        return (
          (statusFilter.includes("Assigned") && assigned) ||
          (statusFilter.includes("Not Assigned") && !assigned)
        );
      });
    }

    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }

    return result;
  }, [query, panelists, roleFilter, statusFilter]);

  // Ensure type fallback client-side (role -> type)
  const hydrated = useMemo<Panelist[]>(() => {
    return filtered.map(p => ({
      ...p,
      assignments: (p.assignments || []).map(a => ({
        ...a,
        type: (a as any).type ?? a.role ?? p.role,
      })),
    }));
  }, [filtered]);

  function handleFormSubmit(
    data: Omit<Panelist, "id" | "created_at" | "updated_at">,
    id?: number,
    done?: () => void
  ) {
    setFormLoading(true);
    if (id) {
      router.put(`/panelists/${id}`, data, {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success("Panelist updated");
          setModalOpen(false);
          setEditing(null);
          setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
          setFormLoading(false);
          done && done();
        },
        onError: () => {
          toast.error("Failed to update panelist");
          setFormLoading(false);
          done && done();
        },
      });
    } else {
      router.post("/panelists", data, {
        preserveScroll: true,
        onSuccess: (page) => {
          toast.success("Panelist added");
          setModalOpen(false);
          setEditing(null);
          setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
          setFormLoading(false);
          done && done();
        },
        onError: () => {
          toast.error("Failed to add panelist");
          setFormLoading(false);
          done && done();
        },
      });
    }
  }

  function handleDelete(id: number) {
    setLoading(true);
    router.delete(`/panelists/${id}`, {
      preserveScroll: true,
      onSuccess: (page) => {
        toast.success("Panelist deleted");
        setSelected((s) => s.filter((x) => x !== id));
        setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
        setLoading(false);
      },
      onError: () => {
        toast.error("Failed to delete panelist");
        setLoading(false);
      },
    });
  }

  function handleBulkDelete() {
    if (selected.length === 0) return;
    if (!window.confirm("Delete selected panelists?")) return;
    setLoading(true);
    router.post("/panelists/bulk-delete", { ids: selected }, {
      preserveScroll: true,
      onSuccess: (page) => {
        toast.success("Panelists deleted");
        setSelected([]);
        setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
        setLoading(false);
      },
      onError: () => {
        toast.error("Failed to bulk delete");
        setLoading(false);
      },
    });
  }

  function handleBulkStatus(status: Panelist["status"]) {
    if (selected.length === 0) return;
    setLoading(true);
    router.post("/panelists/bulk-status", { ids: selected, status }, {
      preserveScroll: true,
      onSuccess: (page) => {
        toast.success("Panelists status updated");
        setSelected([]);
        setPanelists(Array.isArray(page.props.panelists) ? page.props.panelists : []);
        setLoading(false);
      },
      onError: () => {
        toast.error("Failed to update status");
        setLoading(false);
      },
    });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Panelists" />
      <Toaster richColors position="bottom-right" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative bg-background">
        {/* Header */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-border dark:border-border rounded-lg overflow-hidden">
          <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white dark:bg-zinc-900 dark:border-border">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 dark:bg-rose-900 border border-rose-500">
                <Users className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">Panelists</span>
                <span className="block text-xs text-muted-foreground dark:text-muted-foreground">
                  This section shows all defense panelists. Add, search, and manage panelists.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setModalOpen(true); setEditing(null); }} disabled={formLoading || loading}>
                <UserPlus className="h-4 w-4" /> {formLoading ? "Loading..." : "Add Panel"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-white dark:bg-zinc-900 dark:border-border">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                startIcon={Search}
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-xs text-sm h-8"
                disabled={loading}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Role
                    {roleFilter.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted dark:bg-zinc-800">
                        {roleFilter.length > 1 ? `${roleFilter.length} selected` : roleFilter[0]}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1 dark:bg-zinc-900 dark:text-muted-foreground" side="bottom" align="start">
                  {["Chairperson", "Panel Member"].map((role) => (
                    <div
                      key={role}
                      onClick={() => setRoleFilter((rf) => (rf.includes(role) ? rf.filter((x) => x !== role) : [...rf, role]))}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Checkbox checked={roleFilter.includes(role)} />
                      <span className="text-sm">{role}</span>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setRoleFilter([])}>
                    Clear
                  </Button>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 px-3 rounded-md border-dashed text-xs flex items-center gap-1">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Status
                    {statusFilter.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-muted dark:bg-zinc-800">
                        {statusFilter.length > 1 ? `${statusFilter.length} selected` : statusFilter[0]}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1 dark:bg-zinc-900 dark:text-muted-foreground" side="bottom" align="start">
                  {["Assigned", "Not Assigned"].map((status) => (
                    <div
                      key={status}
                      onClick={() => setStatusFilter((sf) => (sf.includes(status) ? sf.filter((x) => x !== status) : [...sf, status]))}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Checkbox checked={statusFilter.includes(status)} />
                      <span className="text-sm">{status}</span>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setStatusFilter([])}>
                    Clear
                  </Button>
                </PopoverContent>
              </Popover>

              {(roleFilter.length > 0 || statusFilter.length > 0 || query.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1"
                  onClick={() => {
                    setRoleFilter([]);
                    setStatusFilter([]);
                    setQuery('');
                  }}
                >
                  <X size={14} /> Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <PanelistsListTable
          panelists={hydrated}
          paymentRates={paymentRates}
          onEdit={(p) => { setEditing(p as unknown as Panelist); setModalOpen(true); }}
          onDelete={handleDelete}
          selected={selected}
          setSelected={setSelected}
          loading={loading}
        />

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white dark:bg-muted dark:text-muted-foreground border border-border dark:border-border shadow-lg rounded-lg px-4 py-1 text-xs">
            <span className="font-semibold min-w-[70px] text-center">{selected.length} selected</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1" onClick={handleBulkDelete} aria-label="Delete" disabled={loading}>
                <Trash2 size={13} />
                <span className="hidden sm:inline">{loading ? "Deleting..." : "Delete"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1" onClick={() => handleBulkStatus("Assigned")} aria-label="Set Assigned" disabled={loading}>
                <CheckCircle size={13} className="text-green-500" />
                <span className="hidden sm:inline">{loading ? "Updating..." : "Set Assigned"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1" onClick={() => handleBulkStatus("Not Assigned")} aria-label="Set Not Assigned" disabled={loading}>
                <CircleX size={13} className="text-red-500" />
                <span className="hidden sm:inline">{loading ? "Updating..." : "Set Not Assigned"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="px-1 py-1 h-7 w-auto text-xs flex items-center" onClick={() => setSelected([])} aria-label="Clear selection">
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Modal */}
        <PanelistFormModal
          open={modalOpen}
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />
      </div>
    </AppLayout>
  );
}
