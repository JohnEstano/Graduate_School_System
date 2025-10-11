import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { router } from "@inertiajs/react";

const PROGRAM_LEVELS = ["Masteral", "Doctorate"] as const;
const DEFENSE_TYPES = ["Proposal", "Pre-final", "Final"] as const;
const TYPES = [
  "Adviser",
  "Panel Chair",
  "Panel Member 1",
  "Panel Member 2",
  "Panel Member 3",
  "REC Fee",
  "School Share",
];

type Rate = {
  id?: number;
  program_level: string;
  type: string;
  defense_type: string;
  amount: string | number;
};

type Props = {
  rates: Rate[];
};

export default function PaymentRatesPage({ rates: initialRates }: Props) {
  const [rates, setRates] = useState<Rate[]>(initialRates);
  const [edit, setEdit] = useState<{
    program_level: string;
    type: string;
    values: { [defense_type: string]: string };
    idxs: { [defense_type: string]: number };
  } | null>(null);
  const [saving, setSaving] = useState(false);

  function openEdit(program_level: string, type: string, idxs: { [defense_type: string]: number }) {
    setEdit({
      program_level,
      type,
      values: {
        Proposal: rates[idxs.Proposal]?.amount?.toString() ?? "",
        "Pre-final": rates[idxs["Pre-final"]]?.amount?.toString() ?? "",
        Final: rates[idxs.Final]?.amount?.toString() ?? "",
      },
      idxs,
    });
  }

  function closeEdit() {
    setEdit(null);
  }

  async function saveEdit() {
    if (!edit) return;
    setSaving(true);
    try {
      const updates: Rate[] = [];
      for (const dtype of DEFENSE_TYPES) {
        const idx = edit.idxs[dtype];
        updates.push({
          program_level: edit.program_level,
          type: edit.type,
          defense_type: dtype,
          amount: edit.values[dtype] || 0,
        });
      }
      const res = await fetch("/dean/payment-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
        },
        body: JSON.stringify({ rates: updates }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        const text = await res.text();
        toast.error("Server error: " + text);
        setSaving(false);
        return;
      }

      if (res.ok && data.success) {
        // Fetch the latest rates from the backend
        const ratesRes = await fetch("/dean/payment-rates/data", {
          headers: {
            "Accept": "application/json",
          },
        });
        const latest = await ratesRes.json();
        setRates(latest.rates);
        toast.success("Rates updated!");
        closeEdit();
      } else if (res.status === 422 && data && data.errors) {
        const messages = Object.values(data.errors).flat().join(" | ");
        toast.error("Validation error: " + messages);
      } else {
        toast.error("Failed to update rates: " + (data?.message || res.status));
      }
    } catch (e) {
      const message = typeof e === "object" && e !== null && "message" in e ? (e as any).message : String(e);
      toast.error("Network or server error: " + message);
    } finally {
      setSaving(false);
    }
  }

  function getRows(program_level: string) {
    // Group by type, then by defense_type
    return TYPES.map(type => {
      const row: {
        type: string;
        values: (Rate | undefined)[];
        idxs: { [defense_type: string]: number };
      } = {
        type,
        values: [],
        idxs: {},
      };
      for (const dtype of DEFENSE_TYPES) {
        const idx = rates.findIndex(
          r =>
            r.program_level === program_level &&
            r.type === type &&
            r.defense_type === dtype
        );
        row.values.push(idx !== -1 ? rates[idx] : undefined);
        row.idxs[dtype] = idx;
      }
      return row;
    });
  }

  function getTotal(program_level: string, defense_type: string) {
    return rates
      .filter(r => r.program_level === program_level && r.defense_type === defense_type)
      .reduce((sum, r) => sum + (parseFloat(r.amount as string) || 0), 0)
      .toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Payment Rates", href: "/dean/payment-rates" }]}>
      <Head title="Payment Rates" />
      <div className="w-full px-0 py-8">
        <h1 className="text-2xl font-bold mb-6 px-6">Graduate School Payment Rates</h1>
        {PROGRAM_LEVELS.map(program_level => (
          <div key={program_level} className="mb-10 w-full overflow-x-auto">
            <h2 className="text-lg font-semibold mb-2 px-6">{program_level}</h2>
            <div className="w-full min-w-[900px] px-6">
              <Table className="border border-border rounded-xl overflow-hidden">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    {DEFENSE_TYPES.map(dtype => (
                      <TableHead key={dtype} className="text-xs">{dtype} Defense</TableHead>
                    ))}
                    <TableHead className="text-xs">Total</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getRows(program_level).map((row, rowIdx) => (
                    <TableRow key={row.type}>
                      <TableCell className="font-semibold text-xs">{row.type}</TableCell>
                      {DEFENSE_TYPES.map((dtype, colIdx) => (
                        <TableCell key={dtype} className="text-xs">
                          ₱{row.values[colIdx]?.amount ? parseFloat(row.values[colIdx]?.amount as string).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                        </TableCell>
                      ))}
                      <TableCell className="font-bold text-xs">
                        {row.values
                          .reduce(
                            (sum, r) => sum + (parseFloat(r?.amount as string) || 0),
                            0
                          )
                          .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={() => openEdit(program_level, row.type, row.idxs)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow>
                    <TableCell className="font-bold text-xs">TOTAL</TableCell>
                    {DEFENSE_TYPES.map(dtype => (
                      <TableCell key={dtype} className="font-bold text-xs">
                        {getTotal(program_level, dtype)}
                      </TableCell>
                    ))}
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
        {/* Edit Dialog */}
        <Dialog open={!!edit} onOpenChange={closeEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rates</DialogTitle>
            </DialogHeader>
            {edit !== null && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Program Level</div>
                    <div className="font-medium text-xs">{edit.program_level}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Type</div>
                    <div className="font-medium text-xs">{edit.type}</div>
                  </div>
                </div>
                <div>
                  <Table className="border border-border rounded-xl overflow-hidden">
                    <TableHeader>
                      <TableRow>
                        {DEFENSE_TYPES.map(dtype => (
                          <TableHead key={dtype} className="text-xs">{dtype} Defense</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {DEFENSE_TYPES.map(dtype => (
                          <TableCell key={dtype}>
                            <Input
                              type="number"
                              min={0}
                              value={edit.values[dtype]}
                              onChange={e =>
                                setEdit({
                                  ...edit,
                                  values: { ...edit.values, [dtype]: e.target.value },
                                })
                              }
                              className="w-32 text-xs"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeEdit} className="text-xs">
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving} className="text-xs">
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}