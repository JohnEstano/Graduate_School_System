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
  loading?: boolean;
};

const ROLES = ["Chairperson", "Panel Member"] as const;
const STATUSES = ["Assigned", "Not Assigned"] as const;

export default function PanelistFormModal({ open, editing, onClose, onSubmit, loading = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Panelist["role"]>("Panel Member");
  const [status, setStatus] = useState<Panelist["status"]>("Not Assigned");

  useEffect(() => {
    if (editing) {
      setName(editing.name || "");
      setEmail(editing.email || "");
      setRole(editing.role || "Panel Member");
      setStatus(editing.status || "Not Assigned");
    } else {
      setName("");
      setEmail("");
      setRole("Panel Member");
      setStatus("Not Assigned");
    }
  }, [editing, open]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Name and email are required");
      return;
    }
    if (loading) return;
    onSubmit(
      {
        name: name.trim(),
        email: email.trim(),
        role,
        status,
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
            <Label>Role</Label>
            <Select value={role} onValueChange={(value: Panelist["role"]) => setRole(value)} disabled={loading}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: Panelist["status"]) => setStatus(value)} disabled={loading}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
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
