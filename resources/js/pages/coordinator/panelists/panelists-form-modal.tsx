// resources/js/Pages/coordinator/panelists/panelist-form-modal.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Panelist } from "@/types";

type Props = {
  open: boolean;
  editing: Panelist | null;
  onClose: () => void;
  onSubmit: (data: Omit<Panelist, "id" | "created_at" | "updated_at">, id?: number) => void;
  loading?: boolean; // NEW: loading prop
};

export default function PanelistFormModal({ open, editing, onClose, onSubmit, loading = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Panelist["status"]>("Available");
  const [dateAvailable, setDateAvailable] = useState<string>("");

  useEffect(() => {
    if (editing) {
      setName(editing.name || "");
      setEmail(editing.email || "");
      setStatus(editing.status || "Available");
      setDateAvailable(editing.date_available ? editing.date_available.split("T")[0] : "");
    } else {
      setName("");
      setEmail("");
      setStatus("Available");
      setDateAvailable("");
    }
  }, [editing, open]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }
    if (loading) return; // Prevent double submit
    onSubmit(
      {
        name: name.trim(),
        email: email.trim(),
        status,
        date_available: dateAvailable ? dateAvailable : null,
      },
      editing?.id,
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Panelist" : "Add Panelist"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: Panelist["status"]) => setStatus(value)} disabled={loading}>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </Select>
          </div>

          <div>
            <Label>Date Available</Label>
            <Input type="date" value={dateAvailable} onChange={(e) => setDateAvailable(e.target.value)} disabled={loading} />
            <p className="text-sm text-muted-foreground mt-1">Leave empty if not applicable.</p>
          </div>

          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" onClick={onClose} type="button" disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editing ? "Saving..." : "Adding...") : (editing ? "Save changes" : "Add Panelist")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
