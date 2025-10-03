import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import type { PanelistHonorariumSpec } from "@/types";

const ROLES = ["Chairperson", "Panel Member"] as const;
const DEFENSE_TYPES = ["Proposal", "Prefinal", "Final"] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  honorariumSpecs: PanelistHonorariumSpec[];
  onChange: (specs: PanelistHonorariumSpec[]) => void;
  onSave: () => void;
  saving: boolean;
};

export default function HonorariumRatesDialog({
  open,
  onOpenChange,
  honorariumSpecs,
  onChange,
  onSave,
  saving,
}: Props) {
  // Build a matrix for easy editing
  const matrix: Record<string, Record<string, PanelistHonorariumSpec>> = {};
  for (const role of ROLES) {
    matrix[role] = {};
    for (const dtype of DEFENSE_TYPES) {
      matrix[role][dtype] =
        honorariumSpecs.find((s) => s.role === role && s.defense_type === dtype) || {
          id: 0,
          role,
          defense_type: dtype,
          amount: "",
        };
    }
  }

  function handleSpecChange(role: string, dtype: string, value: string) {
    onChange(
      (() => {
        const idx = honorariumSpecs.findIndex((s) => s.role === role && s.defense_type === dtype);
        if (idx >= 0) {
          const updated = [...honorariumSpecs];
          updated[idx] = { ...updated[idx], amount: value };
          return updated;
        }
        return [
          ...honorariumSpecs,
          { id: 0, role: role as any, defense_type: dtype as any, amount: value },
        ];
      })()
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Panelist Honorarium Rates</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              {DEFENSE_TYPES.map((dtype) => (
                <TableHead key={dtype}>{dtype}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROLES.map((role) => (
              <TableRow key={role}>
                <TableCell className="font-semibold">{role}</TableCell>
                {DEFENSE_TYPES.map((dtype) => (
                  <TableCell key={dtype}>
                    <Input
                      type="number"
                      min={0}
                      value={matrix[role][dtype].amount}
                      onChange={(e) => handleSpecChange(role, dtype, e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Rates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}