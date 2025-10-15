import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash, UserPlus, Loader2, Edit, Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Adviser = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  program: string;
  name?: string;
  employee_id?: string;
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
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [addStudentError, setAddStudentError] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    axios.get("/api/coordinator/advisers")
      .then(res => setAdvisers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredAdvisers = advisers.filter(
    (a) =>
      a.first_name.toLowerCase().includes(query.toLowerCase()) ||
      a.last_name.toLowerCase().includes(query.toLowerCase()) ||
      a.email.toLowerCase().includes(query.toLowerCase()) ||
      a.program.toLowerCase().includes(query.toLowerCase())
  );

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

  // When viewAdviser changes, fetch students
  useEffect(() => {
    if (viewAdviser) {
      fetchStudents(viewAdviser.id);
    }
  }, [viewAdviser]);

  // Add student handler (NEW)
  const handleAddStudent = async () => {
    if (!studentName.trim() || !studentEmail.trim() || !viewAdviser) return;
    setAddingStudent(true);
    setAddStudentError("");
    try {
      await axios.post(`/api/coordinator/advisers/${viewAdviser.id}/students`, {
        name: studentName.trim(),
        email: studentEmail.trim(),
      });
      fetchStudents(viewAdviser.id);
      setAddStudentDialogOpen(false);
      setStudentName("");
      setStudentEmail("");
    } catch (error: any) {
      setAddStudentError(error.response?.data?.error || "Failed to add student.");
    } finally {
      setAddingStudent(false);
    }
  };

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

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-auto rounded-xl pt-5 pr-7 pl-7 relative bg-white">
      {/* Header */}
      <div className="w-full border border-border rounded-lg overflow-hidden mb-1 bg-white">
        <div className="flex flex-row items-center justify-between w-full p-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-semibold">
                My Advisers
              </span>
              <span className="block text-xs text-muted-foreground">
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
                  <label className="text-sm font-medium">Adviser Name</label>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={adviserName}
                    onChange={e => setAdviserName(e.target.value)}
                    disabled={registering}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adviser Email</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={adviserEmail}
                    onChange={e => setAdviserEmail(e.target.value)}
                    disabled={registering}
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
        <div className="flex flex-row items-center justify-between w-full p-3 border-t bg-white">
          <Input
            type="text"
            startIcon={Search}
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8"
          />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-md overflow-x-auto w-full max-w-full border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdvisers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No advisers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAdvisers.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(a)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {a.first_name} {a.middle_name ? a.middle_name[0] + "." : ""} {a.last_name}
                    </span>
                  </TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.program}</TableCell>
                  <TableCell className="flex gap-2">
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
                            <label className="text-sm font-medium">Adviser Name</label>
                            <Input
                              type="text"
                              placeholder="Full Name"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              disabled={editLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Adviser Email</label>
                            <Input
                              type="email"
                              placeholder="Email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              disabled={editLoading}
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
                        <div className="py-2">
                          Are you sure you want to remove <b>{a.first_name} {a.last_name}</b> from your coordination?
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setConfirmOpen(false);
                              setAdviserToRemove(null);
                            }}
                            className="mr-2 bg-white text-zinc-900 border-zinc-300"
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

      {/* Adviser-Student Relationship Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={open => {
        setViewDialogOpen(open);
        if (!open) setViewAdviser(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
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
                    <div className="font-semibold  text-sm">
                      {viewAdviser.first_name} {viewAdviser.middle_name ? viewAdviser.middle_name[0] + "." : ""} {viewAdviser.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{viewAdviser.email}</div>
                    <div className="text-sm text-gray-600">Program: {viewAdviser.program}</div>
                    {viewAdviser.employee_id && (
                      <div className="text-sm text-gray-600">Employee ID: {viewAdviser.employee_id}</div>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="font-semibold mb-2 text-xs">Students</div>
            <div className="max-h-64 overflow-y-auto overflow-x-auto">
              {studentsLoading ? (
                <div className="text-xs">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-gray-500 text-xs">No students linked to this adviser.</div>
              ) : (
                <ul className="divide-y min-w-[400px]">
                  {students.map(s => (
                    <li key={s.id} className="py-2 flex items-center gap-3 text-xs">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(s)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-xs">{s.first_name} {s.middle_name ? s.middle_name[0] + "." : ""} {s.last_name}</div>
                        <div className="text-xs text-gray-500">{s.email} • {s.student_number} • {s.program}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove student"
                        className="text-rose-500 hover:bg-rose-50"
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
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setAddStudentDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student to Adviser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to Adviser</DialogTitle>
            <DialogDescription>
              Enter the student's name and email to add them under this adviser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Full Name"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="text-xs"
              disabled={addingStudent}
            />
            <Input
              placeholder="Email"
              value={studentEmail}
              onChange={e => setStudentEmail(e.target.value)}
              className="text-xs"
              disabled={addingStudent}
            />
            {addStudentError && <div className="text-xs text-rose-500">{addStudentError}</div>}
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddStudent}
              disabled={!studentName.trim() || !studentEmail.trim() || addingStudent}
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