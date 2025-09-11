import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, User } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Payment {
  id: number;
  school_year: string;
  payment_date: string;
  defense_status: string;
  amount: string;
}

interface StudentRecord {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  school_year: string | null;
  student_id: string | null;
  course_section: string | null;
  birthdate: string | null;
  academic_status: string | null;
  payments?: Payment[];
}

interface IndividualRecordProps {
  record: StudentRecord;
}

interface PanelRow {
  chair: string;
  member: string;
}

const panelData: PanelRow[] = [
  { chair: 'Chair Person 1', member: 'Panelist 1' },
  { chair: 'Chair Person 2', member: 'Panelist 2' },
  { chair: 'Chair Person 3', member: 'Panelist 3' },
];

export default function IndividualRecord({ record }: IndividualRecordProps) {
  return (
    <div className="py-2 px-6">
      <Head title="Individual Record" />

      <h1 className="text-2xl font-bold mb-4">Honorarium Summary</h1>

      <div className="rounded-md overflow-x-auto border bg-white dark:bg-[#121212] p-4">
        <div className="flex items-start space-x-6">
          <Avatar className="w-36 h-36">
            <AvatarFallback className="text-4xl">
              {record.first_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 pt-2">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">{record.first_name}</p>
              <p className="text-sm text-gray-500 mt-4">Middle Name</p>
              <p className="font-medium">{record.middle_name || '-'}</p>
              <p className="text-sm text-gray-500 mt-4">Last Name</p>
              <p className="font-medium">{record.last_name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{record.gender || '-'}</p>
              <p className="text-sm text-gray-500 mt-4">School Year</p>
              <p className="font-medium">{record.school_year || '-'}</p>
              <p className="text-sm text-gray-500 mt-4">Student ID</p>
              <p className="font-medium">{record.student_id || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Course & Section</p>
              <p className="font-medium">{record.course_section || '-'}</p>
              <p className="text-sm text-gray-500 mt-4">Birthdate</p>
              <p className="font-medium">{record.birthdate || '-'}</p>
              <p className="text-sm text-gray-500 mt-4">Academic Status</p>
              <p className="font-medium">{record.academic_status || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md overflow-x-auto border bg-white dark:bg-[#121212] p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Payments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School Year</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Defense Status</TableHead>
              <TableHead>Payment Amount</TableHead>
              <TableHead>View Panelist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {record.payments && record.payments.length > 0 ? (
              record.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.school_year}</TableCell>
                  <TableCell>{payment.payment_date}</TableCell>
                  <TableCell>{payment.defense_status}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Panelists</DialogTitle>
                          <DialogDescription>
                            List of chair and member panelists.
                          </DialogDescription>
                        </DialogHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Chair Name</TableHead>
                              <TableHead>Member Name</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {panelData.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{row.chair}</TableCell>
                                <TableCell>{row.member}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <DialogFooter>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline">
                              Close
                            </Button>
                          </DialogTrigger>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
