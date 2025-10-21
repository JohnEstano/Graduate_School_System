import React, { useState } from "react";
import { BadgeDollarSign, FileText, X } from "lucide-react";
import { Separator } from '@/components/ui/separator';

type PaymentValidationProps = {
  details: {
    attachments?: any;
    amount?: number;
    reference_no?: string;
    expected_rate?: number | string; // <-- Add this
  };
  resolveFileUrl: (url?: string | null) => string | null;
};

export default function PaymentValidationSection({ details, resolveFileUrl }: PaymentValidationProps) {
  const [showPreview, setShowPreview] = useState(false);
  const proofUrl = details?.attachments?.proof_of_payment
    ? resolveFileUrl(details.attachments.proof_of_payment)
    : null;

  // Helper: check if file is image
  function isImage(url: string | null) {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  // Helper to format PHP currency
  function formatPhp(val: number | string | undefined | null) {
    if (val === undefined || val === null || val === "") return "—";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "—";
    return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  // Compare paid vs expected
  const paid = details?.amount ?? null;
  const expected = details?.expected_rate ?? null;
  const isMatch = paid !== null && expected !== null && Number(paid) === Number(expected);

  return (
    <div className="rounded-xl border p-8 bg-white dark:bg-zinc-900 space-y-6">
      <h2 className="text-medium font-medium flex items-center gap-2 mb-4">
        <BadgeDollarSign className="h-5 w-5" /> Payment Validation
      </h2>
      <Separator className="mb-4" />

      {/* Proof of Payment */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Proof of Payment</div>
        {proofUrl ? (
          isImage(proofUrl) ? (
            <>
              <img
                src={proofUrl}
                alt="Proof of Payment"
                className="rounded border object-cover w-32 h-32 cursor-pointer transition hover:scale-105"
                onClick={() => setShowPreview(true)}
                style={{ objectFit: "cover" }}
              />
              {/* Fullscreen preview modal */}
              {showPreview && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                  onClick={() => setShowPreview(false)}
                >
                  <div className="relative">
                    <img
                      src={proofUrl}
                      alt="Proof of Payment Full"
                      className="max-w-[90vw] max-h-[90vh] rounded shadow-lg"
                    />
                    <button
                      className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
                      onClick={e => {
                        e.stopPropagation();
                        setShowPreview(false);
                      }}
                    >
                      <X className="h-5 w-5 text-black" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-zinc-900 hover:bg-muted transition w-fit"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">Download</span>
              <span className="text-xs text-muted-foreground ml-2 truncate max-w-[180px]">
                {proofUrl.split('/').pop()}
              </span>
            </a>
          )
        ) : (
          <span className="text-muted-foreground text-sm">No file uploaded.</span>
        )}
      </div>

      {/* Amount Paid */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Amount Paid</div>
        <div className="font-medium text-sm">{formatPhp(paid)}</div>
      </div>

      {/* Expected Amount */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Expected Amount</div>
        <div className={`font-medium text-sm ${isMatch ? "text-green-700" : "text-red-600"}`}>
          {formatPhp(expected)}
          {paid !== null && expected !== null && !isMatch && (
            <span className="ml-2 text-xs text-red-600 font-semibold">(Mismatch)</span>
          )}
        </div>
      </div>


      {/* Reference No. */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Reference No.</div>
        <div className="font-medium text-sm">{details?.reference_no || '—'}</div>
      </div>
    </div>
  );
}