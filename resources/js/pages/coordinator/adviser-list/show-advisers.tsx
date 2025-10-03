import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Adviser = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  program: string;
};

function getInitials(adviser: Adviser) {
  const first = adviser.first_name?.trim()?.[0] ?? "";
  const last = adviser.last_name?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "U";
}

export default function ShowAdvisers() {
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adviserToRemove, setAdviserToRemove] = useState<Adviser | null>(null);

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
    // You can implement search by email or ID for real use
    // For demo, let's assume you have an endpoint to search adviser by email and get their ID
    const res = await axios.post("/api/coordinator/advisers", {
      adviser_id: email, // Replace with actual adviser_id after lookup
    });
    // Refresh list
    const advisersRes = await axios.get("/api/coordinator/advisers");
    setAdvisers(advisersRes.data);
    setDialogOpen(false);
    setEmail("");
  };

  const handleRemoveAdviser = async () => {
    if (!adviserToRemove) return;
    await axios.delete(`/api/coordinator/advisers/${adviserToRemove.id}`);
    setAdvisers(advisers.filter(a => a.id !== adviserToRemove.id));
    setConfirmOpen(false);
    setAdviserToRemove(null);
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 py-1 text-sm" onClick={() => setDialogOpen(true)}>
                Register an Adviser
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register an Adviser</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <input
                  type="text"
                  placeholder="Adviser Email or ID"
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
        <div className="flex flex-row items-center justify-between w-full p-3 border-t bg-white">
          <Input
            type="text"
            startIcon={Search}
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="max-w-xs text-sm py-1 h-8"
          />
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm whitespace-nowrap">
              Shareable Coordinator Code:
            </span>
            <CoordinatorCodeBox />
          </div>
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
                  <TableCell>
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
    </div>
  );
}

export function CoordinatorCodeBox() {
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/coordinator/code")
      .then(res => res.json())
      .then(data => setCode(data.coordinator_code));
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
        aria-label="Copy coordinator code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </Button>
    </div>
  );
}