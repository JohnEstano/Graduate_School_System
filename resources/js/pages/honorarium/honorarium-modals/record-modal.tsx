// "use client";
// import AppLayout from "@/layouts/app-layout";
// import { type BreadcrumbItem } from "@/types";
// import { Head, Link } from "@inertiajs/react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft } from "lucide-react";

// type StudentRecord = {
//   id: number;
//   first_name: string;
//   last_name: string;
//   course_section: string;
//   academic_status: string;
// };

// type PanelistRecord = {
//   id: number;
//   pfirst_name: string;
//   plast_name: string;
//   role: string;
// };

// export type ProgramRecord = {
//   id: number;
//   name: string;
//   program: string;
//   category: string;
//   date_edited: string;
//   student_records: StudentRecord[];
//   panelist_records: PanelistRecord[];
// };

// export default function IndividualRecord({ record }: { record: ProgramRecord }) {
//   const breadcrumbs: BreadcrumbItem[] = [
//     { title: "Honorarium", href: "/honorarium" },
//     { title: record.name, href: `/honorarium/${record.id}` },
//   ];

//   return (
//     <AppLayout breadcrumbs={breadcrumbs}>
//       <Head title={`Program: ${record.name}`} />

//       <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
//         <div className="flex items-center justify-between mb-6">
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight">
//               {record.name}
//             </h1>
//             <p className="text-muted-foreground">
//               {record.program} • {record.category}
//             </p>
//           </div>
//           <Link href="/honorarium">
//             <Button variant="outline" className="flex items-center gap-2">
//               <ArrowLeft className="w-4 h-4" />
//               Back to Summary
//             </Button>
//           </Link>
//         </div>

//         {/* Student Records */}
//         <div className="mb-8">
//           <h2 className="text-lg font-semibold mb-2">Student Records</h2>
//           <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
//             <Table className="min-w-full text-sm">
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Course Section</TableHead>
//                   <TableHead>Status</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {record.student_records.length > 0 ? (
//                   record.student_records.map((student) => (
//                     <TableRow key={student.id}>
//                       <TableCell>
//                         {student.first_name} {student.last_name}
//                       </TableCell>
//                       <TableCell>{student.course_section}</TableCell>
//                       <TableCell>{student.academic_status}</TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={3} className="text-center py-4">
//                       No students found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </div>

//         {/* Panelist Records */}
//         <div>
//           <h2 className="text-lg font-semibold mb-2">Panelists</h2>
//           <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
//             <Table className="min-w-full text-sm">
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Role</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {record.panelist_records.length > 0 ? (
//                   record.panelist_records.map((panelist) => (
//                     <TableRow key={panelist.id}>
//                       <TableCell>
//                         {panelist.pfirst_name} {panelist.plast_name}
//                       </TableCell>
//                       <TableCell>{panelist.role}</TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={2} className="text-center py-4">
//                       No panelists found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }
