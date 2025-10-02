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
      <div className="rounded-md overflow-x-auto border border-border bg-white w-full max-w-full">
        <Table>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Receivables</TableHead>
              <TableHead className="text-center">Actions</TableHead>
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
                <TableRow key={panelist.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(panelist.id)}
                      onCheckedChange={(checked) =>
                        handleSelect(panelist.id, !!checked)
                      }
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell>{panelist.name}</TableCell>
                  <TableCell>{panelist.email}</TableCell>
        
                  <TableCell>
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
                  <TableCell>
                    {panelist.assignments && panelist.assignments.length > 0
                      ? "Assigned"
                      : "Not Assigned"}
                  </TableCell>
                  {/* Type column (no thesis title) */}
                  <TableCell>
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
                  {/* Receivables column: just the amount, no thesis title */}
                  <TableCell>
                    {panelist.assignments && panelist.assignments.length > 0 ? (
                      <ul>
                        {panelist.assignments.map((a) => {
                          const spec = honorariumSpecs.find(
                            (s) => s.defense_type === a.defense_type && s.role === a.role
                          );
                          return (
                            <li key={a.id}>
                              {spec && spec.amount !== undefined && spec.amount !== null && spec.amount !== ""
                                ? `₱${spec.amount}`
                                : "-"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
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
        <DialogContent>
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
              className=" text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
