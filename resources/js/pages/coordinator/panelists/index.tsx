// resources/js/Pages/coordinator/panelists/Index.tsx
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PanelistsListTable from './panelists-list-table';
import PanelistFormModal from './panelists-form-modal';
import { Toaster, toast } from 'sonner';

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
      <Toaster richColors position="bottom-right" /> {/* <-- changed to bottom-right */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7">
        {/* Header & Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Panelists</h1>
            <p className="text-muted-foreground text-sm">
              Add and manage defense panelists
            </p>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Input
              placeholder="Search by name, email or status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[220px]"
              disabled={loading}
            />
            <Button onClick={() => { setModalOpen(true); setEditing(null); }} disabled={formLoading || loading}>
              {formLoading ? "Loading..." : "Add Panel"}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="destructive"
            disabled={selected.length === 0 || loading}
            onClick={handleBulkDelete}
          >
            {loading ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button
            variant="outline"
            disabled={selected.length === 0 || loading}
            onClick={() => handleBulkStatus("Available")}
          >
            {loading ? "Updating..." : "Set Available"}
          </Button>
          <Button
            variant="outline"
            disabled={selected.length === 0 || loading}
            onClick={() => handleBulkStatus("Not Available")}
          >
            {loading ? "Updating..." : "Set Not Available"}
          </Button>
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
