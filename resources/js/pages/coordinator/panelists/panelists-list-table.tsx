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
import type { Panelist } from "@/types/index";

type Props = {
  panelists: Panelist[];
  onEdit: (panelist: Panelist) => void;
  onDelete: (id: number) => void;
  selected: number[];
  setSelected: (ids: number[]) => void;
  loading?: boolean;
};

export default function PanelistsListTable({
  panelists,
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
        <Table className=" ">
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
              <TableHead>Status</TableHead>
              <TableHead>Date Available</TableHead>
              <TableHead className="text-center" >Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {panelists.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                  <TableCell>{panelist.status}</TableCell>
                  <TableCell>
                    {panelist.date_available
                      ? new Date(panelist.date_available).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="">
                    <div className="flex justify-center gap-1">
                      <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 p-1"
                      onClick={() => onEdit(panelist)}
                      disabled={loading}
                      aria-label="Edit"
                      >
                      <Pencil size={14} />
                      </Button>
                      <Button
                      size="icon"
                      className="h-7 w-7 p-1"
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
            This will delete the panelist.
            This action cannot be
            undone.
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
