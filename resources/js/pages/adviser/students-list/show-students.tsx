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
import { Check, Users, Trash } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  const acceptPending = async (s: Student) => {
    try {
      await axios.post(`/api/adviser/pending-students/${s.id}/accept`);
      await loadAccepted();
      await fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectPending = async (s: Student) => {
    try {
      await axios.post(`/api/adviser/pending-students/${s.id}/reject`);
      await fetchPending();
    } catch (err) {
      console.error(err);
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
      <div className="w-full min-h-[70vh] bg-zinc-100 flex flex-col gap-4 p-0 m-0">
        <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 mt-8 mx-8" />
        <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 mx-8" />
        <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 mx-8" />
        <Skeleton className="h-[400px] w-full rounded bg-zinc-300 mt-4" />
      </div>
    );
  }

  function renderTableRows(rows: Student[], isPending = false) {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
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
        <TableCell>
          {isPending ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => acceptPending(s)}><Check size={14} className="mr-1" />Accept</Button>
              <Button size="sm" variant="outline" onClick={() => rejectPending(s)}>Reject</Button>
            </div>
          ) : (
            <Dialog open={confirmOpen && studentToRemove?.id === s.id} onOpenChange={(open) => {
              if (!open) {
                setConfirmOpen(false);
                setStudentToRemove(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Remove student" onClick={() => {
                  setStudentToRemove(s);
                  setConfirmOpen(true);
                }}>
                  <Trash size={18} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Student</DialogTitle>
                </DialogHeader>
                <div className="py-2">Are you sure you want to remove <b>{s.first_name} {s.last_name}</b>?</div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setConfirmOpen(false); setStudentToRemove(null); }} className="mr-2">Cancel</Button>
                  <Button onClick={handleRemoveStudent} className="bg-rose-500 text-white">Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative
      bg-white dark:bg-zinc-900 transition-colors">

      {/* Header - two rows: title row, then search row */}
      <div className="w-full border border-border rounded-lg overflow-hidden mb-1 bg-white dark:bg-zinc-800 dark:border-zinc-700">
        {/* Title row */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <Users className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <span className="text-base font-semibold">My Students</span>
              <span className="block text-xs text-muted-foreground">Manage your accepted and pending advisees.</span>
            </div>
          </div>

          {/* empty placeholder for actions (keeps layout consistent) */}
          <div />
        </div>

        {/* Search row (separate) */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-t bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <Input
            type="text"
            placeholder="Search by name, email, student # or program..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8"
          />
        </div>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            Assigned
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 text-xs">{students.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 text-xs">{pendingStudents.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="rounded-md overflow-x-auto w-full max-w-full border border-border bg-white dark:bg-zinc-800 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-zinc-300">Name</TableHead>
                  <TableHead className="dark:text-zinc-300">Student #</TableHead>
                  <TableHead className="dark:text-zinc-300">Email</TableHead>
                  <TableHead className="dark:text-zinc-300">Program</TableHead>
                  <TableHead className="dark:text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
                      Loading pending...
                    </TableCell>
                  </TableRow>
                ) : renderTableRows(pendingStudents, true)}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assigned">
          <div className="rounded-md overflow-x-auto w-full max-w-full border border-border bg-white dark:bg-zinc-800 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-zinc-300">Name</TableHead>
                  <TableHead className="dark:text-zinc-300">Student #</TableHead>
                  <TableHead className="dark:text-zinc-300">Email</TableHead>
                  <TableHead className="dark:text-zinc-300">Program</TableHead>
                  <TableHead className="dark:text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows(filteredStudents, false)}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}