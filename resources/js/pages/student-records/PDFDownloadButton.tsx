import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ProgramRecord {
  id: number;
  name?: string;
}

interface PDFDownloadButtonProps {
  record: ProgramRecord;
  onClick?: (e: React.MouseEvent) => void;
  useServerSide?: boolean; // Toggle between server-side and client-side
}

export default function PDFDownloadButton({ 
  record, 
  onClick,
  useServerSide = true 
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Server-side download (Laravel route)
  const handleServerDownload = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch(`/payments/${record.id}/download-pdf`, {

        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${record?.name || record?.id || "honorarium"}_honorarium.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Client-side generation (html2canvas fallback)
  const handleClientDownload = async () => {
    try {
      setIsGenerating(true);

      // Dynamically import to reduce bundle size
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("honorarium-details");
      if (!element) {
        alert("Honorarium container not found!");
        return;
      }

      // Convert all img elements to use base64
      const images = element.querySelectorAll('img');
      const imagePromises = Array.from(images).map(async (img) => {
        try {
          // Try to convert image to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          if (ctx) {
            ctx.drawImage(img as HTMLImageElement, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            img.setAttribute('src', dataUrl);
          }
        } catch (err) {
          console.warn('Failed to convert image:', err);
        }
      });

      await Promise.all(imagePromises);

      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, "", "FAST");

      let heightLeft = imgHeight - pageHeight;
      let position = 0;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`${record?.name || record?.id || "honorarium"}_honorarium.pdf`);
      
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = useServerSide ? handleServerDownload : handleClientDownload;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
    if (!e.defaultPrevented) handleDownload();
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