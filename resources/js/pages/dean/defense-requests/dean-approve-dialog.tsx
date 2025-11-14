import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { 
  Eye, 
  Signature, 
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  Send,
  Upload,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface DeanApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any;
  deanId?: number;
  deanName?: string;
  onApproveComplete?: () => void;
}

type ApprovalTab = 'preview' | 'signature' | 'upload';

export default function DeanApproveDialog({
  open,
  onOpenChange,
  defenseRequest,
  deanId,
  deanName = 'Dean',
  onApproveComplete
}: DeanApproveDialogProps) {
  const [currentTab, setCurrentTab] = useState<ApprovalTab>('preview');
  const [endorsementPdfUrl, setEndorsementPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Signature states
  const [signatures, setSignatures] = useState<any[]>([]);
  const [activeSignature, setActiveSignature] = useState<any | null>(null);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [showDrawSignature, setShowDrawSignature] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const sigPad = useRef<SignatureCanvas>(null);

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Auto-load signatures and generate preview when dialog opens
  useEffect(() => {
    if (open) {
      loadSignatures();
      if (!endorsementPdfUrl && !isGenerating) {
        generatePreview();
      }
    } else {
      // Reset state when dialog closes
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      setEndorsementPdfUrl(null);
      setCurrentTab('preview');
      setUploadedFile(null);
    }
  }, [open]);

  async function loadSignatures() {
    setLoadingSignatures(true);
    try {
      const res = await fetch('/api/signatures');
      if (res.ok) {
        const sigs = await res.json();
        setSignatures(sigs);
        const active = sigs.find((s: any) => s.active);
        setActiveSignature(active || null);
      }
    } catch (err) {
      console.error('Failed to load signatures:', err);
    } finally {
      setLoadingSignatures(false);
    }
  }

  async function generatePreview() {
    if (!defenseRequest?.id) {
      toast.error('Invalid defense request');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🎨 Generating dean document...');
      
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

      const response = await fetch('/api/generate-endorsement-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify({
          defense_request_id: defenseRequest.id,
          role: 'dean'
        }),
      });

      if (!response.ok) {
        toast.error('Failed to generate document');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      
      setEndorsementPdfUrl(url);
      toast.success('Document generated');
      console.log('✅ Document generated successfully');
      
    } catch (err) {
      console.error('❌ Generation error:', err);
      toast.error('Error generating document');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    toast.success('File selected. Click "Use This File" to continue.');
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    toast.success('File selected. Click "Use This File" to continue.');
  }

  async function handleUseUploadedFile() {
    if (!uploadedFile) {
      toast.error('No file selected');
      return;
    }

    if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(endorsementPdfUrl);
    }

    const url = URL.createObjectURL(uploadedFile);
    setEndorsementPdfUrl(url);
    setCurrentTab('preview');
    toast.success('Uploaded file ready for preview');
  }

  async function handleSaveDrawnSignature() {
    if (!sigPad.current) return;
    
    const canvas = sigPad.current.getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    
    setIsSavingSignature(true);
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ 
          image_base64: dataUrl,
          natural_width: canvas.width,
          natural_height: canvas.height
        }),
      });
      if (res.ok) {
        toast.success('Signature saved');
        await loadSignatures();
        setShowDrawSignature(false);
      } else {
        toast.error('Failed to save signature');
      }
    } catch (err) {
      toast.error('Error saving signature');
    } finally {
      setIsSavingSignature(false);
    }
  }

  async function handleActivateSignature(sigId: number) {
    try {
      const res = await fetch(`/api/signatures/${sigId}/activate`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      if (res.ok) {
        await loadSignatures();
        toast.success('Signature activated');
      }
    } catch (err) {
      toast.error('Error activating signature');
    }
  }

  function handleApproveClick() {
    if (!endorsementPdfUrl && !uploadedFile) {
      toast.error('Please generate or upload a document first');
      return;
    }

    if (!activeSignature) {
      toast.error('Please select or draw your signature first');
      return;
    }

    handleFinalApprove();
  }

  async function handleFinalApprove() {
    if (!endorsementPdfUrl) {
      toast.error('No document available');
      return;
    }

    if (!activeSignature) {
      toast.error('Please select or draw your signature first');
      return;
    }

    setIsApproving(true);
    
    try {
      console.log('🚀 Starting dean approval...');

      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

      const formData = new FormData();
      formData.append('_token', csrfToken || '');

      // Attach the PDF file
      if (uploadedFile) {
        formData.append('endorsement_form', uploadedFile);
      } else if (endorsementPdfUrl) {
        const response = await fetch(endorsementPdfUrl);
        const blob = await response.blob();
        formData.append('endorsement_form', blob, 'dean-endorsement.pdf');
      }

      const payload = {
        dean_status: 'Approved'
      };

      const response = await fetch(`/dean/defense-requests/${defenseRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error('Failed to approve defense request');
        return;
      }

      console.log('✅ Dean approval successful');
      toast.success('Defense request approved successfully!');
      
      onOpenChange(false);
      
      if (onApproveComplete) {
        onApproveComplete();
      } else {
        router.reload();
      }
      
    } catch (err) {
      console.error('❌ Approval error:', err);
      toast.error('Error approving defense request');
    } finally {
      setIsApproving(false);
    }
  }

  function drawGuideLine() {
    if (sigPad.current) {
      const canvas = sigPad.current.getCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const margin = 40;
        const y = canvas.height - 80;
        ctx.save();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(canvas.width - margin, y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] w-full max-w-5xl flex-col p-0 gap-0 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0">
            <div className="p-6 pb-4 shrink-0">
              <DialogHeader>
                <DialogTitle className="text-lg">Approve Defense Request</DialogTitle>
                <DialogDescription className="text-xs mt-2">
                  Review and approve with your signature
                </DialogDescription>
              </DialogHeader>
            </div>

            <Separator />

            {/* Scrollable middle section */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-4 space-y-6">
                <nav className="space-y-1">
                  <Button
                    variant={currentTab === 'preview' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('preview')}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Document
                  </Button>

                  <Button
                    variant={currentTab === 'signature' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('signature')}
                  >
                    <Signature className="mr-2 h-4 w-4" />
                    My Signature
                  </Button>

                  <Button
                    variant={currentTab === 'upload' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentTab('upload')}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </nav>
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer with Approve Button */}
            <div className="p-6 pt-4 shrink-0">
              <Button
                className="w-full"
                size="lg"
                disabled={!endorsementPdfUrl && !uploadedFile || !activeSignature || isApproving}
                onClick={handleApproveClick}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Approve & Sign
                  </>
                )}
              </Button>
              
              {!activeSignature && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Please set an active signature first
                </p>
              )}
              {(!endorsementPdfUrl && !uploadedFile) && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Generate or upload a document
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-8 max-w-5xl mx-auto">
                {/* Loading State */}
                {isLoadingPdf && (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Loading Document...</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Please wait
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview Tab */}
                {!isLoadingPdf && currentTab === 'preview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Document Preview</h3>
                        <p className="text-sm text-muted-foreground">
                          Review before approving
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generatePreview}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {endorsementPdfUrl ? 'Regenerate' : 'Generate'}
                          </>
                        )}
                      </Button>
                    </div>

                    {endorsementPdfUrl ? (
                      <div className="border rounded-lg overflow-hidden" style={{ height: '700px' }}>
                        <iframe
                          src={endorsementPdfUrl}
                          className="w-full h-full"
                          title="Document Preview"
                        />
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Click "Generate" to create the document
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Signature Tab */}
                {currentTab === 'signature' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Your Signature</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your signatures
                      </p>
                    </div>

                    {/* Active Signature */}
                    {loadingSignatures ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeSignature ? (
                      <div className="border rounded-lg p-6 bg-muted/30">
                        <Label className="text-sm font-medium mb-3 block">Active Signature</Label>
                        <div className="flex items-center justify-center bg-white rounded p-6">
                          <img
                            src={`/storage/${activeSignature.image_path}`}
                            alt="Your signature"
                            className="max-h-32 object-contain"
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* All Signatures */}
                    {signatures.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">All Signatures</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {signatures.map((sig) => (
                            <div
                              key={sig.id}
                              className={`border rounded-lg p-3 cursor-pointer transition ${
                                sig.active ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleActivateSignature(sig.id)}
                            >
                              <img
                                src={`/storage/${sig.image_path}`}
                                alt="Signature"
                                className="w-full h-20 object-contain bg-white rounded"
                              />
                              {sig.active && (
                                <div className="mt-2 text-xs text-center text-primary font-medium">
                                  <Check className="w-3 h-3 inline mr-1" />
                                  Active
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draw New Signature */}
                    <div className="border-t pt-6">
                      <Label className="text-sm font-medium mb-3 block">Draw New Signature</Label>
                      {!showDrawSignature ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setShowDrawSignature(true);
                            setTimeout(drawGuideLine, 100);
                          }}
                        >
                          <Signature className="w-4 h-4 mr-2" />
                          Draw Signature
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="border rounded bg-white">
                            <SignatureCanvas
                              ref={sigPad}
                              canvasProps={{
                                width: 690,
                                height: 300,
                                className: 'w-full h-full rounded',
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                sigPad.current?.clear();
                                drawGuideLine();
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Clear
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={handleSaveDrawnSignature}
                              disabled={isSavingSignature}
                            >
                              {isSavingSignature ? 'Saving...' : 'Save Signature'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Tab */}
                {currentTab === 'upload' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a pre-signed PDF if needed
                      </p>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-2">
                        Drag and drop your PDF here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Maximum file size: 10MB
                      </p>
                      <input
                        ref={uploadInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleUploadFile}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => uploadInputRef.current?.click()}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Select PDF File
                      </Button>
                    </div>

                    {/* Uploaded File Info */}
                    {uploadedFile && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleUseUploadedFile}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Use This File
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
