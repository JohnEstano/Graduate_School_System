import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import ViewPanelist from './view-panelist';

const panelistInfo = {
  panelistName: 'Troy Wendell G. Peralta',
  role: 'Panelist',
  defenseType: 'Final Defense',
  recievedDate: '2025-05-12',
  amountRecieved: '₱450.00',
}

const paymentRecords = [
  {
    studentName: 'Troy Wendell G. Peralta',
    paymentDate: '2025-05-12',
    defenseStatus: 'Completed',
    paymentAmount: '₱450.00',
  },
  {
    studentName: 'Troy Wendell G. Peralta',
    paymentDate: '2025-05-12',
    defenseStatus: 'Completed',
    paymentAmount: '₱450.00',
  },
  {
    studentName: 'Troy Wendell G. Peralta',
    paymentDate: '2025-05-12',
    defenseStatus: 'Completed',
    paymentAmount: '₱450.00',
  },
  {
    studentName: 'Troy Wendell G. Peralta',
    paymentDate: '2025-05-12',
    defenseStatus: 'Completed',
    paymentAmount: '₱450.00',
  },
  {
    studentName: 'Troy Wendell G. Peralta',
    paymentDate: '2025-05-12',
    defenseStatus: 'Completed',
    paymentAmount: '₱450.00',
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
      <ViewPanelist onClose={() => setShowModal(false)} />

      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
        onClick={() => setShowModal(false)}
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  </div>
)}

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Honorarium Summary</h1>
      </div>

      <div className="max-w-screen-lg mx-auto bg-white rounded-lg shadow p-6">
        {/* Student Info */}
        <div className="flex gap-6 border-b pb-6 mb-4">
          <div className="w-32 h-32 bg-gray-300 rounded-full" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>First name:</strong> {panelistInfo.panelistName}</p>
            <p><strong>Role: </strong> {panelistInfo.role}</p>
            <p><strong>Defense type: </strong> {panelistInfo.defenseType}</p>
            <p><strong>Recieved date: </strong> {panelistInfo.recievedDate}</p>
            <p><strong>Amount recieved: </strong> {panelistInfo.amountRecieved}</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-md">
            <thead className="bg-rose-500 text-white">
              <tr>
                <th className="p-2">School Year</th>
                <th className="p-2">Course & Section</th>
                <th className="p-2">Defense Type</th>
                <th className="p-2">Payment Date</th>
                <th className="p-2">Payment Amount</th>
                <th className="p-2">Defense Status</th>
                <th className="p-2">View Panelist</th>
              </tr>
            </thead>
            <tbody>
              {paymentRecords.map((record, index) => (
                <tr key={index} className="text-center border-t hover:bg-gray-100">
                  <td className="p-2">2024-2025</td>
                  <td className="p-2">BSCS 4A</td>
                  <td className="p-2">{panelistInfo.defenseType}</td>
                  <td className="p-2">{record.paymentDate}</td>
                  <td className="p-2">{record.paymentAmount}</td>
                  <td className="p-2">{record.defenseStatus}</td>
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
