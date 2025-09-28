"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Payment {
  id: number;
  defense_status: string;
  payment_date: string;
  amount: number;
}

interface Student {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  program?: string;
  course_section?: string;
  school_year?: string;
  or_number?: string;
  defense_date?: string | null;  // ✅ added from DB migration
  defense_type?: string | null;  // ✅ added from DB migration
  payments: Payment[];
}

interface Panelist {
  id: number;
  pfirst_name: string;
  pmiddle_name?: string;
  plast_name: string;
  role: string;
  defense_type?: string;
  received_date?: string;
  amount?: number;
  students?: Student[];
}

interface Props {
  panelist: Panelist | null;
  onClose: () => void;
}

export default function PanelistIndividualRecord({ panelist, onClose }: Props) {
  return (
    <Dialog
      open={!!panelist}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl min-w-350 min-h-90 w-full max-h-[90vh] overflow-y-auto">
        {panelist && (
          <>
            <DialogHeader>
              <DialogTitle>
                {`${panelist.pfirst_name} ${panelist.pmiddle_name || ""} ${
                  panelist.plast_name
                }`.trim()}
              </DialogTitle>
              <DialogDescription>
                {/* Role: {panelist.role} | Panelist defense type:{" "}
                {panelist.defense_type || "N/A"} */}
              </DialogDescription>
            </DialogHeader>

            <h4 className="font-semibold text-gray-600 mt-4 mb-2">
              Breakdown of Receivables:
            </h4>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Student Name</th>
                    <th className="px-3 py-2 text-left">Panelist Role</th>
                    <th className="px-3 py-2 text-left">Program / Section</th>
                    <th className="px-3 py-2 text-left">Defense Date</th>
                    <th className="px-3 py-2 text-left">Defense Type</th>
                    <th className="px-3 py-2 text-left">Defense Status</th>
                    <th className="px-3 py-2 text-left">Payment Date</th>
                    <th className="px-3 py-2 text-left">OR Number</th>
                    <th className="px-3 py-2 text-right">Honorarium</th>
                  </tr>
                </thead>
                <tbody>
                  {(panelist.students || []).flatMap((student) =>
                    (student.payments || []).map((pay) => (
                      <tr
                        key={`${student.id}-${pay.id}`}
                        className="border-t border-gray-200"
                      >
                        <td className="px-3 py-2">{`${student.first_name} ${
                          student.middle_name || ""
                        } ${student.last_name}`}</td>
                       <td className="px-3 py-2">
  {panelist.defense_type === student.defense_type ? panelist.role : "-"}
</td>
                        <td className="px-3 py-2">
                          {student.program ? `${student.program} / ` : ""}
                          {student.course_section || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {student.defense_date
                            ? new Date(student.defense_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {student.defense_type || "-"}
                        </td>
                        <td className="px-3 py-2">{pay.defense_status || "-"}</td>
                        <td className="px-3 py-2">
                          {pay.payment_date
                            ? new Date(pay.payment_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2">{student.or_number || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          ₱{Number(pay.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
