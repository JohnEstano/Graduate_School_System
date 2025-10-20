import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, Mail, MessageCircle, RefreshCw, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AvatarFallback } from "@/components/ui/avatar";
import type { PanelistWithAssignments, PanelistHonorariumSpec } from "@/types";

type Props = {
  panelists: PanelistWithAssignments[];
  honorariumSpecs: PanelistHonorariumSpec[];
  onEdit: (panelist: PanelistWithAssignments) => void;
  onDelete: (id: number) => void;
  selected: number[];
  setSelected: (ids: number[]) => void;
  loading?: boolean;
};

export default function PanelistsListTable({
  panelists,
  honorariumSpecs,
  onEdit,
  onDelete,
  selected,
  setSelected,
  loading = false,
}: Props) {
  const allIds = panelists.map((p) => p.id);

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? allIds : []);
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelected(
      checked ? [...selected, id] : selected.filter((sid) => sid !== id)
    );
  };

  // Dialog state (delete)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const openDeleteDialog = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      onDelete(pendingDeleteId);
      closeDeleteDialog();
    }
  };

  // --- View Panelist / Defenses Dialog ---
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPanelist, setViewPanelist] = useState<PanelistWithAssignments | null>(null);
  const [assignments, setAssignments] = useState<NonNullable<PanelistWithAssignments["assignments"]>>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Add tab state
  const [panelistTab, setPanelistTab] = useState<"assignments" | "pending">("assignments");

  // Add pending assignments state
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);

  const openView = (p: PanelistWithAssignments) => {
    setViewPanelist(p);
    setAssignments(p.assignments ?? []);
    setPanelistTab("assignments");
    setViewOpen(true);

    // Fetch pending assignments (replace with your API endpoint)
    axios.get(`/api/coordinator/panelists/${p.id}/pending`)
      .then(res => setPendingAssignments(res.data))
      .catch(() => setPendingAssignments([]));
  };

  const refreshAssignments = async () => {
    if (!viewPanelist) return;
    setAssignmentsLoading(true);
    try {
      // try to fetch fresh data from API; falls back to existing data if API isn't available
      const res = await axios.get(`/api/coordinator/panelists/${viewPanelist.id}`);
      const fresh: PanelistWithAssignments = res.data;
      setAssignments(fresh.assignments ?? []);
      // also update viewPanelist basic fields if returned
      setViewPanelist((prev) => (prev ? { ...prev, ...fresh } : fresh));
    } catch (e) {
      // ignore - keep local assignments
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!viewOpen) {
      setViewPanelist(null);
      setAssignments([]);
    }
  }, [viewOpen]);

  return (
    <>
      <div className="rounded-md overflow-x-auto border border-border bg-background w-full max-w-full" style={{ minWidth: "700px" }}>
        <Table className="w-full text-sm table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selected.length > 0 && selected.length === panelists.length
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  disabled={loading}
                />
              </TableHead>
              <TableHead className="px-3 min-w-[120px]">Name</TableHead>
              {/* Email column before Assigned Defenses */}
              <TableHead className="px-2 min-w-[120px]">Email</TableHead>
              <TableHead className="px-2 min-w-[80px] text-center">Assigned Defenses</TableHead>
              <TableHead className="text-center px-2">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {panelists.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No panelists found.
                </TableCell>
              </TableRow>
            ) : (
              panelists.map((panelist) => (
                <TableRow className="hover:bg-muted/40 cursor-pointer transition" key={panelist.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(panelist.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(panelist.id, !!checked)
                      }
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle">
                    {panelist.name}
                  </TableCell>
                  {/* Email column */}
                  <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {panelist.email}
                  </TableCell>
                  {/* Assigned Defenses column */}
                  <TableCell className="px-2 py-2 text-center align-middle">
                    {panelist.assignments ? panelist.assignments.length : 0}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="View panelist"
                        onClick={() => openView(panelist)}
                        disabled={loading}
                      >
                        <Users size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit panelist"
                        onClick={() => onEdit(panelist)}
                        disabled={loading}
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete panelist"
                        onClick={() => openDeleteDialog(panelist.id)}
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog: detailed defenses list (copied design from show-advisers) */}
      <Dialog open={viewOpen} onOpenChange={(open) => setViewOpen(open)}>
        <DialogContent
          className="max-w-2xl dark:bg-zinc-800"
          style={{ minWidth: "520px", maxWidth: "640px" }} // Match advisers dialog width
        >
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">
              Panelist Information
            </DialogTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                <User className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {viewPanelist?.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{viewPanelist?.email}</span>
                  <button
                    className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                    style={{ height: "22px" }}
                    title="Send Gmail"
                    onClick={() => {
                      if (viewPanelist?.email) {
                        window.open(
                          `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(viewPanelist.email)}`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    <Mail size={14} className="text-zinc-500 dark:text-zinc-300" />
                    Gmail
                  </button>
                  <button
                    className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                    style={{ height: "22px" }}
                    title="Open Google Chat"
                    onClick={() => {
                      if (viewPanelist?.email) {
                        window.open(
                          `https://mail.google.com/chat/u/0/#chat/user/${encodeURIComponent(viewPanelist.email)}`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    <MessageCircle size={14} className="text-zinc-500 dark:text-zinc-300" />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            <Tabs value={panelistTab} onValueChange={(value: string) => setPanelistTab(value as "assignments" | "pending")}>
              <div className="flex items-center justify-between mb-2">
                <TabsList>
                  <TabsTrigger value="assignments">
                    Assigned
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-[11px] font-medium">
                      {assignments?.length ?? 0}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-[11px] font-medium">
                      {pendingAssignments?.length ?? 0}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={refreshAssignments}
                  disabled={assignmentsLoading}
                  title="Refresh defenses"
                >
                  <RefreshCw className={`mr-1 h-4 w-4 ${assignmentsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <TabsContent value="assignments">
                <div
                  className="overflow-y-auto overflow-x-auto min-w-[400px] rounded bg-white dark:bg-zinc-900 px-2 py-2"
                  style={{ height: "240px" }} // Match advisers dialog height
                >
                  {assignmentsLoading ? (
                    <div className="text-xs flex items-center justify-center h-full dark:text-zinc-300">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading defenses...
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="text-gray-500 text-xs flex items-center justify-center h-full dark:text-gray-400">
                      No defenses assigned to this panelist.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {assignments.map((a) => {
                        let amount = a.receivable;
                        if (
                          (amount === undefined || amount === null || amount === "") &&
                          honorariumSpecs.length > 0
                        ) {
                          const spec = honorariumSpecs.find(
                            (s) =>
                              s.defense_type === a.defense_type &&
                              s.role === (a.role ?? viewPanelist?.role)
                          );
                          amount = spec?.amount;
                        }
                        return (
                          <li key={a.id} className="py-3 px-2 flex items-start gap-3 text-sm">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{a.thesis_title ?? "Untitled Thesis"}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                Role: <b className="mx-1">{a.role ?? viewPanelist?.role ?? "-"}</b>
                                • Type: <b className="mx-1">{a.defense_type}</b>
                                • Receivable: <b className="mx-1">{amount ? `₱${amount}` : "-"}</b>
                              </div>
                              {a.thesis_title && (
                                <div className="text-xs text-muted-foreground mt-2 italic">{a.thesis_title}</div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pending">
                <div
                  className="overflow-y-auto overflow-x-auto min-w-[400px] rounded bg-white dark:bg-zinc-900 px-2 py-2"
                  style={{ height: "240px" }} // Match advisers dialog height
                >
                  {pendingAssignments.length === 0 ? (
                    <div className="text-gray-500 text-xs flex items-center justify-center h-full dark:text-gray-400">
                      No pending defenses for this panelist.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {pendingAssignments.map((a) => (
                        <li key={a.id} className="py-3 px-2 flex items-start gap-3 text-sm">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{a.thesis_title ?? "Untitled Thesis"}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              Role: <b className="mx-1">{a.role ?? "-"}</b>
                              • Type: <b className="mx-1">{a.defense_type}</b>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" onClick={() => setViewOpen(false)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shadcn Dialog for Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-background text-muted-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="text-muted-foreground text-sm">
            This will delete the panelist. This action cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={closeDeleteDialog}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className="text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-semibold text-sm">
      {initials}
    </div>
  );
}
