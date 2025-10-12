import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Add this import
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FileDown } from "lucide-react"; 
import { Pencil } from "lucide-react"; // Add this import for the edit icon
import { Printer } from "lucide-react"; // Add this import for the printer icon

const PROGRAM_LEVELS = ["Masteral", "Doctorate"] as const;
const DEFENSE_TYPES = ["Proposal", "Pre-final", "Final"] as const;
const TYPES = [
  "Adviser",
  "Panel Chair",
  "Panel Member 1",
  "Panel Member 2",
  "Panel Member 3",
  "Panel Member 4", 
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
  const [tab, setTab] = useState<string>(PROGRAM_LEVELS[0]); // Add state for tab

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

  function displayAmount(val: string | number | undefined) {
    const num = parseFloat(val as string);
    if (!val || isNaN(num) || num === 0) return "--";
    return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  function getGrandTotal(program_level: string) {
    return rates
      .filter(r => r.program_level === program_level)
      .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0)
      .toLocaleString(undefined, { minimumFractionDigits: 2 });
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
      .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0)
      .toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  function exportTableToPrint(program_level: string) {
    const rows = getRows(program_level);
    const headers = ["Type", ...DEFENSE_TYPES.map(d => `${d} Defense`)];
    const data = rows.map(row => {
      const values = DEFENSE_TYPES.map((dtype, idx) => {
        const val = row.values[idx]?.amount;
        return val === undefined || val === null ? "--" : `₱${parseFloat(val as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      });
      return [row.type, ...values];
    });

    const totalRow = [
      "TOTAL",
      ...DEFENSE_TYPES.map(dtype => {
        const total = rates
          .filter(r => r.program_level === program_level && r.defense_type === dtype)
          .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
        return total === 0 ? "--" : `₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      }),
    ];

    // Dark mode support for print
    let html = `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #fff; color: #222;">
        <h2 style="margin-bottom: 16px;">${program_level} Payment Rates</h2>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; min-width: 600px; font-size: 13px;">
          <thead>
            <tr style="background: #f3f3f3;">
              ${headers.map(h => `<th style="font-weight: bold; text-align: left;">${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${row.map((cell, i) => `<td style="text-align: ${i === 0 ? "left" : "right"};">${cell}</td>`).join("")}
              </tr>
            `).join("")}
            <tr style="background: #f3f3f3; font-weight: bold;">
              ${totalRow.map((cell, i) => `<td style="text-align: ${i === 0 ? "left" : "right"};">${cell}</td>`).join("")}
            </tr>
          </tbody>
        </table>
        <style>
          @media (prefers-color-scheme: dark) {
            body, div { background: #18181b !important; color: #f3f3f3 !important; }
            table { background: #232329 !important; color: #f3f3f3 !important; }
            th, td { border-color: #444 !important; }
            tr { background: #232329 !important; }
            tr:nth-child(even) { background: #18181b !important; }
            tr[style*="background: #f3f3f3;"] { background: #232329 !important; }
          }
        </style>
      </div>
    `;

    // Open print window
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${program_level} Payment Rates</title>
          </head>
          <body>${html}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 300);
    }
  }

  return (
    <AppLayout breadcrumbs={[{ title: "Payment Rates", href: "/dean/payment-rates" }]}>
      <Head title="Payment Rates" />
      <div className="w-full px-0 py-8">
        {/* Header and description */}
        <div className="px-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">Payment Rates</h1>
          <p className="text-muted-foreground text-sm mb-4">
            View and manage payment rates for Masteral and Doctorate programs.
          </p>
        </div>
        {/* Tabs and Print Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 mb-6">
          <Tabs value={tab} onValueChange={setTab} className="">
            <TabsList>
              {PROGRAM_LEVELS.map(level => (
                <TabsTrigger key={level} value={level} className="text-sm">
                  {level}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm"
            onClick={() => exportTableToPrint(tab)}
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
        {/* Responsive Table */}
        <Tabs value={tab} onValueChange={setTab} className="px-2 sm:px-6">
          {PROGRAM_LEVELS.map(program_level => (
            <TabsContent key={program_level} value={program_level}>
              <div className="mb-10 w-full overflow-x-auto">
                <h2 className="text-lg font-semibold mb-2">{program_level}</h2>
                <div className="w-full min-w-[700px]">
                  <div className="overflow-x-auto bg-white dark:bg-zinc-900 shadow-sm rounded-none">
                    <Table className="min-w-[700px] table-fixed">
                      <colgroup>
                        <col style={{ width: "180px" }} />
                        {DEFENSE_TYPES.map((_, i) => (
                          <col key={i} style={{ width: "140px" }} />
                        ))}
                        <col style={{ width: "100px" }} />
                      </colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium text-left">Type</TableHead>
                          {DEFENSE_TYPES.map(dtype => (
                            <TableHead key={dtype} className="text-xs font-medium text-end">{dtype} Defense</TableHead>
                          ))}
                          <TableHead className="text-xs font-medium text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRows(program_level).map((row, rowIdx) => (
                          <TableRow key={row.type} className={rowIdx % 2 === 0 ? "even:bg-zinc-50 dark:even:bg-zinc-800" : ""}>
                            <TableCell className="font-semibold text-xs text-left">{row.type}</TableCell>
                            {DEFENSE_TYPES.map((dtype, colIdx) => (
                              <TableCell key={dtype} className="text-xs text-end">
                                {displayAmount(row.values[colIdx]?.amount)}
                              </TableCell>
                            ))}
                            <TableCell className="text-xs text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-2 py-1 text-xs flex items-center gap-1 mx-auto"
                                onClick={() => openEdit(program_level, row.type, row.idxs)}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Total row */}
                        <TableRow className="bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-400 dark:border-zinc-700">
                          <TableCell className="font-bold text-xs text-left">TOTAL</TableCell>
                          {DEFENSE_TYPES.map(dtype => (
                            <TableCell key={dtype} className="font-bold text-xs text-end">
                              {(() => {
                                const total = rates
                                  .filter(r => r.program_level === program_level && r.defense_type === dtype)
                                  .reduce((sum, r) => sum + (parseFloat(String(r.amount)) || 0), 0);
                                return total === 0 ? "--" : total.toLocaleString(undefined, { minimumFractionDigits: 2 });
                              })()}
                            </TableCell>
                          ))}
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        {/* Edit Dialog */}
        <Dialog open={!!edit} onOpenChange={closeEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rates</DialogTitle>
            </DialogHeader>
            {edit !== null && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
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
                  <Table className="overflow-hidden">
                    <TableHeader>
                      <TableRow>
                        {DEFENSE_TYPES.map(dtype => (
                          <TableHead key={dtype} className="text-xs text-end">{dtype} Defense</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {DEFENSE_TYPES.map(dtype => (
                          <TableCell key={dtype} className="text-end">
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
                              className="w-32 text-xs mx-auto"
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