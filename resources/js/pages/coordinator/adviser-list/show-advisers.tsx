import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Users, Search, Trash, UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type Adviser = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  program: string;
  name?: string; // Full name from backend search
  employee_id?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Adviser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAdviser, setSelectedAdviser] = useState<Adviser | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adviserToRemove, setAdviserToRemove] = useState<Adviser | null>(null);
  const [registering, setRegistering] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    axios.get("/api/coordinator/advisers")
      .then(res => setAdvisers(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Search for advisers with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);
    searchTimeoutRef.current = setTimeout(() => {
      axios.get("/api/coordinator/advisers/search", {
        params: { query: searchQuery }
      })
        .then(res => {
          setSearchResults(res.data);
          setShowDropdown(res.data.length > 0);
        })
        .finally(() => setSearchLoading(false));
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const filteredAdvisers = advisers.filter(
    (a) =>
      a.first_name.toLowerCase().includes(query.toLowerCase()) ||
      a.last_name.toLowerCase().includes(query.toLowerCase()) ||
      a.email.toLowerCase().includes(query.toLowerCase()) ||
      a.program.toLowerCase().includes(query.toLowerCase())
  );

  const handleRegister = async () => {
    if (!selectedAdviser) return;
    
    setRegistering(true);
    try {
      await axios.post("/api/coordinator/advisers", {
        adviser_id: selectedAdviser.id,
      });
      
      // Refresh list
      const advisersRes = await axios.get("/api/coordinator/advisers");
      setAdvisers(advisersRes.data);
      
      // Close dialog and reset form
      setDialogOpen(false);
      setSearchQuery("");
      setSelectedAdviser(null);
      setSearchResults([]);
      setShowDropdown(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to register adviser");
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
              // Reset form when dialog closes
              setSearchQuery("");
              setSelectedAdviser(null);
              setSearchResults([]);
              setShowDropdown(false);
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
                  Search and select an adviser to register to your program.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Popover open={showDropdown} onOpenChange={setShowDropdown}>
                  <PopoverTrigger asChild>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Search Adviser</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type name or email (min 2 characters)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => {
                            if (searchQuery.length >= 2 && searchResults.length > 0) {
                              setShowDropdown(true);
                            }
                          }}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        {searchLoading && (
                          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>
                          {searchLoading ? "Searching..." : "No advisers found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((adviser) => (
                            <CommandItem
                              key={adviser.id}
                              value={adviser.name || adviser.email}
                              onSelect={() => {
                                setSelectedAdviser(adviser);
                                setSearchQuery(adviser.name || "");
                                setSearchResults([]);
                                setShowDropdown(false);
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <UserPlus className="h-4 w-4" />
                              <div className="flex-1">
                                <div className="font-medium">{adviser.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {adviser.email} • {adviser.program}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedAdviser && (
                  <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
                    <div className="text-sm font-medium">Selected Adviser:</div>
                    <div className="text-sm">{selectedAdviser.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedAdviser.email}</div>
                    <div className="text-xs text-muted-foreground">{selectedAdviser.program}</div>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button 
                  onClick={handleRegister} 
                  disabled={!selectedAdviser || registering}
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