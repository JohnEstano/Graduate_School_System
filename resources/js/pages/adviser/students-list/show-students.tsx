import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ShowStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Dialog form state
  const [studentNumber, setStudentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState("");

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
      student_number: studentNumber,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email,
      program,
    });
    const res = await axios.get("/api/adviser/students");
    setStudents(res.data);
    setDialogOpen(false);
    setStudentNumber("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setProgram("");
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
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative">
      {/* Header */}
      <div className="w-full bg-white border border-border rounded-lg overflow-hidden mb-1">
        {/* Main header row */}
        <div className="flex flex-row items-center justify-between w-full p-3 bg-white border-b">
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
                  type="text"
                  placeholder="Student Number"
                  value={studentNumber}
                  onChange={e => setStudentNumber(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={middleName}
                  onChange={e => setMiddleName(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Program"
                  value={program}
                  onChange={e => setProgram(e.target.value)}
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
        <div className="flex flex-row items-center justify-between w-full p-3 bg-white border-t">
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
            <div className="flex flex-col text-right">
              <span className="font-semibold text-sm">
                Shareable code:
              </span>
              <span className="text-xs text-muted-foreground">
                Give this code to students so they can register under your advisership.
              </span>
            </div>
            <AdviserCodeBox />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md overflow-x-auto bg-white w-full max-w-full border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.student_number}</TableCell>
                  <TableCell>
                    {s.first_name} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name}
                  </TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.program}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}