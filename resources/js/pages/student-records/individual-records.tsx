import { Head } from "@inertiajs/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: number;
  payment_date: string;
  defense_status: string;
  amount: string;
  defense_date?: string;
  defense_type?: string;
  or_number?: string;
  panelist_total?: number;
  rec_fee?: number;
  school_share?: number;
  grand_total?: number;
  panelists?: {
    role: string;
    name: string;
    amount: string;
  }[];
}

interface StudentRecord {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  school_year: string | null;
  student_id: string | null;
  course_section: string | null;
  birthdate: string | null;
  academic_status: string | null;
  or_number: string | null;
  defense_date: string | null;
  defense_type: string | null;
  payments?: Payment[];
}

interface IndividualRecordProps {
  record: StudentRecord | null;
  onClose: () => void;
}

export default function IndividualRecord({ record, onClose }: IndividualRecordProps) {
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

  return (
    <Dialog
      open={!!record}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl min-w-280 min-h-90 w-full max-h-[90vh] flex flex-col p-0 gap-0">
        {record && (
          <>
            {/* Header with Close Button */}
            <DialogHeader className="sticky top-0 z-20 bg-white dark:bg-[#121212] border-b p-4 flex flex-row justify-between items-center m-2">
              <div>
                <DialogTitle>
                  {`${record.first_name} ${record.middle_name || ""} ${record.last_name}`.trim()}
                </DialogTitle>
                <DialogDescription>
                  Student ID: {record.student_id || "-"}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button
                  className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground 
                 absolute top-4 right-4 rounded-xs opacity-70 transition-opacity 
                 hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden 
                 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 
                 [&_svg:not([class*='size-'])]:size-4"
                  aria-label="Close"
                >
                  <X />
                </button>
              </DialogClose>
            </DialogHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto py-2 px-6">
              <Head title="Individual Record" />

              <div className="rounded-md overflow-x-auto border bg-white dark:bg-[#121212] p-4">
                {/* Student Info */}
                <div className="overflow-x-auto border-b bg-white dark:bg-[#121212] p-4">
                  <div className="flex items-start space-x-6">
                    <Avatar className="w-36 h-36 mt-5">
                      <AvatarFallback className="text-4xl">
                        {record.first_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 pt-2">
                      <div>
                        <p className="text-sm text-gray-500">First Name</p>
                        <p className="font-medium">{record.first_name}</p>
                        <p className="text-sm text-gray-500 mt-4">Middle Name</p>
                        <p className="font-medium">{record.middle_name || '-'}</p>
                        <p className="text-sm text-gray-500 mt-4">Last Name</p>
                        <p className="font-medium">{record.last_name}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-medium">{record.gender || '-'}</p>
                        <p className="text-sm text-gray-500 mt-4">School Year</p>
                        <p className="font-medium">{record.school_year || '-'}</p>
                        <p className="text-sm text-gray-500 mt-4">Student ID</p>
                        <p className="font-medium">{record.student_id || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Course & Section</p>
                        <p className="font-medium">{record.course_section || '-'}</p>
                        <p className="text-sm text-gray-500 mt-4">Birthdate</p>
                        <p className="font-medium">
                          {record.birthdate ? new Date(record.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                        </p>
                        <p className="text-sm text-gray-500 mt-4">Academic Status</p>
                        <p className="font-medium">{record.academic_status || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Defense Schedule</h2>
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Defense Date</TableHead>
                        <TableHead>Defense Type</TableHead>
                        <TableHead>Defense Status</TableHead>
                        <TableHead>OR Number</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {record.payments && record.payments.length > 0 ? (
                        record.payments.map((payment) => (
                          <>
                            {/* Payment row */}
                            <TableRow
                              key={payment.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() =>
                                setExpandedPayment(expandedPayment === payment.id ? null : payment.id)
                              }
                            >
                              <TableCell className="w-8">
                                {expandedPayment === payment.id ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </TableCell>

                              <TableCell>
                                {payment.defense_date 
                                  ? new Date(payment.defense_date).toLocaleDateString('en-CA') 
                                  : (record.defense_date 
                                      ? new Date(record.defense_date).toLocaleDateString('en-CA')
                                      : "-")}
                              </TableCell>
                              <TableCell>{payment.defense_type || record.defense_type || "-"}</TableCell>
                              <TableCell>{payment.defense_status || "-"}</TableCell>
                              <TableCell>{payment.or_number || record.or_number || "-"}</TableCell>
                              <TableCell>
                                {payment.payment_date 
                                  ? new Date(payment.payment_date).toLocaleDateString('en-CA')
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                ₱{Number(payment.amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/student-records/${record.id}/download-pdf?payment_id=${payment.id}`, '_blank');
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Expanded panelists row */}
                            {expandedPayment === payment.id && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-gray-50 dark:bg-gray-900/50 p-4">
                                  <div className="rounded-md overflow-hidden">
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-3 px-1">
                                      Payment Breakdown:
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm border-separate border-spacing-0">
                                        <thead>
                                          <tr>
                                            <th className="py-2 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Panelist Name</th>
                                            <th className="py-2 px-4 text-left font-medium text-gray-500 dark:text-gray-400">Role</th>
                                            <th className="py-2 px-4 text-right font-medium text-gray-500 dark:text-gray-400">Honorarium Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {payment.panelists && payment.panelists.length > 0 ? (
                                            <>
                                              {payment.panelists.map((p, i) => (
                                                <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                                  <td className="py-2 px-4">{p.name || '-'}</td>
                                                  <td className="py-2 px-4">{p.role || '-'}</td>
                                                  <td className="py-2 px-4 text-right font-medium">
                                                    {p.amount === '-' ? '-' : `₱${Number(p.amount || 0).toLocaleString(undefined, {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2
                                                    })}`}
                                                  </td>
                                                </tr>
                                              ))}
                                              {/* Total Row */}
                                              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold">
                                                <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                                                <td className="py-3 px-4 text-right text-lg">
                                                  ₱{Number((payment as any).grand_total || payment.amount || 0).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                  })}
                                                </td>
                                              </tr>
                                            </>
                                          ) : (
                                            <tr>
                                              <td colSpan={3} className="text-center py-3 text-gray-500">
                                                No panelist breakdown available.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            No payments found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
