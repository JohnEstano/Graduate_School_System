"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import axios from "@/lib/axios";
import { ProgramRecord } from "@/pages/honorarium/Index";
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
        // First try the API endpoint
        const apiResponse = await axios.get(`/api/honorarium/${record.id}/download-pdf`, {
          responseType: 'blob',
          params: {
            record_id: record.id,
            panelists: panelists.map(p => p.id)
          },
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          timeout: 15000,
        });
        pdfBlob = new Blob([apiResponse.data], { type: 'application/pdf' });
      } catch (apiError) {
        console.warn('API PDF generation failed, trying fallback route...', apiError);
        
        // Fallback to direct route
        try {
          const fallbackResponse = await axios.get(`/honorarium-summary/${record.id}/download-pdf`, {
            responseType: 'blob',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            timeout: 15000,
          });
          pdfBlob = new Blob([fallbackResponse.data], { type: 'application/pdf' });
        } catch (fallbackError) {
          console.warn("Both backend PDF methods failed, falling back to client-side PDF...", fallbackError);
          throw new Error("Backend methods failed");
        }
      }

      // Create download link for backend-generated PDF
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `honorarium-${record.name || record.id}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.warn("All backend methods failed, using client-side fallback...", error);

      try {
        // Client-side fallback using html2canvas and jsPDF
        const element = document.getElementById("honorarium-details");
        if (!element) {
          alert("PDF Export Error: Content area not found.");
          return;
        }

        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          logging: false
        });
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
        console.error("Client-side PDF generation also failed:", fallbackError);
        alert("Failed to generate PDF with all methods. Please try again or contact support.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle row click propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Always stop propagation first
    
    // Call the onClick prop if provided
    if (onClick) {
      onClick(e);
    }
    
    // Only proceed if the event wasn't prevented by the onClick handler
    if (!e.defaultPrevented) {
      downloadPDF();
    }
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