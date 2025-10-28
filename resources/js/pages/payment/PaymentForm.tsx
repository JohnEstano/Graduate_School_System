import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon, Image as ImageIcon, Paperclip } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Payment = {
  payment_id: number;
  or_number: string;
  payment_date: string;
  receipt_image: string | null;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string | null;
  amount_paid?: number | null;
} | null;

type Props = {
  canSubmit: boolean;
  payment: Payment;
  onSuccess?: () => void;
};

export default function PaymentForm({ canSubmit, payment, onSuccess }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Track last object URL to revoke it safely after DOM updates
  const lastPreviewUrlRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dateOpen, setDateOpen] = useState(false); // NEW: control popover open state
  const MAX_RECEIPT_MB = 5;

  type ClientErrors = {
    or_number?: string;
    amount_paid?: string;
    payment_date?: string;
    receipt_image?: string;
  };
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [orUniqueChecking, setOrUniqueChecking] = useState(false);
  const [orUniqueTaken, setOrUniqueTaken] = useState(false);

  // Keep "wire" value in ISO (yyyy-MM-dd) for backend, but display as MM/dd/yyyy in the UI
  const initialDate = useMemo(() => {
    if (!payment?.payment_date) return undefined;
    // Treat stored value as yyyy-MM-dd
    try {
      return parse(payment.payment_date, 'yyyy-MM-dd', new Date());
    } catch {
      return undefined;
    }
  }, [payment?.payment_date]);

  const [uiDate, setUiDate] = useState<Date | undefined>(initialDate);

  const { data, setData, post, processing, errors, reset } = useForm<{
    or_number: string;
    payment_date: string; // yyyy-MM-dd for backend
    receipt_image: File | null;
    amount_paid: number | null;
  }>({
    or_number: payment?.or_number ?? '',
    payment_date: payment?.payment_date ?? '',
    receipt_image: null,
    amount_paid: payment?.amount_paid ?? null,
  });

  function validateOrNumber(value: string): string | undefined {
    if (!value || !value.trim()) return 'OR number is required';
    const v = value.trim();
    if (v.length < 3) return 'OR number must be at least 3 characters';
    if (v.length > 50) return 'OR number must be at most 50 characters';
    if (!/^[A-Z0-9-]+$/.test(v)) return 'Use only capital letters, numbers, and dashes';
    return undefined;
  }

  function decimalsCount(n: number): number {
    const s = String(n);
    const i = s.indexOf('.');
    return i === -1 ? 0 : s.length - i - 1;
  }

  function validateAmount(value: number | null): string | undefined {
    if (value == null) return 'Amount is required';
    if (!Number.isFinite(value)) return 'Invalid amount';
    if (value <= 0) return 'Amount must be greater than 0';
    if (decimalsCount(value) > 2) return 'Amount must have at most 2 decimal places';
    if (value > 1000000) return 'Amount seems too large';
    return undefined;
  }

  function validateDate(d?: Date): string | undefined {
    if (!d) return 'Payment date is required';
    const today = new Date();
    const picked = new Date(d);
    picked.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (picked > today) return 'Payment date cannot be in the future';
    return undefined;
  }

  function validateReceipt(file: File | null, hasExisting: boolean): string | undefined {
    if (!file && !hasExisting) return 'Receipt image is required';
    if (file) {
      if (!file.type.startsWith('image/')) return 'Only image files are allowed';
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_RECEIPT_MB) return `Image must be ${MAX_RECEIPT_MB}MB or smaller`;
    }
    return undefined;
  }

  function runValidation(partial?: (keyof ClientErrors)[]): boolean {
    const errs: ClientErrors = { ...clientErrors };
    const apply = (k: keyof ClientErrors, msg?: string) => { errs[k] = msg; };
    const keys = new Set(partial ?? ['or_number','amount_paid','payment_date','receipt_image']);
    if (keys.has('or_number')) apply('or_number', validateOrNumber(data.or_number));
    if (keys.has('amount_paid')) apply('amount_paid', validateAmount(data.amount_paid));
    if (keys.has('payment_date')) apply('payment_date', validateDate(uiDate));
    if (keys.has('receipt_image')) apply('receipt_image', validateReceipt(data.receipt_image, !!payment?.receipt_image));
    setClientErrors(errs);
    return Object.values(errs).every((v) => !v);
  }

  // Debounced async OR uniqueness check
  useEffect(() => {
    const v = (data.or_number || '').trim();
    // Reset flags if empty or pattern invalid
    if (!v || validateOrNumber(v)) { setOrUniqueTaken(false); setOrUniqueChecking(false); return; }
    let cancelled = false;
    setOrUniqueChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payment/or-unique?or=${encodeURIComponent(v)}`, { credentials: 'same-origin' });
        const json = await res.json().catch(()=>({ unique: true }));
        if (!cancelled) {
          setOrUniqueTaken(!json?.unique);
          setClientErrors((prev)=>({ ...prev, or_number: (!json?.unique) ? 'This OR number is already used' : validateOrNumber(v) }));
        }
      } catch {
        if (!cancelled) setOrUniqueTaken(false);
      } finally {
        if (!cancelled) setOrUniqueChecking(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.or_number]);

  // Keep data.payment_date in sync (yyyy-MM-dd) whenever UI date changes
  useEffect(() => {
    if (uiDate) {
      setData('payment_date', format(uiDate, 'yyyy-MM-dd'));
    } else {
      setData('payment_date', '');
    }
    // validate date on change
    setClientErrors((e)=>({ ...e, payment_date: validateDate(uiDate) }));
  }, [uiDate]);

  useEffect(() => {
    // set default shown filename from existing receipt if any
    if (!fileName && payment?.receipt_image) {
      const base = payment.receipt_image.split('/').pop() || payment.receipt_image;
      setFileName(base);
    }
  }, [payment?.receipt_image, fileName]);

  // Revoke any remaining object URL on unmount
  useEffect(() => {
    return () => {
      if (lastPreviewUrlRef.current) {
        URL.revokeObjectURL(lastPreviewUrlRef.current);
      }
    };
  }, []);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0] ?? null;
    setData('receipt_image', file);
    if (file) {
      setFileName(file.name);
      // Revoke previous URL (if any) before creating a new one
      if (lastPreviewUrlRef.current) {
        URL.revokeObjectURL(lastPreviewUrlRef.current);
        lastPreviewUrlRef.current = null;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      lastPreviewUrlRef.current = url;
    } else {
      setFileName('');
      // Remove preview image from DOM first, then revoke after a tick
      const toRevoke = lastPreviewUrlRef.current;
      setPreviewUrl(null);
      lastPreviewUrlRef.current = null;
      if (toRevoke) {
        setTimeout(() => URL.revokeObjectURL(toRevoke), 0);
      }
    }
    // validate file
    setClientErrors((prev)=>({ ...prev, receipt_image: validateReceipt(file, !!payment?.receipt_image) }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = runValidation();
    if (!ok) return;
    post(route('payment.store'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        // Clear preview, then revoke blob URL after DOM updates to avoid console errors
        const toRevoke = lastPreviewUrlRef.current;
        setPreviewUrl(null);
        lastPreviewUrlRef.current = null;
        if (toRevoke) setTimeout(() => URL.revokeObjectURL(toRevoke), 0);
        setFileName('');
        reset('receipt_image');
        onSuccess?.();
      },
    });
  }

  // Re-validate on first mount and when dependent fields change
  useEffect(() => {
    runValidation(['or_number','amount_paid']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.or_number, data.amount_paid]);

  const isFormValid = Object.values(clientErrors).every((v)=>!v) && !orUniqueChecking && !orUniqueTaken &&
    !!data.or_number && data.amount_paid != null && !!data.payment_date && (!!payment?.receipt_image || !!data.receipt_image);

  // Access non-field server error safely without widening form data type
  const formError: string | undefined = (errors as any)?.form;

  return (
    <div className="rounded-lg bg-white">

      {/* Reduced body padding */}
      <div className="p-2">
        {/* Server-wide form error (e.g., cannot submit yet) */}
        {formError && (
          <div className="md:col-span-2 mb-2">
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          </div>
        )}
        <form onSubmit={onSubmit} encType="multipart/form-data" className="grid gap-5 md:grid-cols-2">
          {/* OR Number */}
          <div>
            <Label className="text-sm">OR number</Label>
            <Input
              className="mt-1 h-9"
              value={data.or_number}
              placeholder="e.g. 2025-OR-000123"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              title="Use only capital letters, numbers, and dashes"
              onChange={(e) => {
                // Allow only A-Z, 0-9, and dash; auto-uppercase
                const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                setData('or_number', cleaned);
                setClientErrors((prev)=>({ ...prev, or_number: validateOrNumber(cleaned) }));
              }}
              disabled={!canSubmit || processing}
              maxLength={50}
              required
              aria-invalid={!!clientErrors.or_number || !!errors.or_number}
            />
            {errors.or_number && <p className="mt-1 text-xs text-red-600">{errors.or_number}</p>}
            {!errors.or_number && clientErrors.or_number && <p className="mt-1 text-xs text-red-600">{clientErrors.or_number}</p>}
            {!errors.or_number && !clientErrors.or_number && orUniqueChecking && (
              <p className="mt-1 text-xs text-muted-foreground">Checking OR number…</p>
            )}
          </div>

          {/* Amount Paid */}
          <div>
            <Label className="text-sm">Amount Paid</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 h-9"
              value={data.amount_paid ?? ''} // keep controlled; empty when null
              placeholder="e.g. 100.00"
              inputMode="decimal"
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = raw === '' ? null : Number.parseFloat(raw);
                setData('amount_paid', Number.isFinite(parsed as number) ? (parsed as number) : null);
                setClientErrors((prev)=>({ ...prev, amount_paid: validateAmount(Number.isFinite(parsed as number) ? (parsed as number) : null) }));
              }}
              disabled={!canSubmit || processing}
              required
              aria-invalid={!!clientErrors.amount_paid || !!errors.amount_paid}
            />
            {errors.amount_paid && <p className="mt-1 text-xs text-red-600">{errors.amount_paid}</p>}
            {!errors.amount_paid && clientErrors.amount_paid && <p className="mt-1 text-xs text-red-600">{clientErrors.amount_paid}</p>}
          </div>

          {/* Payment Date (shadcn calendar) */}
          <div>
            <Label className="text-sm">Payment date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}> {/* CHANGED */}
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  disabled={!canSubmit || processing}
                  className={`mt-1 h-9 w-full justify-start text-left font-normal ${!uiDate ? 'text-muted-foreground' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {uiDate ? format(uiDate, 'MM/dd/yyyy') : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="z-[1001] w-auto p-0 pointer-events-auto"  // RAISE Z-INDEX + allow clicks
                align="start"
                side="bottom"
              >
                <Calendar
                  mode="single"
                  selected={uiDate}
                  onSelect={(d) => {
                    if (d) setUiDate(d);
                    setDateOpen(false); // CLOSE after picking
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.payment_date && <p className="mt-1 text-xs text-red-600">{errors.payment_date}</p>}
            {!errors.payment_date && clientErrors.payment_date && <p className="mt-1 text-xs text-red-600">{clientErrors.payment_date}</p>}
          </div>

          {/* Receipt image (attachment-style UI) */}
          <div className="md:col-span-2">
            <Label className="text-sm">Receipt image</Label>
            <div className="mt-1 mb-2 flex items-center gap-2">
              <Input
                readOnly
                value={fileName || ''}
                placeholder="No file chosen"
                className="flex-1 h-9"
              />
              <Button
                variant="outline"
                type="button"
                onClick={handleChooseFile}
                disabled={!canSubmit || processing}
                className="h-9"
              >
                <Paperclip className="mr-1 h-4 w-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                name="receipt_image"
                className="hidden"
                onChange={handleFileChange}
                // Required if no existing receipt and nothing selected
                required={!payment?.receipt_image}
              />
            </div>
            {errors.receipt_image && <p className="mt-1 text-xs text-red-600">{errors.receipt_image}</p>}
            {!errors.receipt_image && clientErrors.receipt_image && <p className="mt-1 text-xs text-red-600">{clientErrors.receipt_image}</p>}

            {/* Preview or existing image link; reduced preview height */}
            {previewUrl ? (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="h-36 w-auto rounded-md border border-slate-200 dark:border-slate-700 object-contain bg-white"
                />
              </div>
            ) : payment?.receipt_image ? (
              <div className="mt-2 text-sm">
                <a
                  className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
                  href={`/storage/${payment.receipt_image}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ImageIcon className="h-4 w-4" />
                  View current receipt
                </a>
              </div>
            ) : null}
          </div>

          <Separator className="md:col-span-2" />

          {/* Actions */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button type="submit" className="bg-rose-500 h-9" disabled={!canSubmit || processing || !isFormValid}>
              {processing ? 'Submitting…' : payment ? 'Update Payment' : 'Submit Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}