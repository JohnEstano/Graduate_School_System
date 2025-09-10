import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, User } from 'lucide-react';
import { useState } from 'react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="py-2 px-6">
      <Head title="Individual Record" />

      <h1 className="text-2xl font-bold mb-2">Honorarium Summary</h1>

      <div className="max-w-screen-lg mx-auto bg-white dark:bg-[#121212] rounded-lg shadow p-2 mb-2">
        <div className="flex items-start space-x-6 mb-6">
          <User className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mt-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div>
              <p className="text-gray-500">First Name</p>
              <p className="text-black dark:text-white">{record.first_name}</p>
              <p className="text-gray-500 mt-2">Middle Name</p>
              <p className="text-black dark:text-white">{record.middle_name || '-'}</p>
              <p className="text-gray-500 mt-2">Last Name</p>
              <p className="text-black dark:text-white">{record.last_name}</p>
            </div>

            <div>
              <p className="text-gray-500">Gender</p>
              <p className="text-black dark:text-white">{record.gender || '-'}</p>
              <p className="text-gray-500 mt-2">School Year</p>
              <p className="text-black dark:text-white">{record.school_year || '-'}</p>
              <p className="text-gray-500 mt-2">Student ID</p>
              <p className="text-black dark:text-white">{record.student_id || '-'}</p>
            </div>

            <div>
              <p className="text-gray-500">Course & Section</p>
              <p className="text-black dark:text-white">{record.course_section || '-'}</p>
              <p className="text-gray-500 mt-2">Birthdate</p>
              <p className="text-black dark:text-white">{record.birthdate || '-'}</p>
              <p className="text-gray-500 mt-2">Academic Status</p>
              <p className="text-black dark:text-white">{record.academic_status || '-'}</p>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Payments</h2>
          <Table className="min-w-full text-sm">
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
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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

      {/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-white dark:bg-gray-800 w-1/2 max-h-[60vh] min-h-[40vh] rounded-lg shadow-lg overflow-auto p-6 relative">

      {/* Header */}
      <div className="h-10 bg-rose-500 rounded-t-lg mb-4 flex items-center justify-center">
        <h2 className="text-white font-semibold">Panelists</h2>
      </div>

      {/* Table */}
      <table className="w-full border border-gray-200 text-sm text-gray-700">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Chair Name</th>
            <th className="border px-4 py-2 text-left">Member Name</th>
          </tr>
        </thead>
        <tbody>
          {panelData.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.chair}</td>
              <td className="border px-4 py-2">{row.member}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded"
                >
                  Close
                </Button>
              </div>
    </div>
  </div>
)}

    </div>
  );
}
