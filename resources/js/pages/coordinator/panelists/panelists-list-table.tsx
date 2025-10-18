import React, { useState } from "react";
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
import { Pencil, Trash2 } from "lucide-react";
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

  // Dialog state
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
