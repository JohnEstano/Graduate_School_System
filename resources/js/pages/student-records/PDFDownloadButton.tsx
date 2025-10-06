"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas"; 
import { jsPDF } from "jspdf";

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

interface ProgramRecord {
  id: number;
  name: string;
}

interface PDFDownloadButtonProps {
  record: ProgramRecord;
  panelists: Panelist[];
  onClick?: (e: React.MouseEvent) => void;
}

export default function PDFDownloadButton({ record, panelists, onClick }: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      let pdfBlob;

      try {
        // Try primary API endpoint
        const apiRes = await axios.get(`/api/honorarium/${record.id}/download-pdf`, {
          responseType: 'blob',
          params: { record_id: record.id, panelists: panelists.map(p => p.id) },
          headers: { 
            'Accept': 'application/pdf',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          timeout: 15000,
        });
        pdfBlob = new Blob([apiRes.data], { type: 'application/pdf' });
      } catch (apiError) {
        console.warn("Primary API failed, trying fallback...", apiError);
        const fallbackRes = await axios.get(`/honorarium-summary/${record.id}/download-pdf`, {
          responseType: 'blob',
          headers: { 
            'Accept': 'application/pdf',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          timeout: 15000,
        });
        pdfBlob = new Blob([fallbackRes.data], { type: 'application/pdf' });
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `honorarium-${record.name || record.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.warn("Backend failed, using client-side fallback...", error);
      try {
        const element = document.getElementById("honorarium-details");
        if (!element) return alert("PDF Export Error: Content not found.");

        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);

        pdf.addImage(imgData, "PNG", 0, 0, imgProps.width * ratio, imgProps.height * ratio);
        pdf.save(`${record.name || record.id}_honorarium.pdf`);

      } catch (fallbackError) {
        console.error("Client-side PDF generation failed:", fallbackError);
        alert("Failed to generate PDF. Please try again or contact support.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
    if (!e.defaultPrevented) downloadPDF();
  };

  return (
    <Button
      variant="outline"
      className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
      disabled={isGenerating}
      onClick={handleClick}
    >
      <Download size={16} />
      {isGenerating ? "Generating PDF..." : "Download PDF"}
    </Button>
  );
}
