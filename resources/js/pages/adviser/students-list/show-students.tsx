import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Users, Trash, Mail, Loader2, UserCheck, UserX } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Student = {
  id: number;
  student_number: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  program: string | null;
  coordinator_name?: string | null; // <-- Add this line
};

function getInitials(student: Student | any) {
  const first = student.first_name?.trim()?.[0] ?? "";
  const last = student.last_name?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

export default function ShowStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);

  // Email confirmation dialogs
  const [acceptEmailConfirmOpen, setAcceptEmailConfirmOpen] = useState(false);
  const [rejectEmailConfirmOpen, setRejectEmailConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ student: Student; action: 'accept' | 'reject' } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAccepted();
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccepted = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/adviser/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    setPendingLoading(true);
    try {
      const res = await axios.get("/api/adviser/pending-students");
      setPendingStudents(res.data || []);
    } catch (err) {
      console.error("Failed to load pending", err);
    } finally {
      setPendingLoading(false);
    }
  };

  const openAcceptDialog = (s: Student) => {
    setPendingAction({ student: s, action: 'accept' });
    setAcceptEmailConfirmOpen(true);
  };

  const openRejectDialog = (s: Student) => {
    setPendingAction({ student: s, action: 'reject' });
    setRejectEmailConfirmOpen(true);
  };

  const handleConfirmAccept = async (sendEmail: boolean) => {
    if (!pendingAction || pendingAction.action !== 'accept') return;
    
    setProcessing(true);
    try {
      await axios.post(`/api/adviser/pending-students/${pendingAction.student.id}/accept`, {
        send_email: sendEmail
      });
      await loadAccepted();
      await fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
      setAcceptEmailConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const handleConfirmReject = async (sendEmail: boolean) => {
    if (!pendingAction || pendingAction.action !== 'reject') return;
    
    setProcessing(true);
    try {
      await axios.post(`/api/adviser/pending-students/${pendingAction.student.id}/reject`, {
        send_email: sendEmail
      });
      await fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
      setRejectEmailConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    try {
      await axios.delete(`/api/adviser/students/${studentToRemove.id}`);
      setStudents((prev) => prev.filter((stu) => stu.id !== studentToRemove.id));
    } catch (err) {
      console.error("Failed to remove student", err);
    } finally {
      setConfirmOpen(false);
      setStudentToRemove(null);
    }
  };

  const lowerQuery = query.toLowerCase();
  const filteredStudents = students.filter(
    (s) =>
      (s.student_number?.toLowerCase().includes(lowerQuery) ?? false) ||
      (s.first_name?.toLowerCase().includes(lowerQuery) ?? false) ||
      (s.last_name?.toLowerCase().includes(lowerQuery) ?? false) ||
      (s.email?.toLowerCase().includes(lowerQuery) ?? false) ||
      (s.program?.toLowerCase().includes(lowerQuery) ?? false)
  );

  if (loading) {
    return (
      <div className="w-full min-h-[70vh] bg-background flex flex-col gap-4 p-0 m-0">
        <Skeleton className="h-6 w-1/6 rounded bg-muted dark:bg-muted mt-8 mx-8" />
        <Skeleton className="h-12 w-3/4 rounded bg-muted dark:bg-muted mx-8" />
        <Skeleton className="h-12 w-2/3 rounded bg-muted dark:bg-muted mx-8" />
        <Skeleton className="h-[400px] w-full rounded bg-muted dark:bg-muted mt-4" />
      </div>
    );
  }

  function renderTableRows(rows: Student[], isPending = false) {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={isPending ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
            No students found.
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((s) => (
      <TableRow key={s.id} className="dark:hover:bg-zinc-700">
        <TableCell className="flex items-center gap-3 dark:text-zinc-200">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(s)}</AvatarFallback>
          </Avatar>
          <span>{s.first_name || ""} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name || ""}</span>
        </TableCell>
        <TableCell className="dark:text-zinc-200">{s.student_number || "N/A"}</TableCell>
        <TableCell className="dark:text-zinc-200">{s.email || "N/A"}</TableCell>
        <TableCell className="dark:text-zinc-200">{s.program || "N/A"}</TableCell>
        <TableCell className="dark:text-zinc-200">{s.coordinator_name || "N/A"}</TableCell>
        {isPending && (
          <TableCell className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              title="Accept"
              onClick={() => openAcceptDialog(s)}
              className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Reject"
              onClick={() => openRejectDialog(s)}
              className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </TableCell>
        )}
      </TableRow>
    ));
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative
      bg-background dark:bg-zinc-900 transition-colors">

      {/* Header - two rows: title row, then search row */}
      <div className="w-full border border-border rounded-lg overflow-hidden mb-1 bg-white dark:bg-zinc-900 dark:border-zinc-700">
        {/* Title row */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white dark:bg-zinc-900 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <Users className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">My Students</span>
              <span className="block text-xs text-muted-foreground dark:text-zinc-400">This section shows all students assigned to you.</span>
            </div>
          </div>

          {/* empty placeholder for actions (keeps layout consistent) */}
          <div />
        </div>

        {/* Search row (separate) */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-t bg-white dark:bg-zinc-900 dark:border-zinc-700">
          <Input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8 bg-background dark:bg-background"
          />
        </div>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            Assigned
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-100">{students.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-100">{pendingStudents.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="rounded-md overflow-x-auto w-full max-w-full border border-border bg-white dark:bg-zinc-900 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-zinc-100">Name</TableHead>
                  <TableHead className="dark:text-zinc-100">Student #</TableHead>
                  <TableHead className="dark:text-zinc-100">Email</TableHead>
                  <TableHead className="dark:text-zinc-100">Program</TableHead>
                  <TableHead className="dark:text-zinc-100">Program Coordinator</TableHead>
                  <TableHead className="dark:text-zinc-100 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
                      Loading pending...
                    </TableCell>
                  </TableRow>
                ) : renderTableRows(pendingStudents, true)}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <div className="rounded-md overflow-x-auto w-full max-w-full border border-border bg-white dark:bg-zinc-900 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-zinc-100">Name</TableHead>
                  <TableHead className="dark:text-zinc-100">School ID</TableHead>
                  <TableHead className="dark:text-zinc-100">Email</TableHead>
                  <TableHead className="dark:text-zinc-100">Program</TableHead>
                  <TableHead className="dark:text-zinc-100">Program Coordinator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows(filteredStudents, false)}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Accept Student Email Confirmation Dialog */}
      <Dialog open={acceptEmailConfirmOpen} onOpenChange={setAcceptEmailConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Accept Student & Send Notification?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>You are accepting this student:</p>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {pendingAction?.student.first_name} {pendingAction?.student.middle_name ? pendingAction.student.middle_name[0] + '.' : ''} {pendingAction?.student.last_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {pendingAction?.student.email}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {pendingAction?.student.program}
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Would you like to send an acceptance email notification to the student?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleConfirmAccept(false)}
              disabled={processing}
            >
              Skip Email
            </Button>
            <Button
              onClick={() => handleConfirmAccept(true)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Student Email Confirmation Dialog */}
      <Dialog open={rejectEmailConfirmOpen} onOpenChange={setRejectEmailConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-rose-500" />
              Reject Student & Send Notification?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>You are rejecting this student:</p>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {pendingAction?.student.first_name} {pendingAction?.student.middle_name ? pendingAction.student.middle_name[0] + '.' : ''} {pendingAction?.student.last_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {pendingAction?.student.email}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {pendingAction?.student.program}
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Would you like to send a rejection email notification to the student?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleConfirmReject(false)}
              disabled={processing}
            >
              Skip Email
            </Button>
            <Button
              onClick={() => handleConfirmReject(true)}
              disabled={processing}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}