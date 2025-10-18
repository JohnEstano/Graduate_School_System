import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash, UserPlus, Loader2, Edit, Plus, Mail, MessageCircle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Adviser = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  name?: string;
  employee_id?: string;
  status?: "active" | "inactive";
};

type Student = {
  id: number;
  student_number: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  program: string | null;
};

function getInitials(person: { first_name: string | null; last_name: string | null }) {
  const first = person.first_name?.trim()?.[0] ?? "";
  const last = person.last_name?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

export default function ShowAdvisers() {
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [registering, setRegistering] = useState(false);
  const [adviserName, setAdviserName] = useState("");
  const [adviserEmail, setAdviserEmail] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAdviser, setEditAdviser] = useState<Adviser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [viewAdviser, setViewAdviser] = useState<Adviser | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adviserToRemove, setAdviserToRemove] = useState<Adviser | null>(null);

  // Add Student dialog state (NEW)
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [addStudentError, setAddStudentError] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  // New: Pending students state
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // New: Tab state
  const [adviserTab, setAdviserTab] = useState("assigned");

  // New: Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    axios.get("/api/coordinator/advisers")
      .then(res => setAdvisers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredAdvisers = advisers.filter(
    (a) =>
      a.first_name.toLowerCase().includes(query.toLowerCase()) ||
      a.last_name.toLowerCase().includes(query.toLowerCase()) ||
      a.email.toLowerCase().includes(query.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAdvisers.length / pageSize);
  const paginatedAdvisers = filteredAdvisers.slice((page - 1) * pageSize, page * pageSize);

  // Reset to first page if filter changes and current page is out of range
  useEffect(() => {
    if ((page - 1) * pageSize >= filteredAdvisers.length) {
      setPage(1);
    }
  }, [filteredAdvisers.length, page, pageSize]);

  const handleRegister = async () => {
    if (!adviserName.trim() || !adviserEmail.trim()) return;
    setRegistering(true);
    setRegisterError("");
    try {
      await axios.post("/api/coordinator/advisers", {
        name: adviserName.trim(),
        email: adviserEmail.trim(),
      });
      const advisersRes = await axios.get("/api/coordinator/advisers");
      setAdvisers(advisersRes.data);
      setDialogOpen(false);
      setAdviserName("");
      setAdviserEmail("");
    } catch (error: any) {
      setRegisterError(error.response?.data?.error || "Failed to register adviser");
    } finally {
      setRegistering(false);
    }
  };

  const handleRemoveAdviser = async () => {
    if (!adviserToRemove) return;
    await axios.delete(`/api/coordinator/advisers/${adviserToRemove.id}`);
    setAdvisers(advisers.filter(a => a.id !== adviserToRemove.id));
    setConfirmOpen(false);
    setAdviserToRemove(null);
  };

  const handleEditAdviser = async () => {
    if (!editAdviser) return;
    setEditLoading(true);
    setEditError("");
    try {
      await axios.put(`/api/coordinator/advisers/${editAdviser.id}`, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      setAdvisers(advisers.map(a =>
        a.id === editAdviser.id
          ? { ...a, name: editName.trim(), email: editEmail.trim() }
          : a
      ));
      setEditDialogOpen(false);
      setEditAdviser(null);
    } catch (error: any) {
      setEditError(error.response?.data?.error || "Failed to update adviser");
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch students for selected adviser
  const fetchStudents = async (adviserId: number) => {
    setStudentsLoading(true);
    try {
      const res = await axios.get(`/api/coordinator/advisers/${adviserId}/students`);
      setStudents(res.data);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch pending students for selected adviser
  const fetchPendingStudents = async (adviserId: number) => {
    setPendingLoading(true);
    try {
      const res = await axios.get(`/api/coordinator/advisers/${adviserId}/pending-students`);
      setPendingStudents(res.data);
    } finally {
      setPendingLoading(false);
    }
  };

  // When viewAdviser changes, fetch both assigned and pending students
  useEffect(() => {
    if (viewAdviser) {
      fetchStudents(viewAdviser.id);
      fetchPendingStudents(viewAdviser.id);
      setAdviserTab("assigned");
    }
  }, [viewAdviser]);

  const handleAddStudent = async () => {
    if (!studentEmail.trim() || !viewAdviser) return;
    setAddingStudent(true);
    setAddStudentError("");
    try {
      await axios.post(`/api/coordinator/advisers/${viewAdviser.id}/students`, {
        email: studentEmail.trim(),
      });
      // refresh pending list in the open view so coordinator sees it immediately
      await fetchPendingStudents(viewAdviser.id);
      await fetchStudents(viewAdviser.id);
      setAddStudentDialogOpen(false);
      setStudentEmail("");
    } catch (err: any) {
      setAddStudentError(err.response?.data?.error || "Failed to add student.");
    } finally {
      setAddingStudent(false);
    }
  };

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

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative bg-background">
      {/* Header */}
      <div className="w-full border border-border rounded-lg overflow-hidden mb-1 bg-white dark:bg-zinc-900">
        <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                My Advisers
              </span>
              <span className="block text-xs text-muted-foreground dark:text-zinc-400">
                This page lists all advisers under your coordination. You can add, search, and manage advisers here.
              </span>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setAdviserName("");
              setAdviserEmail("");
              setRegisterError("");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 py-1 text-sm">
                Register an Adviser
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register an Adviser</DialogTitle>
                <DialogDescription>
                  Enter the adviser's name and email to add them under your coordination.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-zinc-100">Adviser Name</label>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={adviserName}
                    onChange={e => setAdviserName(e.target.value)}
                    disabled={registering}
                    className="dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-zinc-100">Adviser Email</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={adviserEmail}
                    onChange={e => setAdviserEmail(e.target.value)}
                    disabled={registering}
                    className="dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                {registerError && (
                  <div className="text-xs text-rose-500 mt-1">{registerError}</div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button 
                  onClick={handleRegister} 
                  disabled={!adviserName.trim() || !adviserEmail.trim() || registering}
                >
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Adviser
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-row items-center justify-between w-full p-3 border-t bg-white dark:bg-zinc-900">
          <Input
            type="text"
            startIcon={Search}
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8 bg-background dark:bg-background"
          />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md w-full max-w-full border border-border bg-white dark:bg-zinc-900 overflow-x-auto">
        <div className="w-full min-w-[700px]">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px] min-w-[180px] max-w-[260px] truncate">Name</TableHead>
                <TableHead className="w-[220px] min-w-[180px] max-w-[260px] truncate">Email</TableHead>
                <TableHead className="w-[110px] min-w-[90px] max-w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[120px] min-w-[100px] max-w-[140px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdvisers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
                    No advisers found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdvisers.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="flex items-center gap-3 truncate max-w-[240px]">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(a)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-zinc-900 dark:text-zinc-100">
                        {a.first_name} {a.middle_name ? a.middle_name[0] + "." : ""} {a.last_name}
                      </span>
                    </TableCell>
                    <TableCell className="truncate max-w-[240px] text-zinc-700 dark:text-zinc-300">{a.email}</TableCell>
                    {/* Status Column */}
                    <TableCell className="text-center">
                      {a.status === "active" ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-200 text-zinc-600 border-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-700">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2 justify-center">
                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="View adviser"
                        onClick={() => {
                          setViewAdviser(a);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Users size={18} />
                      </Button>
                      {/* Edit Button */}
                      <Dialog open={editDialogOpen && editAdviser?.id === a.id} onOpenChange={open => {
                        setEditDialogOpen(open);
                        if (!open) {
                          setEditAdviser(null);
                          setEditError("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Edit adviser"
                            onClick={() => {
                              setEditAdviser(a);
                              setEditName(
                                `${a.first_name}${a.middle_name ? " " + a.middle_name : ""} ${a.last_name}`.trim()
                              );
                              setEditEmail(a.email);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit size={18} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Adviser</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium dark:text-zinc-100">Adviser Name</label>
                              <Input
                                type="text"
                                placeholder="Full Name"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                disabled={editLoading}
                                className="dark:bg-zinc-800 dark:text-zinc-100"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium dark:text-zinc-100">Adviser Email</label>
                              <Input
                                type="email"
                                placeholder="Email"
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                                disabled={editLoading}
                                className="dark:bg-zinc-800 dark:text-zinc-100"
                              />
                            </div>
                            {editError && (
                              <div className="text-xs text-rose-500 mt-1">{editError}</div>
                            )}
                          </div>
                          <DialogFooter className="mt-4">
                            <Button
                              onClick={handleEditAdviser}
                              disabled={!editName.trim() || !editEmail.trim() || editLoading}
                            >
                              {editLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {/* Remove Button */}
                      <Dialog open={confirmOpen && adviserToRemove?.id === a.id} onOpenChange={open => {
                        if (!open) {
                          setConfirmOpen(false);
                          setAdviserToRemove(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Remove adviser"
                            onClick={() => {
                              setAdviserToRemove(a);
                              setConfirmOpen(true);
                            }}
                          >
                            <Trash size={18} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Adviser</DialogTitle>
                          </DialogHeader>
                          <div className="py-2 text-zinc-900 dark:text-zinc-100">
                            Are you sure you want to remove <b>{a.first_name} {a.last_name}</b> from your coordination?
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setConfirmOpen(false);
                                setAdviserToRemove(null);
                              }}
                              className="mr-2 bg-white text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleRemoveAdviser}
                              className="bg-rose-500 hover:bg-rose-600 text-white border-none"
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
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-zinc-900 dark:text-zinc-100">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {/* Adviser-Student Relationship Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => {
        setViewDialogOpen(open);
        if (!open) setViewAdviser(null);
      }}>
        <DialogContent className="max-w-2xl dark:bg-zinc-800">
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">
              Adviser Information
            </DialogTitle>
            <DialogDescription>
              {viewAdviser && (
                <div className="flex items-center gap-4 mt-2">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(viewAdviser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {viewAdviser.first_name} {viewAdviser.middle_name ? viewAdviser.middle_name[0] + "." : ""} {viewAdviser.last_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{viewAdviser.email}</span>
                      {/* Gmail Button */}
                      <button
                        className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                        style={{ height: "22px" }}
                        title="Send Gmail"
                        onClick={() => {
                          window.open(
                            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(viewAdviser.email)}`,
                            "_blank"
                          );
                        }}
                      >
                        <Mail size={14} className="text-zinc-500 dark:text-zinc-300" />
                        Gmail
                      </button>
                      {/* Google Chat Button */}
                      <button
                        className="px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                        style={{ height: "22px" }}
                        title="Open Google Chat"
                        onClick={() => {
                          window.open(
                            `https://mail.google.com/chat/u/0/#chat/user/${encodeURIComponent(viewAdviser.email)}`,
                            "_blank"
                          );
                        }}
                      >
                        <MessageCircle size={14} className="text-zinc-500 dark:text-zinc-300" />
                        Chat
                      </button>
                    </div>
                    {viewAdviser.employee_id && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">Employee ID: {viewAdviser.employee_id}</div>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs value={adviserTab} onValueChange={setAdviserTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="assigned">
                  Assigned Students
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-[11px] font-medium">
                    {students.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Confirmation
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-[11px] font-medium">
                    {pendingStudents.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="assigned">
                <div
                  className="overflow-y-auto overflow-x-auto min-w-[400px] rounded"
                  style={{ height: "240px" }}
                >
                  {studentsLoading ? (
                    <div className="text-xs flex items-center justify-center h-full dark:text-zinc-300">Loading students...</div>
                  ) : students.length === 0 ? (
                    <div className="text-gray-500 text-xs flex items-center justify-center h-full dark:text-gray-400">
                      No students linked to this adviser.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {students.map(s => (
                        <li key={s.id} className="py-2 flex items-center gap-3 text-xs">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(s)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-xs flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                              {s.first_name} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{s.email} • {s.student_number} • {s.program}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remove student"
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900"
                            onClick={() => {
                              if (window.confirm(`Remove ${s.first_name} ${s.last_name} from this adviser?`)) {
                                axios.delete(`/api/coordinator/advisers/${viewAdviser?.id}/students/${s.id}`)
                                  .then(() => setStudents(students.filter(stu => stu.id !== s.id)));
                              }
                            }}
                          >
                            <Trash size={16} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pending">
                <div
                  className="overflow-y-auto overflow-x-auto min-w-[400px] rounded"
                  style={{ height: "240px" }}
                >
                  {pendingLoading ? (
                    <div className="text-xs flex items-center justify-center h-full dark:text-zinc-300">Loading pending students...</div>
                  ) : pendingStudents.length === 0 ? (
                    <div className="text-gray-500 text-xs flex items-center justify-center h-full dark:text-gray-400">
                      No pending students for this adviser.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {pendingStudents.map(s => (
                        <li key={s.id} className="py-2 flex items-center gap-3 text-xs">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(s)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-xs flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                              {s.first_name} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{s.email} • {s.student_number} • {s.program}</div>
                          </div>
                          {/* You can add actions for pending students here if needed */}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            {/* Assign Student Button: Always visible below tabs */}
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setAddStudentDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign a Student
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="dark:text-zinc-100">Add Student to Adviser</DialogTitle>
            <DialogDescription className="dark:text-zinc-300">
              Enter the student's email to add them under this adviser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
             <Input
               placeholder="Email"
               value={studentEmail}
               onChange={e => setStudentEmail(e.target.value)}
               className="text-xs dark:bg-zinc-800 dark:text-zinc-100"
               disabled={addingStudent}
             />
             {addStudentError && <div className="text-xs text-rose-500">{addStudentError}</div>}
           </div>
           <DialogFooter>
             <Button
               onClick={handleAddStudent}
               disabled={!studentEmail.trim() || addingStudent}
             >
               {addingStudent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
               Add Student
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}