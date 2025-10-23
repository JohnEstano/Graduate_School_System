import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash, UserPlus, Loader2, Edit, Plus, Mail, MessageCircle, RefreshCw, User } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast, Toaster } from 'sonner';

type Adviser = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  name?: string;
  employee_id?: string;
  status?: "active" | "inactive";
  assigned_students_count?: number; // <-- Add this line
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

  // Confirmation dialog for sending invitation email
  const [invitationConfirmOpen, setInvitationConfirmOpen] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<{ name: string; email: string; adviserId: number } | null>(null);
  const [sendingInvitation, setSendingInvitation] = useState(false);

  // Add Student dialog state (NEW)
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [addStudentError, setAddStudentError] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [assignmentEmailConfirmOpen, setAssignmentEmailConfirmOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{ studentEmail: string } | null>(null);

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
      const response = await axios.post("/api/coordinator/advisers", {
        name: adviserName.trim(),
        email: adviserEmail.trim(),
      });
      
      const advisersRes = await axios.get("/api/coordinator/advisers");
      setAdvisers(advisersRes.data);
      setDialogOpen(false);
      setAdviserName("");
      setAdviserEmail("");

      // Check if adviser is inactive and needs invitation
      const newAdviser = response.data?.adviser;
      if (newAdviser?.status === 'inactive') {
        // Show confirmation dialog before sending email
        setPendingInvitation({
          name: `${newAdviser.first_name} ${newAdviser.last_name}`,
          email: newAdviser.email,
          adviserId: newAdviser.id
        });
        setInvitationConfirmOpen(true);
        toast.success('Adviser registered successfully!');
      } else {
        toast.success('Adviser registered successfully!');
      }
    } catch (error: any) {
      setRegisterError(error.response?.data?.error || "Failed to register adviser");
    } finally {
      setRegistering(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!pendingInvitation) return;
    
    setSendingInvitation(true);
    try {
      await axios.post(`/api/coordinator/advisers/${pendingInvitation.adviserId}/send-invitation`);
      toast.success(
        `Invitation email sent successfully to ${pendingInvitation.email}`,
        {
          description: 'The adviser will receive instructions to activate their account.',
          duration: 5000,
        }
      );
    } catch (error: any) {
      toast.error(
        'Failed to send invitation email',
        {
          description: error.response?.data?.message || 'Please try again later.',
          duration: 5000,
        }
      );
    } finally {
      setSendingInvitation(false);
      setInvitationConfirmOpen(false);
      setPendingInvitation(null);
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
    
    // Show confirmation dialog
    setPendingAssignment({ studentEmail: studentEmail.trim() });
    setAssignmentEmailConfirmOpen(true);
  };

  const handleConfirmAssignment = async (sendEmail: boolean) => {
    if (!pendingAssignment || !viewAdviser) return;
    
    setAddingStudent(true);
    setAddStudentError("");
    
    try {
      await axios.post(`/api/coordinator/advisers/${viewAdviser.id}/students`, {
        email: pendingAssignment.studentEmail,
        send_email: sendEmail,
      });
      
      await fetchPendingStudents(viewAdviser.id);
      await fetchStudents(viewAdviser.id);
      
      setAddStudentDialogOpen(false);
      setAssignmentEmailConfirmOpen(false);
      setStudentEmail("");
      setPendingAssignment(null);
      
      if (sendEmail) {
        toast.success('Student assigned and email notification sent to adviser!');
      } else {
        toast.success('Student assigned successfully (no email sent)');
      }
    } catch (err: any) {
      setAddStudentError(err.response?.data?.error || "Failed to add student.");
      setAssignmentEmailConfirmOpen(false);
    } finally {
      setAddingStudent(false);
    }
  };

  // Add this function for refreshing adviser data
  const refreshAdviserData = async () => {
    if (viewAdviser) {
      await fetchStudents(viewAdviser.id);
      await fetchPendingStudents(viewAdviser.id);
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
            {/* Change Users icon background and border to rose-500 */}
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              {/* Change icon color to rose-500 */}
              <Users className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              {/* Change header text color to rose-500 */}
              <span className="text-base font-semibold ">
                Advisers
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
                <UserPlus className="mr-2 h-4 w-4" />
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
                <TableHead className="w-[90px] min-w-[70px] max-w-[100px] text-center">Students</TableHead> {/* <-- Add this line */}
                <TableHead className="w-[110px] min-w-[90px] max-w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[120px] min-w-[100px] max-w-[140px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdvisers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground dark:text-zinc-400">
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
                    {/* Students Count Column */}
                    <TableCell className="text-center text-zinc-700 dark:text-zinc-300">
                      {typeof a.assigned_students_count === "number" ? a.assigned_students_count : 0}
                    </TableCell>
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
      <Dialog open={viewDialogOpen} onOpenChange={async open => {
        setViewDialogOpen(open);
        if (open && viewAdviser) {
          setStudents([]); // Clear previous students
          setPendingStudents([]); // Clear previous pending students
          await refreshAdviserData();
        }
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
                  {/* Change to rose-500 */}
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                    <User className="h-7 w-7 text-rose-500" />
                  </div>
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
              <div className="flex items-center justify-between mb-2">
                <TabsList>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={refreshAdviserData}
                  disabled={studentsLoading || pendingLoading}
                  title="Refresh student lists"
                >
                  <RefreshCw className={`mr-1 h-4 w-4 ${studentsLoading || pendingLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
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
            {/* Error Alert (formal, profile.tsx style) */}
            {addStudentError && (
              <Alert className="bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 flex items-start gap-3 px-4 py-3 rounded-xl">
                <Info className="h-5 w-5 text-rose-500 dark:text-rose-400 mt-1 flex-shrink-0" />
                <div>
                  <AlertTitle className="font-semibold mb-1">Cannot Assign Student</AlertTitle>
                  <AlertDescription>
                    {addStudentError === "This student is already assigned to another adviser."
                      ? "This student is already assigned to another adviser. Each student may only have one adviser at a time. Please verify the student's assignment before proceeding."
                      : addStudentError}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            <Input
              placeholder="Email"
              value={studentEmail}
              onChange={e => setStudentEmail(e.target.value)}
              className="text-xs dark:bg-zinc-800 dark:text-zinc-100"
              disabled={addingStudent}
            />
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

      {/* Invitation Confirmation Dialog */}
      <Dialog open={invitationConfirmOpen} onOpenChange={setInvitationConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-rose-500" />
              Send Invitation Email?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>An invitation email will be sent to:</p>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {pendingInvitation?.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {pendingInvitation?.email}
                </p>
              </div>
              <p className="text-sm">
                The adviser will receive instructions to log in using their UIC credentials and activate their account.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setInvitationConfirmOpen(false);
                setPendingInvitation(null);
              }}
              disabled={sendingInvitation}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={sendingInvitation}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {sendingInvitation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Student Assignment Confirmation Dialog */}
      <Dialog open={assignmentEmailConfirmOpen} onOpenChange={setAssignmentEmailConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" />
              Send Assignment Notification?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>You are assigning a student to:</p>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewAdviser?.first_name} {viewAdviser?.last_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {viewAdviser?.email}
                </p>
              </div>
              <p className="text-sm">
                Student being assigned: <span className="font-medium">{pendingAssignment?.studentEmail}</span>
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Would you like to send an email notification to the adviser?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleConfirmAssignment(false)}
              disabled={addingStudent}
            >
              Skip Email
            </Button>
            <Button
              onClick={() => handleConfirmAssignment(true)}
              disabled={addingStudent}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {addingStudent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
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
      <Toaster richColors position="bottom-right" />
    </div>
  );

}

