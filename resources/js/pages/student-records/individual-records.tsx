import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Eye, X, User } from 'lucide-react';
import ViewPanelist from './view-panelist';

interface StudentInfo {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  course_section: string;
  year_level: string;
  birth_date: string;
  student_id: string;
  academic_status: string;
}

interface PaymentRecord {
  schoolYear: string;
  course: string;
  defenseType: string;
  paymentDate: string;
  amount: string;
  status: string;
}

const student: StudentInfo = {
  first_name: 'Troy Wendell',
  middle_name: 'Guido',
  last_name: 'Peralta',
  gender: 'Male',
  course_section: 'BSIT - 2A',
  year_level: '2nd Year',
  birth_date: '2005-03-22',
  student_id: '230000001926',
  academic_status: 'Regular',
};

const paymentRecords: PaymentRecord[] = [
  {
    schoolYear: '2023-2024',
    course: 'BSIT - 2A',
    defenseType: 'Proposal',
    paymentDate: '03-12-2024',
    amount: '₱450.00',
    status: 'Completed',
  },
  {
    schoolYear: '2023-2024',
    course: 'BSIT - 2A',
    defenseType: 'Pre-final',
    paymentDate: '04-07-2024',
    amount: '₱450.00',
    status: 'Completed',
  },
  {
    schoolYear: '2023-2024',
    course: 'BSIT - 2A',
    defenseType: 'Final',
    paymentDate: '08-16-2024',
    amount: '₱450.00',
    status: 'Completed',
  },
  {
    schoolYear: '2024-2025',
    course: 'BSIT - 2A',
    defenseType: 'Proposal',
    paymentDate: '03-12-2025',
    amount: '₱500.00',
    status: 'Completed',
  },
  {
    schoolYear: '2024-2025',
    course: 'BSIT - 2A',
    defenseType: 'Pre-final',
    paymentDate: '04-07-2025',
    amount: '₱990.00',
    status: 'Ongoing',
  },
];

export default function IndividualRecord() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="py-10 px-6">
      <Head title="Individual Record" />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center">
          <div className="relative bg-white shadow-xl rounded-xl p-6 max-w-4xl w-full">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              onClick={() => setShowModal(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <ViewPanelist onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Honorarium Summary</h1>
      </div>

      <div className="max-w-screen-lg mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6">
          <User className="w-24 h-24 rounded-full bg-gray-200" />

          <div className="grid grid-cols-3 gap-x-15 gap-y-1 text-sm">
            <div>
              <p className="text-gray-500">First Name</p>
              <p className="text-black text-base">{student.first_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="text-black text-base">{student.gender}</p>
            </div>
            <div>
              <p className="text-gray-500">Middle Name</p>
              <p className="text-black text-base">{student.middle_name}</p>
            </div>
            <div>
              <p className="text-gray-500">School Year</p>
              <p className="text-black text-base">{student.year_level}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Name</p>
              <p className="text-black text-base">{student.last_name}</p>
            </div>
            <div>
              <p className="text-gray-500">ID Number</p>
              <p className="text-black text-base">{student.student_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Course & Section</p>
              <p className="text-black text-base">{student.course_section}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="text-black text-base">{student.birth_date}</p>
            </div>
            <div>
              <p className="text-gray-500">Academic Status</p>
              <p className="text-black text-base">{student.academic_status}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-8">
          <table className="w-full text-sm border rounded-md">
            <thead className="bg-rose-500 text-white">
              <tr>
                <th className="p-2">School Year</th>
                <th className="p-2">Payment Date</th>
                <th className="p-2">Defense Status</th>
                <th className="p-2">Payment Amount</th>
                <th className="p-2">View Panelist</th>
              </tr>
            </thead>
            <tbody>
              {paymentRecords.map((record, index) => (
                <tr key={index} className="text-center border-t hover:bg-gray-100">
                  <td className="p-2">{record.schoolYear}</td>
                  <td className="p-2">{record.paymentDate}</td>
                  <td className="p-2">{record.status}</td>
                  <td className="p-2">{record.amount}</td>
                  <td className="p-2">
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-gray-600 hover:text-rose-500"
                    >
                      <Eye className="w-5 h-5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
