import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface IndividualRecordModalProps {
  show: boolean;
  onClose: () => void;
  record: {
    name: string;
    program: string;
    recentlyUpdated: string;
    timeLastOpened: string;
    dateEdited: string;
  } | null;
}

// In a real app, this data would come from your database via an API call.
// This structure maps program acronyms to their specific panelist records.
const programDetails = {
  'MIT': [
    { id: 1, panelistName: 'Dr. Evelyn Cruz', role: 'Chair', defenseType: 'Final', receivedDate: 'May 12, 2025', amount: 450.00 },
    { id: 2, panelistName: 'Prof. Marco Reyes', role: 'Member', defenseType: 'Proposal', receivedDate: 'June 4, 2025', amount: 450.00 },
  ],
  'MBA': [
    { id: 3, panelistName: 'Dr. Lilia Santos', role: 'Chair', defenseType: 'Pre-final', receivedDate: 'June 4, 2025', amount: 450.00 },
  ],
  'MCS': [
    { id: 4, panelistName: 'Dr. Alan Turing', role: 'Member', defenseType: 'Final', receivedDate: 'July 1, 2025', amount: 450.00 },
    { id: 5, panelistName: 'Ms. Ada Lovelace', role: 'Member', defenseType: 'Final', receivedDate: 'July 1, 2025', amount: 450.00 },
    { id: 6, panelistName: 'Dr. Grace Hopper', role: 'Chair', defenseType: 'Final', receivedDate: 'July 2, 2025', amount: 450.00 },
  ],
  'MAED': [
    { id: 7, panelistName: 'Prof. John Dewey', role: 'Chair', defenseType: 'Proposal', receivedDate: 'July 15, 2025', amount: 450.00 },
  ],
};

export default function IndividualRecordModal({ show, onClose, record }: IndividualRecordModalProps) {
  if (!record) return null;

  const honorariumRecords = programDetails[record.program as keyof typeof programDetails] || [];

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">{record.name}</DialogTitle>
          <DialogDescription>
            Honorarium summary for the {record.program} program. Last updated: {record.dateEdited}.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg">
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[250px]">Panelist</TableHead>
                <TableHead>Defense Type</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead className="text-right">Amount Received</TableHead>
                <TableHead className="text-center">Records</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {honorariumRecords.length > 0 ? (
                honorariumRecords.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                          <AvatarFallback>{item.panelistName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.panelistName}</p>
                          <p className="text-sm text-muted-foreground">{item.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.defenseType}</TableCell>
                    <TableCell>{item.receivedDate}</TableCell>
                    <TableCell className="text-right">₱{item.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No honorarium records found for this program.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}