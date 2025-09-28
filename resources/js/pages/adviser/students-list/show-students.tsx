import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Student = {
  id: number;
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  program: string;
};

export function AdviserCodeBox() {
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/adviser/code")
      .then(res => res.json())
      .then(data => setCode(data.adviser_code));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={code}
        readOnly
        className="border rounded px-3 py-1 font-mono w-[120px] text-base bg-transparent"
        style={{ minWidth: "100px" }}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        disabled={!code}
        className="border-gray-300 h-8 w-8"
        aria-label="Copy adviser code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </Button>
    </div>
  );
}

function getInitials(student: Student) {
  const first = student.first_name?.trim()?.[0] ?? "";
  const last = student.last_name?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

export default function ShowStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Dialog form state
  const [email, setEmail] = useState("");

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);

  useEffect(() => {
    axios.get("/api/adviser/students")
      .then(res => setStudents(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.student_number.toLowerCase().includes(query.toLowerCase()) ||
      s.first_name.toLowerCase().includes(query.toLowerCase()) ||
      s.last_name.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase()) ||
      s.program.toLowerCase().includes(query.toLowerCase())
  );

  const handleRegister = async () => {
    await axios.post("/api/adviser/students", {
      email,
    });
    const res = await axios.get("/api/adviser/students");
    setStudents(res.data);
    setDialogOpen(false);
    setEmail("");
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    await axios.delete(`/api/adviser/students/${studentToRemove.id}`);
    setStudents(students.filter(stu => stu.id !== studentToRemove.id));
    setConfirmOpen(false);
    setStudentToRemove(null);
  };

  if (loading) {
    // Skeleton layout copied from coordinator dashboard
    return (
      <div className="w-full min-h-[70vh] bg-zinc-100 flex flex-col gap-4 p-0 m-0">
        {/* Top short row */}
        <Skeleton className="h-6 w-1/6 rounded bg-zinc-300 mt-8 mx-8" />
        {/* Main rows */}
        <Skeleton className="h-12 w-3/4 rounded bg-zinc-300 mx-8" />
        <Skeleton className="h-12 w-2/3 rounded bg-zinc-300 mx-8" />
        {/* Big rectangle for table body */}
        <Skeleton className="h-[400px] w-full rounded bg-zinc-300 mt-4" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative
      bg-white dark:bg-zinc-900 transition-colors">
      {/* Header */}
      <div className="w-full border border-border rounded-lg overflow-hidden mb-1
        bg-white dark:bg-zinc-800 dark:border-zinc-700">
        {/* Main header row */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-b
          bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <Users className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <span className="text-base font-semibold">
                My Students
              </span>
              <span className="block text-xs text-muted-foreground">
                This page lists all students registered under your advisership. You can add, search, and manage students here.
              </span>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 py-1 text-sm" onClick={() => setDialogOpen(true)}>
                Register a Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register a Student</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  type="email"
                  placeholder="Student Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={handleRegister}>Register</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Shareable code & search row */}
        <div className="flex flex-row items-center justify-between w-full p-3 border-t
          bg-white dark:bg-zinc-800 dark:border-zinc-700">
          {/* Search input */}
          <Input
            type="text"
            startIcon={Search}
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8"
          />
          {/* Shareable code group */}
          <div className="flex items-center gap-3">
             <span className="font-semibold text-sm whitespace-nowrap">
              Shareable Adviser Code:
            </span>
            <AdviserCodeBox />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md overflow-x-auto w-full max-w-full border border-border
        bg-white dark:bg-zinc-800 dark:border-zinc-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="dark:text-zinc-300">Student #</TableHead>
              <TableHead className="dark:text-zinc-300">Name</TableHead>
              <TableHead className="dark:text-zinc-300">Email</TableHead>
              <TableHead className="dark:text-zinc-300">Program</TableHead>
              <TableHead className="dark:text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map(s => (
                <TableRow key={s.id} className="dark:hover:bg-zinc-700">
                  <TableCell className="dark:text-zinc-200">{s.student_number}</TableCell>
                  <TableCell className="dark:text-zinc-200">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(s)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {s.first_name} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-zinc-200">{s.email}</TableCell>
                  <TableCell className="dark:text-zinc-200">{s.program}</TableCell>
                  <TableCell>
                    <Dialog open={confirmOpen && studentToRemove?.id === s.id} onOpenChange={open => {
                      if (!open) {
                        setConfirmOpen(false);
                        setStudentToRemove(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-zinc-300 dark:border-zinc-500 dark:text-zinc-300"
                          aria-label="Remove student"
                          onClick={() => {
                            setStudentToRemove(s);
                            setConfirmOpen(true);
                          }}
                        >
                          <Trash size={18} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Student</DialogTitle>
                        </DialogHeader>
                        <div className="py-2 dark:text-zinc-200">
                          Are you sure you want to remove <b>{s.first_name} {s.last_name}</b> from your advisership?
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setConfirmOpen(false);
                              setStudentToRemove(null);
                            }}
                            className="mr-2 bg-white text-zinc-900 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-600"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRemoveStudent}
                            className="bg-rose-500 hover:bg-rose-600 text-white border-none dark:bg-rose-500 dark:hover:bg-rose-600 dark:text-white"
                          >
                            Confirm
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}