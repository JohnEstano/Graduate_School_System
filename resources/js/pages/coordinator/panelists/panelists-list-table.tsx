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

  const openView = (p: PanelistWithAssignments) => {
    setViewPanelist(p);
    setAssignments(p.assignments ?? []);
    setViewOpen(true);
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
      <div className="rounded-md overflow-x-auto border border-border bg-background w-full max-w-full">
        <Table className="w-full text-sm table-auto">
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
              <TableHead className="px-2 min-w-[120px]">Email</TableHead>
              <TableHead className="px-2 min-w-[100px]">Role</TableHead>
              <TableHead className="px-2 min-w-[100px] text-center">Status</TableHead>
              <TableHead className="px-2 min-w-[100px]">Type</TableHead>
              <TableHead className="px-2 min-w-[100px]">Receivables</TableHead>
              <TableHead className="text-center px-2">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {panelists.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
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
                  <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {panelist.email}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {panelist.assignments && panelist.assignments.length > 0 ? (
                      <ul>
                        {panelist.assignments.map((a) => (
                          <li key={a.id}>{a.role ?? panelist.role ?? "-"}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Status */}
                  <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-center align-middle">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span
                          className={
                            panelist.assignments && panelist.assignments.length > 0
                              ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium cursor-pointer"
                              : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-medium cursor-pointer"
                          }
                        >
                          {panelist.assignments && panelist.assignments.length > 0
                            ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 inline-block" />
                                Assigned
                              </>
                            )
                            : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 inline-block" />
                                Not Assigned
                              </>
                            )
                          }
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 p-3 bg-background text-muted-foreground">
                        <div>
                          <div className="flex items-center gap-2">
                            <Avatar name={panelist.name} />
                            <div className="font-semibold text-sm">{panelist.name}</div>
                          </div>
                          <div className="my-2">
                            <div className="h-px bg-muted" />
                          </div>
                          {panelist.assignments && panelist.assignments.length > 0 ? (
                            <ul className="space-y-0.5">
                              {panelist.assignments
                                .filter((a) => a.thesis_title)
                                .map((a) => (
                                  <li
                                    key={a.id}
                                    className="flex items-center gap-2 text-xs italic truncate max-w-[180px]"
                                  >
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 inline-block" />
                                      Active
                                    </span>
                                    <span className="text-muted-foreground">{a.thesis_title}</span>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <div className="text-xs text-muted-foreground mt-1">
                              No active defenses.
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  {/* Type column */}
                  <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {panelist.assignments && panelist.assignments.length > 0 ? (
                      <ul>
                        {panelist.assignments.map((a) => (
                          <li key={a.id}>{a.defense_type}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Receivables column */}
                  <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                    {panelist.assignments && panelist.assignments.length > 0 ? (
                      <ul>
                        {panelist.assignments.map((a) => {
                          let amount = a.receivable;
                          if (
                            (amount === undefined || amount === null || amount === "") &&
                            honorariumSpecs.length > 0
                          ) {
                            const spec = honorariumSpecs.find(
                              (s) =>
                                s.defense_type === a.defense_type &&
                                s.role === (a.role ?? panelist.role)
                            );
                            amount = spec?.amount;
                          }
                          return (
                            <li key={a.id}>
                              {amount !== undefined && amount !== null && amount !== ""
                                ? `₱${amount}`
                                : "-"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 p-1 cursor-pointer"
                        onClick={() => openView(panelist)}
                        disabled={loading}
                        aria-label="View defenses"
                        title="View defenses"
                      >
                        <Users size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 p-1 cursor-pointer"
                        onClick={() => onEdit(panelist)}
                        disabled={loading}
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 p-1 cursor-pointer"
                        onClick={() => openDeleteDialog(panelist.id)}
                        disabled={loading}
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
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
        <DialogContent className="max-w-2xl dark:bg-zinc-800">
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
            <div className="flex items-center justify-between mb-2">
              <Tabs value="assignments" onValueChange={() => {}}>
                <TabsList>
                  <TabsTrigger value="assignments">
                    Defenses
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-[11px] font-medium">
                      {assignments?.length ?? 0}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
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
            </div>

            <div
              className="overflow-y-auto overflow-x-auto min-w-[400px] rounded"
              style={{ maxHeight: "320px" }}
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
                        <div className="flex flex-col items-end gap-2">
                          {/* potential actions per defense can be added here */}
                          <span className="text-xs text-muted-foreground">{/* created/updated info */}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
