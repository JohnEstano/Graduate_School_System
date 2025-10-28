"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Printer, Calendar, FileText, CreditCard, User } from "lucide-react";

interface Panelist {
  name?: string;
  role?: string;
  amount?: string | number;
}

interface Payment {
  id: number;
  defense_status: string;
  payment_date: string;
  defense_date?: string;
  defense_type?: string;
  panelist_role?: string;
  or_number?: string;
  amount: number;
  panelists?: Panelist[];
  grand_total?: number;
  rec_fee?: number;
  school_share?: number;
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
  defense_date?: string; 
  defense_type?: string;  
  payments: Payment[];
  // role assigned to this panelist for this student (from pivot)
  assigned_role?: string | null;
}

interface PanelistRecord {
  id: number;
  pfirst_name: string;
  pmiddle_name?: string;
  plast_name: string;
  role: string;
  defense_type?: string;
  received_date?: string;
  amount?: number; // Role-specific receivables
  total_honorarium?: number; // Total defense request amounts
  students?: Student[];
}

interface Props {
  panelist: PanelistRecord | null;
  onClose: () => void;
}

export default function PanelistIndividualRecord({ panelist, onClose }: Props) {
  if (!panelist) return null;

  // Calculate total receivables from all payments
  // This sums up the actual amounts paid to this panelist across all defenses
  const totalReceivables = (panelist.students || []).reduce((sum, student) => 
    sum + (student.payments || []).reduce((pSum, pay) => pSum + Number(pay.amount || 0), 0), 0
  );

  const handlePrint = () => {
    window.open(`/honorarium/panelist/${panelist.id}/download-pdf`, '_blank');
  };

  const getRoleBadgeColor = (role: string) => {
    // Consistent gray styling for all roles
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
  };

  const getDefenseTypeBadge = (type: string) => {
    switch (type) {
      case 'Proposal':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200';
      case 'Pre-Final':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200';
      case 'Final':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
    }
  };

  return (
    <Dialog open={!!panelist} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header with Close Button */}
        <DialogHeader className="sticky top-0 z-20 bg-white dark:bg-[#121212] border-b p-4 flex flex-row justify-between items-center m-2">
          <div className="flex-1 mr-16">
            <DialogTitle className="text-2xl font-bold">
              {`${panelist.pfirst_name} ${panelist.pmiddle_name || ""} ${panelist.plast_name}`.trim()}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-base mt-1">
              <Badge className={`${getRoleBadgeColor(panelist.role)} font-medium`}>
                Total Receivables: 
              </Badge>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₱  {totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </DialogDescription>    
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="print:hidden"
            >
              <Printer className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <DialogClose asChild>
              <button
                className="ring-offset-background focus:ring-ring rounded-sm opacity-70 transition-opacity 
                hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden p-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-2 px-6">
          <div className="rounded-md overflow-x-auto border bg-white dark:bg-[#121212] p-4">
            <div className="space-y-4">
              {(panelist.students || [])
                .flatMap((student) => {
                  // Map each payment to a separate card with student info
                  return (student.payments || []).map((payment) => ({
                    student,
                    payment,
                  }));
                })
                .sort((a, b) => {
                  // Sort by defense_date: latest first
                  const dateA = a.payment.defense_date ? new Date(a.payment.defense_date).getTime() : 0;
                  const dateB = b.payment.defense_date ? new Date(b.payment.defense_date).getTime() : 0;
                  return dateB - dateA; // Descending order (latest first)
                })
                .map(({ student, payment }, index) => {
                  return (
                  <div
                    key={`${student.id}-${payment.id}-${index}`}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] print:border-gray-400"
                  >
                    {/* Student Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 print:border">
                          <User className="h-5 w-5 text-black dark:text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">
                            {`${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {student.school_year || "2024-2025"}
                            </span>
                            {payment.panelist_role && (
                              <Badge className={`${getRoleBadgeColor(payment.panelist_role)} text-xs`}>
                                {payment.panelist_role}
                              </Badge>
                            )}
                            <Badge className={`${getDefenseTypeBadge(payment.defense_type || 'N/A')} text-xs`}>
                              {payment.defense_type || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Defense Date</div>
                          <div className="font-medium">
                            {payment.defense_date 
                              ? new Date(payment.defense_date).toLocaleDateString('en-US', { 
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Payment Date</div>
                          <div className="font-medium">
                            {payment.payment_date 
                              ? new Date(payment.payment_date).toLocaleDateString('en-US', { 
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">OR Number</div>
                          <div className="font-medium">{payment.or_number || "-"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Honorarium Amount</div>
                          <div className="font-semibold">
                            ₱ {Number(payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {(!panelist.students || panelist.students.length === 0) && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment records found for this panelist.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
