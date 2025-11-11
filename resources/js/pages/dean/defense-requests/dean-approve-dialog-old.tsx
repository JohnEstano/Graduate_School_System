interface DeanApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any;
  deanId?: number;
  deanName?: string;
  onApproveComplete?: () => void;
}

type ApprovalTab = 'preview' | 'signature' | 'upload';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { Pencil, Upload, FileText, X, Check, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';

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

  // Form fields for dean
  const [deanFullName, setDeanFullName] = useState('');
  const [deanTitle, setDeanTitle] = useState('');

  // Email confirmation dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState(true); // Default to true - emails are important!

  // ✨ NEW: Coordinator delegation toggle
  const [useCoordinatorSignature, setUseCoordinatorSignature] = useState(false);
  const [coordinatorFullName, setCoordinatorFullName] = useState('');
  const [coordinatorTitle, setCoordinatorTitle] = useState('');

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
      setUseCoordinatorSignature(false);
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
      console.log('🎨 Generating dean preview document...');
      
      // Get CSRF token
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

      const formData = new FormData();
      formData.append('_token', csrfToken || '');
      formData.append('defense_request_id', String(defenseRequest.id));
      formData.append('for_dean_preview', 'true'); // Flag to indicate this is for dean preview only

      const response = await fetch('/dean/defense-requests/generate-preview', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Preview generation failed:', errorText);
        toast.error('Failed to generate preview document');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      
      setEndorsementPdfUrl(url);
      toast.success('Preview document generated');
      console.log('✅ Preview generated successfully');
      
    } catch (err) {
      console.error('❌ Preview generation error:', err);
      toast.error('Error generating preview');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateDocument() {
    if (!defenseRequest?.id) {
      toast.error('Invalid defense request');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('📄 Generating final endorsement document...');
      console.log('   Use coordinator signature?', useCoordinatorSignature);
      
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

      const formData = new FormData();
      formData.append('_token', csrfToken || '');
      formData.append('defense_request_id', String(defenseRequest.id));
      
      // ✨ Pass delegation flag
      if (useCoordinatorSignature) {
        formData.append('use_coordinator_signature', 'true');
        if (coordinatorFullName) formData.append('coordinator_full_name', coordinatorFullName);
        if (coordinatorTitle) formData.append('coordinator_title', coordinatorTitle);
      } else {
        if (deanFullName) formData.append('dean_full_name', deanFullName);
        if (deanTitle) formData.append('dean_title', deanTitle);
      }

      const response = await fetch('/dean/defense-requests/generate-document', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Document generation failed:', errorText);
        toast.error('Failed to generate document');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      
      setEndorsementPdfUrl(url);
      setCurrentTab('preview');
      toast.success('Document generated successfully');
      console.log('✅ Document generated successfully');
      
    } catch (err) {
      console.error('❌ Document generation error:', err);
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

    // Revoke old URL if exists
    if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(endorsementPdfUrl);
    }

    // Create blob URL for preview
    const url = URL.createObjectURL(uploadedFile);
    setEndorsementPdfUrl(url);
    setCurrentTab('preview');
    toast.success('Uploaded file ready for preview');
  }

  async function handleSaveDrawnSignature() {
    if (!sigPad.current) return;
    
    const canvas = sigPad.current.getCanvas();
    
    // Create a new canvas with transparent background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
    }
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    setIsSavingSignature(true);
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ image_base64: dataUrl }),
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
        method: 'POST',
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
    console.log('🔘 Dean approve button clicked - showing email dialog');
    
    // Validate first
    if (!endorsementPdfUrl && !uploadedFile) {
      toast.error('Please generate or upload an endorsement document first');
      return;
    }

    // If NOT using coordinator signature, dean must have an active signature
    if (!useCoordinatorSignature && !activeSignature) {
      toast.error('Please select or draw your signature first');
      return;
    }

    // Show email confirmation dialog
    console.log('✅ Validation passed - opening email confirmation dialog');
    setShowEmailDialog(true);
  }

  async function handleFinalApprove() {
    if (!endorsementPdfUrl) {
      toast.error('No endorsement document available');
      return;
    }

    // If NOT delegating, dean needs signature
    if (!useCoordinatorSignature && !activeSignature) {
      toast.error('Please select or draw your signature first');
      return;
    }

    setIsApproving(true);
    setShowEmailDialog(false);
    
    try {
      console.log('🚀 Starting dean approval process...');
      console.log('   Delegation mode:', useCoordinatorSignature);
      console.log('   Send emails:', sendEmail);

      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

      const formData = new FormData();
      formData.append('_token', csrfToken || '');
      formData.append('defense_request_id', String(defenseRequest.id));
      formData.append('send_email', sendEmail ? 'true' : 'false');
      
      // ✨ Include delegation information
      if (useCoordinatorSignature) {
        formData.append('use_coordinator_signature', 'true');
        if (coordinatorFullName) formData.append('coordinator_full_name', coordinatorFullName);
        if (coordinatorTitle) formData.append('coordinator_title', coordinatorTitle);
      } else {
        if (deanFullName) formData.append('dean_full_name', deanFullName);
        if (deanTitle) formData.append('dean_title', deanTitle);
      }

      // Attach the PDF file
      if (uploadedFile) {
        formData.append('endorsement_file', uploadedFile);
      } else if (endorsementPdfUrl) {
        const response = await fetch(endorsementPdfUrl);
        const blob = await response.blob();
        const file = new File([blob], 'endorsement.pdf', { type: 'application/pdf' });
        formData.append('endorsement_file', file);
      }

      const response = await fetch(`/dean/defense-requests/${defenseRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || 'Failed to approve defense request';
        console.error('❌ Approval failed:', errorMessage);
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      console.log('✅ Dean approval successful:', data);

      toast.success(sendEmail 
        ? 'Defense request approved! Notification emails sent.' 
        : 'Defense request approved successfully!');
      
      onOpenChange(false);
      
      // Refresh the page or call callback
      if (onApproveComplete) {
        onApproveComplete();
      } else {
        // Refresh to show updated status
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
        const y = canvas.height * 0.7;
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dean Approval - Endorsement Document</DialogTitle>
            <DialogDescription>
              {useCoordinatorSignature 
                ? 'Review and approve this defense request with coordinator signature on your behalf'
                : 'Review and approve this defense request with your signature'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as ApprovalTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                <FileText className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="signature">
                <Pencil className="w-4 h-4 mr-2" />
                Signature
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="space-y-4">
              {/* ✨ DELEGATION TOGGLE */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <Label htmlFor="delegation-toggle" className="text-sm font-semibold">
                    Use Coordinator Signature on Behalf
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow the assigned coordinator to sign this document on your behalf
                  </p>
                </div>
                <Switch
                  id="delegation-toggle"
                  checked={useCoordinatorSignature}
                  onCheckedChange={setUseCoordinatorSignature}
                />
              </div>

              {useCoordinatorSignature && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      Coordinator Delegation Mode
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Coordinator Full Name</Label>
                      <Input
                        value={coordinatorFullName}
                        onChange={(e) => setCoordinatorFullName(e.target.value)}
                        placeholder="e.g., Dr. Maria Santos"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Coordinator Title</Label>
                      <Input
                        value={coordinatorTitle}
                        onChange={(e) => setCoordinatorTitle(e.target.value)}
                        placeholder="e.g., Program Coordinator"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The document will be signed with the coordinator's signature and include a note that they signed on behalf of the Dean.
                  </p>
                </div>
              )}

              {!useCoordinatorSignature && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Dean Full Name</Label>
                    <Input
                      value={deanFullName}
                      onChange={(e) => setDeanFullName(e.target.value)}
                      placeholder="e.g., Dr. John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Dean Title</Label>
                    <Input
                      value={deanTitle}
                      onChange={(e) => setDeanTitle(e.target.value)}
                      placeholder="e.g., Dean, Graduate School"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-2 bg-muted/30">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating document...</p>
                    </div>
                  </div>
                ) : endorsementPdfUrl ? (
                  <iframe
                    src={endorsementPdfUrl}
                    className="w-full h-[500px] rounded border"
                    title="Endorsement Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No document preview available</p>
                      <Button onClick={generatePreview} className="mt-3" size="sm">
                        Generate Preview
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Regenerate Document'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApproveClick} disabled={isApproving || !endorsementPdfUrl}>
                    {isApproving ? 'Approving...' : 'Approve & Sign'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* SIGNATURE TAB */}
            <TabsContent value="signature" className="space-y-4">
              {useCoordinatorSignature ? (
                <div className="p-8 border rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                  <Badge variant="outline" className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                    Coordinator Delegation Mode Active
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-2">
                    Coordinator signature management is not required when using delegation mode.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The assigned coordinator will use their own signature to sign on your behalf.
                  </p>
                </div>
              ) : (
                <>
                  {loadingSignatures ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {signatures.length > 0 && (
                        <div className="space-y-2">
                          <Label>Your Signatures</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {signatures.map((sig) => (
                              <div
                                key={sig.id}
                                className={`border rounded-lg p-3 cursor-pointer transition ${
                                  sig.active ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                                }`}
                                onClick={() => handleActivateSignature(sig.id)}
                              >
                                <img
                                  src={`/storage/${sig.image_path}`}
                                  alt="Signature"
                                  className="w-full h-20 object-contain bg-white rounded"
                                />
                                {sig.active && (
                                  <Badge className="mt-2 w-full justify-center">
                                    <Check className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Label>Draw New Signature</Label>
                        <div className="mt-2 border rounded-lg p-4 bg-muted/30">
                          {!showDrawSignature ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setShowDrawSignature(true);
                                setTimeout(drawGuideLine, 100);
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Draw Signature
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="border rounded bg-white">
                                <SignatureCanvas
                                  ref={sigPad}
                                  canvasProps={{
                                    className: 'w-full h-40 rounded',
                                  }}
                                  onEnd={drawGuideLine}
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowDrawSignature(false)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* UPLOAD TAB */}
            <TabsContent value="upload" className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Drag and drop a signed PDF file here, or click to browse
                </p>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadFile}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUseUploadedFile}>
                      Use This File
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification Emails?</DialogTitle>
            <DialogDescription>
              Would you like to send email notifications to the student, adviser, and panel members?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Switch
              id="send-emails"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
            <Label htmlFor="send-emails" className="text-sm">
              Send email notifications to all parties
            </Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFinalApprove} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Confirm Approval'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
