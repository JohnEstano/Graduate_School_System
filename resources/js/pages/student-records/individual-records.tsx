"use client";

import { Head } from "@inertiajs/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Download, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface Payment {
  id: number;
  payment_date: string;
  defense_status: string;
  amount: string;
  total_amount: string;
  panelists?: {
    id?: number;
    role: string;
    pfirst_name: string;
    plast_name: string;
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

  // 🔹 PDF download function
  const handleDownloadPDF = async (payment: Payment) => {
    try {
      // Attempt backend PDF first
      const res = await axios.get(`/payments/${payment.id}/download-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payment-${payment.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (backendError) {
      console.warn("Backend PDF failed, using client-side fallback...", backendError);

      try {
        const element = document.getElementById(`payment-${payment.id}-pdf`);
        if (!element) return alert("PDF Export Error: content not found.");

        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);

        pdf.addImage(imgData, "PNG", 0, 0, imgProps.width * ratio, imgProps.height * ratio);
        pdf.save(`payment-${payment.id}.pdf`);
      } catch (clientError) {
        console.error("Client-side PDF generation failed:", clientError);
        alert("Failed to generate PDF. Please try again.");
      }
    }
  };

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
                          {record.birthdate ? new Date(record.birthdate).toLocaleDateString() : '-'}
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
                                {record.defense_date
                                  ? format(new Date(record.defense_date), "yyyy-MM-dd")
                                  : "-"}
                              </TableCell>
                              <TableCell>{record.defense_type || "-"}</TableCell>
                              <TableCell>{payment.defense_status || "-"}</TableCell>
                              <TableCell>{record.or_number || "-"}</TableCell>
                              <TableCell>{payment.payment_date || "-"}</TableCell>
                              <TableCell className="text-right">
                                ₱{Number(payment.amount).toFixed(2)}
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-md h-auto px-2 py-1 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("Edit clicked for payment", payment.id);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-md h-auto px-2 py-1 flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPDF(payment);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Hidden element for client-side PDF fallback */}
                            {/* Hidden element for client-side PDF fallback */}
                            <div
                              id={`payment-${payment.id}-pdf`}
                              style={{ position: "absolute", left: "-9999px" }}
                            >
                              <h3>Payment Summary</h3>
                              <p>Student: {record.first_name} {record.last_name}</p>
                              <p>Defense Date: {record.defense_date}</p>
                              <p>Defense Type: {record.defense_type}</p>
                              <p>Defense Status: {payment.defense_status}</p>
                              <p>Amount: ₱{Number(payment.amount).toFixed(2)}</p>
                              {payment.panelists && payment.panelists.map((p, i) => (
                                <p key={i}>{p.role}: {p.pfirst_name} {p.plast_name} ₱{Number(p.amount).toFixed(2)}</p>
                              ))}
                            </div>

                            {/* Expanded Panelist rows */}
                            {expandedPayment === payment.id && (
                              <TableRow>
                                <TableCell colSpan={8}>
                                  <div className="bg-gray-50 p-4 rounded-md">
                                    <h4 className="font-semibold text-gray-600 mb-3">
                                      Payment Breakdown
                                    </h4>
                                    <div className="border rounded-lg bg-white overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-gray-100">
                                            <TableHead className="font-medium w-1/4 py-3">Role</TableHead>
                                            <TableHead className="font-medium w-1/2 py-3">Panelist Name</TableHead>
                                            <TableHead className="font-medium w-1/4 text-right py-3">Amount</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {payment.panelists && payment.panelists.length > 0 ? (
                                            <>
                                              {payment.panelists.map((p, i) => (
                                                <TableRow key={`${payment.id}-${p.id || i}`} className="hover:bg-gray-50">
                                                  <TableCell className="font-medium py-3">{p.role || 'Not specified'}</TableCell>
                                                  <TableCell className="py-3">
                                                    {p.pfirst_name && p.plast_name 
                                                      ? `${p.pfirst_name} ${p.plast_name}`
                                                      : 'Name not available'}
                                                  </TableCell>
                                                  <TableCell className="text-right py-3">
                                                    {p.amount 
                                                      ? `₱${Number(p.amount).toFixed(2)}`
                                                      : '₱0.00'}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                              <TableRow className="border-t bg-gray-50">
                                                <TableCell colSpan={2} className="font-semibold text-right py-3 pr-4">
                                                  Total Amount:
                                                </TableCell>
                                                <TableCell className="font-semibold text-right py-3">
                                                  ₱{Number(payment.total_amount || 0).toFixed(2)}
                                                </TableCell>
                                              </TableRow>
                                            </>
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                                No panelists found for this payment.
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}                            {/* Expanded Panelist rows */}
                            {expandedPayment === payment.id && (
                              <TableRow>
                                <TableCell colSpan={8} className="bg-gray-50 p-4">
                                  <div className="rounded-md overflow-hidden">
                                    <h4 className="font-semibold text-gray-600 mb-3 px-1">
                                      Payment Breakdown:
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm border-separate border-spacing-0">
                                        <thead>
                                          <tr>
                                            <th className="text-left font-normal text-gray-500 pb-2 pr-4">Role</th>
                                            <th className="text-left font-normal text-gray-500 pb-2 pr-4">Panelist Name</th>
                                            <th className="text-left font-normal text-gray-500 pb-2">Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {payment.panelists && payment.panelists.length > 0 ? (
                                            payment.panelists.map((p, i) => (
                                              <tr key={i} className="hover:bg-gray-100">
                                                <td className="py-2 pr-4">{p.role}</td>
                                                <td className="py-2 pr-4">{p.pfirst_name} {p.plast_name}</td>
                                                <td className="py-2">₱{Number(p.amount).toFixed(2)}</td>
                                              </tr>
                                            ))
                                          ) : (
                                            <tr>
                                              <td colSpan={3} className="text-center py-3 text-gray-500">
                                                No panelists found.
                                              </td>
                                            </tr>
                                          )}
                                          {payment.panelists && payment.panelists.length > 0 && (
                                            <tr className="border-t">
                                              <td colSpan={2} className="py-3 font-semibold text-right pr-4">Total:</td>
                                              <td className="py-3 font-semibold">
                                                ₱{payment.panelists.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}
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
