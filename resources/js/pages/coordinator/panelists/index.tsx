// resources/js/Pages/coordinator/panelists/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PanelistsListTable from './panelists-list-table';
import PanelistFormModal from './panelists-form-modal';
import { Toaster, toast } from 'sonner';
import { CheckCircle, CircleX, X, Trash2, Search } from 'lucide-react';
import { Users } from "lucide-react";

const breadcrumbs = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Panelists", href: "/panelists" },
];

type Panelist = {
  id: number;
  name: string;
  email: string;
  status: "Available" | "Not Available";
  date_available: string | null;
  created_at: string;
  updated_at: string;
};

export default function PanelistsPage() {
  const { panelists: initialPanelists = [] } = usePage().props as { panelists?: Panelist[] };

  const [panelists, setPanelists] = useState<Panelist[]>(initialPanelists);
  const [selected, setSelected] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Panelist | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false); // NEW: global loading for bulk actions
  const [formLoading, setFormLoading] = useState(false); // NEW: loading for modal form

  useEffect(() => {
    setPanelists(initialPanelists);
  }, [initialPanelists]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return panelists;
    return panelists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    );
  }, [query, panelists]);

  function handleFormSubmit(
    data: Omit<Panelist, "id" | "created_at" | "updated_at">,
    id?: number,
    done?: () => void
  ) {
    setFormLoading(true);
    if (id) {
      router.put(
        `/panelists/${id}`,
        data,
        {
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
        }
      );
    } else {
      router.post(
        "/panelists",
        data,
        {
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
        }
      );
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
    router.post(
      "/panelists/bulk-delete",
      { ids: selected },
      {
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
      }
    );
  }

  function handleBulkStatus(status: Panelist["status"]) {
    if (selected.length === 0) return;
    setLoading(true);
    router.post(
      "/panelists/bulk-status",
      { ids: selected, status },
      {
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
      }
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Panelists" />
      <Toaster richColors position="bottom-right" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative">
        {/* Header row */}
        <div className="w-full bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                <Users className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">
                Panelists
                </span>
                <span className="block text-xs text-muted-foreground">
                  This section shows all defense panelists. Add, search, and manage panelists.
                </span>
              </div>
            </div>
            <Button onClick={() => { setModalOpen(true); setEditing(null); }} disabled={formLoading || loading}>
              {formLoading ? "Loading..." : "Add Panel"}
            </Button>
          </div>
          {/* Search bar row */}
          <div className="flex items-center px-4 py-3 border-b bg-white">
            <Input
              type="text"
              startIcon={Search}
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="max-w-xs text-sm py-1 h-8"
              disabled={loading}
            />
          </div>
        </div>

        {/* Table */}
        <PanelistsListTable
          panelists={filtered}
          onEdit={(p) => {
            setEditing(p);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          selected={selected}
          setSelected={setSelected}
          loading={loading}
        />

        {/* Floating Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="fixed left-1/2 z-30 -translate-x-1/2 bottom-4 md:bottom-6 flex items-center gap-1 bg-white border border-border shadow-lg rounded-lg px-4 py-1 text-xs animate-in fade-in slide-in-from-bottom-2 dark:bg-muted dark:text-muted-foreground dark:border-border">
            <span className="font-semibold min-w-[70px] text-center">{selected.length} selected</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={handleBulkDelete}
                aria-label="Delete"
                disabled={loading}
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">{loading ? "Deleting..." : "Delete"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => handleBulkStatus("Available")}
                aria-label="Set Available"
                disabled={loading}
              >
                <CheckCircle size={13} className="text-green-500" />
                <span className="hidden sm:inline">{loading ? "Updating..." : "Set Available"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-2 py-1 h-7 w-auto text-xs flex items-center gap-1"
                onClick={() => handleBulkStatus("Not Available")}
                aria-label="Set Not Available"
                disabled={loading}
              >
                <CircleX size={13} className="text-red-500" />
                <span className="hidden sm:inline">{loading ? "Updating..." : "Set Not Available"}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="px-1 py-1 h-7 w-auto text-xs flex items-center"
                onClick={() => setSelected([])}
                aria-label="Clear selection"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Modal */}
        <PanelistFormModal
          open={modalOpen}
          editing={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleFormSubmit}
          loading={formLoading}
        />
      </div>
    </AppLayout>
  );
}
