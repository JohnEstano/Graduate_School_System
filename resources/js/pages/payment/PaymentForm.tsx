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
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dateOpen, setDateOpen] = useState(false); // NEW: control popover open state

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

  // Keep data.payment_date in sync (yyyy-MM-dd) whenever UI date changes
  useEffect(() => {
    if (uiDate) {
      setData('payment_date', format(uiDate, 'yyyy-MM-dd'));
    } else {
      setData('payment_date', '');
    }
  }, [uiDate]);

  useEffect(() => {
    // set default shown filename from existing receipt if any
    if (!fileName && payment?.receipt_image) {
      const base = payment.receipt_image.split('/').pop() || payment.receipt_image;
      setFileName(base);
    }
  }, [payment?.receipt_image, fileName]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0] ?? null;
    setData('receipt_image', file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) {
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setFileName('');
      setPreviewUrl(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    post(route('payment.store'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setPreviewUrl(null);
        setFileName('');
        reset('receipt_image');
        onSuccess?.();
      },
    });
  }

  return (
    <div className="rounded-lg bg-white">
      {/* Reduced header height */}
      <div className="py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="font-semibold text-lg">Payment Form</h2>
        <p className="text-xs text-muted-foreground">Submit your official receipt for verification.</p>
      </div>

      {/* Reduced body padding */}
      <div className="p-2">
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
              pattern="^[A-Z0-9-]+$"
              title="Use only capital letters, numbers, and dashes"
              onChange={(e) => {
                // Allow only A-Z, 0-9, and dash; auto-uppercase
                const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                setData('or_number', cleaned);
              }}
              disabled={!canSubmit || processing}
              maxLength={50}
              required
            />
            {errors.or_number && <p className="mt-1 text-xs text-red-600">{errors.or_number}</p>}
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
              }}
              disabled={!canSubmit || processing}
              required
            />
            {errors.amount_paid && <p className="mt-1 text-xs text-red-600">{errors.amount_paid}</p>}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreviewUrl(null);
                setFileName('');
                reset();
                setUiDate(initialDate);
              }}
              disabled={processing}
              className="h-9"
            >
              Clear
            </Button>
            <Button type="submit" className="bg-rose-500 h-9" disabled={!canSubmit || processing}>
              {processing ? 'Submitting…' : payment ? 'Update Payment' : 'Submit Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}