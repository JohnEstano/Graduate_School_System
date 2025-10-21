// resources/js/Pages/coordinator/panelists/panelist-form-modal.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
          <DialogTitle>
            {editing ? "Edit Panelist" : "Add Panelist"}
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {editing
              ? "Update the details of this panelist."
              : "Fill out the form below to add a new panelist."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div>
            <Label htmlFor="panelist-name">Name</Label>
            <Input
              id="panelist-name"
              placeholder="e.g. Dr. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <small className="text-muted-foreground">
              Enter the full name of the panelist.
            </small>
          </div>

          <div>
            <Label htmlFor="panelist-email">Email</Label>
            <Input
              id="panelist-email"
              type="email"
              placeholder="e.g. janedoe@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
            <small className="text-muted-foreground">
              Enter a valid email address.
            </small>
          </div>

          {/* Example for role and status if you want to add them back:
          <div>
            <Label htmlFor="panelist-role">Role</Label>
            <Select
              id="panelist-role"
              value={role}
              onValueChange={setRole}
              disabled={loading}
            >
              {ROLES.map((r) => (
                <Select.Item key={r} value={r}>{r}</Select.Item>
              ))}
            </Select>
            <small className="text-muted-foreground">
              Select the role of the panelist.
            </small>
          </div>
          */}

          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" onClick={onClose} type="button" disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? (editing ? "Saving..." : "Adding...")
                  : (editing ? "Save changes" : "Add Panelist")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
