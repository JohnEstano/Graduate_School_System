import React from "react";

interface PrintButtonProps {
  targetId: string; 
}

export default function PrintButton({ targetId }: PrintButtonProps) {
  const handlePrint = () => {
    const content = document.getElementById(targetId);
    if (!content) return;

    // Open a new window for printing
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    // Basic styling for table and headings
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 24px; margin-bottom: 10px; }
        h2 { font-size: 20px; margin-top: 20px; margin-bottom: 5px; }
        h3 { font-size: 16px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background-color: #e5e7eb; }
        td.amount { text-align: right; }
        .panelist-info { margin-bottom: 5px; }
      </style>
    `;

    // Clone the panelists and program info
    const printContent = content.cloneNode(true) as HTMLElement;

    // Optional: remove buttons from the cloned content
    printContent.querySelectorAll("button").forEach(btn => btn.remove());

    // Write HTML to print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Honorarium</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1 border"
    >
      Print
    </button>
  );
}
