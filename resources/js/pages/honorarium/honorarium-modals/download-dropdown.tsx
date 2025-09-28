"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, FileDigit, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";

import { ProgramRecord } from "@/pages/honorarium/Index";

interface Payment {
  id: number;
  payment_date: string;
  defense_status: string;
  amount: number;
}

interface Student {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  course_section: string;
  school_year: string;
  payments: Payment[];
}

interface Panelist {
  id: number;
  pfirst_name: string;
  pmiddle_name?: string;
  plast_name: string;
  role: string;
  defense_type: string;
  received_date: string;
  amount: number;
  students?: Student[];
}

interface DownloadDropdownProps {
  record: ProgramRecord;
  panelists: Panelist[];
}

export default function DownloadDropdown({ record, panelists }: DownloadDropdownProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // --- CSV ---
  const downloadCSV = () => {
    const escapeCsvField = (field: string) => (/[",\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field);
    const filename = `${record.name}_panelists.csv`;
    const header = [
      "Panelist Name", "Role", "Defense Type", "Received Date",
      "Panelist Total Amount", "Student Name", "Course/Section",
      "School Year", "Defense Status", "Payment Date", "Amount Paid",
    ];
    const rows: string[][] = [];

    panelists.forEach(p => {
      const panelistBase = [
        `${p.pfirst_name} ${p.pmiddle_name || ""} ${p.plast_name}`.trim(),
        p.role || "N/A",
        p.defense_type || "N/A",
        p.received_date ? new Date(p.received_date).toLocaleDateString() : "N/A",
        Number(p.amount)?.toFixed(2) || "0.00",
      ];

      if (p.students?.length) {
        p.students.forEach(student => {
          (student.payments?.length ? student.payments : [{ id: -1, amount: 0, defense_status: 'N/A', payment_date: '' }])
            .forEach(pay => {
              rows.push([
                ...panelistBase,
                `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim(),
                student.course_section || "N/A",
                student.school_year || "N/A",
                pay.defense_status || "N/A",
                pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : "N/A",
                Number(pay.amount)?.toFixed(2) || "0.00",
              ]);
            });
        });
      } else {
        rows.push([...panelistBase, "N/A", "N/A", "N/A", "N/A", "N/A", "0.00"]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," +
      [header, ...rows].map(row => row.map(escapeCsvField).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PDF (Backend + Fallback to Client) ---
  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.get(`/honorarium-summary/${record.id}/download-pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        timeout: 15000,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${record.name}_honorarium.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.warn("Backend PDF failed, falling back to client-side PDF...", error);

      try {
        const element = document.getElementById("honorarium-details");
        if (!element) {
          alert("PDF Export Error: Content area not found.");
          return;
        }

        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);

        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
        const imgWidth = imgProps.width * ratio;
        const imgHeight = imgProps.height * ratio;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`${record.name}_honorarium.pdf`);
      } catch (fallbackError) {
        console.error("Fallback PDF generation failed:", fallbackError);
        alert("Failed to generate PDF with both backend and fallback method.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // --- DOCX ---
  const downloadDOCX = async () => {
    setIsGenerating(true);
    try {
      const createStyledHeaderCell = (text: string) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })], alignment: AlignmentType.CENTER })],
          shading: { fill: "E5E7EB" },
        });

      const docChildren: any[] = [
        new Paragraph({ text: record.name, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: `Honorarium summary for the ${record.program} program. Last updated on ${new Date(record.date_edited).toLocaleDateString()}.`, heading: HeadingLevel.HEADING_3 }),
        new Paragraph(""),
      ];

      panelists.forEach(p => {
        const panelistName = `${p.pfirst_name} ${p.pmiddle_name || ""} ${p.plast_name}`.trim();
        docChildren.push(new Paragraph({ text: panelistName, heading: HeadingLevel.HEADING_2 }));
        docChildren.push(new Paragraph({ children: [
          new TextRun(`Role: ${p.role || 'N/A'} | `),
          new TextRun(`Defense Type: ${p.defense_type || 'N/A'} | `),
          new TextRun(`Total Amount: ₱${Number(p.amount)?.toFixed(2) || "0.00"}`),
        ]}));

        const studentRows = (p.students?.length ? p.students.flatMap(student =>
          (student.payments || []).map(pay =>
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph(`${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim())] }),
              new TableCell({ children: [new Paragraph(student.course_section)] }),
              new TableCell({ children: [new Paragraph(student.school_year)] }),
              new TableCell({ children: [new Paragraph(pay.defense_status)] }),
              new TableCell({ children: [new Paragraph(new Date(pay.payment_date).toLocaleDateString())] }),
              new TableCell({ children: [new Paragraph({ text: `₱${Number(pay.amount).toFixed(2)}`, alignment: AlignmentType.END })] }),
            ]})
          )
        ) : [new TableRow({ children: [new TableCell({ children: [new Paragraph("No student data available.")], columnSpan: 6 })] })]);

        docChildren.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              createStyledHeaderCell("Student Name"),
              createStyledHeaderCell("Course/Section"),
              createStyledHeaderCell("School Year"),
              createStyledHeaderCell("Defense Status"),
              createStyledHeaderCell("Payment Date"),
              createStyledHeaderCell("Amount Paid"),
            ]}),
            ...studentRows
          ]
        }));
        docChildren.push(new Paragraph(""));
      });

      const doc = new Document({ sections: [{ children: docChildren }] });
      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${record.name}_honorarium.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert("Failed to generate DOCX. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
          disabled={isGenerating}
        >
          <Download size={16} />
          {isGenerating ? "Generating..." : "Download"}
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadCSV} className="text-xs">
          <FileDigit size={14} className="mr-2" /> CSV Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPDF} className="text-xs">
          <FileText size={14} className="mr-2" /> PDF Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadDOCX} className="text-xs">
          <FileText size={14} className="mr-2" /> Word Document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
