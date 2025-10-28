import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import SignatureCanvas from 'react-signature-canvas';
import { 
  Eye, 
  Signature, 
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Send,
  Upload,
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

import { fetchWithCsrf, postWithCsrf, patchWithCsrf, postFormWithCsrf } from '@/utils/csrf';

interface CoordinatorApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any;
  coordinatorId?: number;
  coordinatorName?: string;
  onApproveComplete?: () => void;
  panelsData?: {
    defense_chairperson: string;
    defense_panelist1: string;
    defense_panelist2: string;
    defense_panelist3: string;
    defense_panelist4: string;
  };
  scheduleData?: {
    scheduled_date: string;
    scheduled_time: string;
    scheduled_end_time: string;
    defense_mode: string;
    defense_venue: string;
    scheduling_notes: string;
  };
}

type ApprovalTab = 'preview' | 'signature' | 'upload';

export default function CoordinatorApproveDialog({
  open,
  onOpenChange,
  defenseRequest,
  coordinatorId,
  coordinatorName = 'Coordinator',
  onApproveComplete,
  panelsData,
  scheduleData
}: CoordinatorApproveDialogProps) {
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

  // Form fields for coordinator
  const [coordinatorFullName, setCoordinatorFullName] = useState('');
  const [coordinatorTitle, setCoordinatorTitle] = useState('');

  // Email confirmation dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  // Auto-generate document with coordinator signature when dialog opens (like adviser workflow)
  useEffect(() => {
    if (open) {
      loadSignatures();
      // Auto-generate the endorsement form with coordinator signature
      if (!endorsementPdfUrl && !isGenerating) {
        handleGenerateDocument();
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
        const data = await res.json();
        setSignatures(data);
        const active = data.find((s: any) => s.active);
        setActiveSignature(active || null);
      }
    } catch (err) {
      console.error('Failed to load signatures:', err);
    } finally {
      setLoadingSignatures(false);
    }
  }

  async function handleGenerateDocument() {
    if (!defenseRequest?.id) {
      toast.error('Invalid defense request');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🚀 Generating coordinator-signed endorsement PDF for request:', defenseRequest.id);
      console.log('📋 Defense type:', defenseRequest.defense_type);
      
      // Generate new PDF with coordinator signature using centralized CSRF utility
      const res = await postWithCsrf('/api/generate-endorsement-pdf', {
        defense_request_id: defenseRequest.id,
        role: 'coordinator'
      });

      console.log('📥 Response status:', res.status, res.statusText);
      console.log('📥 Response content-type:', res.headers.get('content-type'));

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = 'Failed to generate endorsement form';
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          console.error('❌ Error response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const errorText = await res.text();
          console.error('❌ Error response (text):', errorText);
        }
        
        toast.error(errorMessage);
        setIsGenerating(false);
        return;
      }

      // Get the PDF as a blob
      const blob = await res.blob();
      console.log('📦 PDF blob created:', blob.size, 'bytes, type:', blob.type);
      
      // Revoke old URL if exists
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(endorsementPdfUrl);
      }
      
      // Create a URL for the blob to use in iframe
      const url = window.URL.createObjectURL(blob);
      setEndorsementPdfUrl(url);
      setCurrentTab('preview');
      
      console.log('✅ PDF generated successfully with coordinator signature');
      toast.success('Endorsement form generated with your signature! Review and click "Approve" to submit.');
    } catch (err) {
      console.error('💥 Generate error:', err);
      toast.error('Failed to generate endorsement form: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
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
      // Don't fill background - keep it transparent
      tempCtx.drawImage(canvas, 0, 0);
    }
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    setIsSavingSignature(true);
    try {
      const res = await postWithCsrf('/api/signatures', {
        image_base64: dataUrl,
        label: 'Drawn Signature',
        natural_width: canvas.width,
        natural_height: canvas.height
      });

      if (res.ok) {
        toast.success('Signature saved successfully!');
        setShowDrawSignature(false);
        loadSignatures();
      } else {
        toast.error('Failed to save signature');
      }
    } catch (err) {
      console.error('Save signature error:', err);
      toast.error('Failed to save signature');
    } finally {
      setIsSavingSignature(false);
    }
  }

  async function handleActivateSignature(sigId: number) {
    try {
      const res = await patchWithCsrf(`/api/signatures/${sigId}/activate`, {});

      if (res.ok) {
        toast.success('Signature activated!');
        loadSignatures();
      } else {
        toast.error('Failed to activate signature');
      }
    } catch (err) {
      console.error('Activate signature error:', err);
      toast.error('Failed to activate signature');
    }
  }

  function handleApproveClick() {
    // Validate first
    if (!endorsementPdfUrl && !uploadedFile) {
      toast.error('Please generate or upload an endorsement form first');
      return;
    }

    if (!activeSignature) {
      toast.error('Please set an active signature first');
      return;
    }

    // Show email confirmation dialog
    setShowEmailDialog(true);
  }

  async function handleFinalApprove() {
    if (!endorsementPdfUrl) {
      toast.error('Please wait for the endorsement form to generate');
      return;
    }

    if (!activeSignature) {
      toast.error('Please set an active signature first');
      return;
    }

    setIsApproving(true);
    setShowEmailDialog(false);
    
    try {
      console.log('🚀 Starting coordinator approval process...');
      
      // STEP 1: Save panels and schedule first
      if (panelsData) {
        console.log('💾 Saving panel assignments...', panelsData);
        const panelsRes = await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/panels`, panelsData);

        if (!panelsRes.ok) {
          const errorText = await panelsRes.text();
          console.error('❌ Failed to save panels:', errorText);
          toast.error('Failed to save panel assignments');
          setIsApproving(false);
          return;
        }
        console.log('✅ Panels saved successfully');
      }

      if (scheduleData) {
        console.log('💾 Saving schedule information...', scheduleData);
        const scheduleRes = await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/schedule`, scheduleData);

        if (!scheduleRes.ok) {
          const errorText = await scheduleRes.text();
          console.error('❌ Failed to save schedule:', errorText);
          toast.error('Failed to save schedule information');
          setIsApproving(false);
          return;
        }
        console.log('✅ Schedule saved successfully');
      }

      // STEP 2: Upload the generated PDF with coordinator signature (like adviser workflow)
      console.log('📤 Uploading coordinator-signed endorsement form...');
      
      let endorsementFormSaved = false;
      
      // Check if we have an uploaded file to save
      if (uploadedFile) {
        console.log('📤 Uploading user-selected file:', uploadedFile.name);
        
        const formData = new FormData();
        formData.append('endorsement_form', uploadedFile);

        const uploadRes = await postFormWithCsrf(
          `/api/defense-requests/${defenseRequest.id}/upload-endorsement`,
          formData
        );

        if (uploadRes.ok) {
          console.log('✅ User file uploaded successfully');
          endorsementFormSaved = true;
        } else {
          const errorText = await uploadRes.text();
          console.error('❌ Upload failed:', errorText);
          toast.error('Failed to save endorsement form');
          setIsApproving(false);
          return;
        }
      } else if (endorsementPdfUrl) {
        // Convert the generated blob to a file and upload
        console.log('📤 Uploading generated PDF blob...');
        
        try {
          const response = await fetch(endorsementPdfUrl);
          const blob = await response.blob();
          
          console.log('📦 Blob created:', blob.type, blob.size, 'bytes');
          
          const formData = new FormData();
          formData.append('endorsement_form', blob, 'coordinator-signed-endorsement.pdf');

          const uploadRes = await postFormWithCsrf(
            `/api/defense-requests/${defenseRequest.id}/upload-endorsement`,
            formData
          );

          if (uploadRes.ok) {
            console.log('✅ Generated PDF uploaded successfully');
            endorsementFormSaved = true;
          } else {
            const errorText = await uploadRes.text();
            console.error('❌ Upload failed:', errorText);
            toast.error('Failed to save endorsement form');
            setIsApproving(false);
            return;
          }
        } catch (err) {
          console.error('❌ Error uploading generated PDF:', err);
          toast.error('Failed to save endorsement form');
          setIsApproving(false);
          return;
        }
      }

      if (!endorsementFormSaved) {
        console.error('❌ No endorsement form was saved');
        toast.error('Failed to save endorsement form');
        setIsApproving(false);
        return;
      }

      console.log('✅ Endorsement form saved successfully, updating coordinator status...');

      // STEP 3: Update coordinator status to approved
      const payload: any = {
        coordinator_status: 'Approved'
      };

      if (coordinatorId) {
        payload.coordinator_user_id = coordinatorId;
      }

      // Add send_email flag to payload
      payload.send_email = sendEmail;

      console.log('📤 Updating coordinator status with payload:', payload);
      
      // Use centralized CSRF utility for status update
      const statusRes = await patchWithCsrf(
        `/coordinator/defense-requirements/${defenseRequest.id}/coordinator-status`,
        payload
      );

      if (statusRes.ok) {
        const data = await statusRes.json();
        console.log('✅ Approval successful:', data);
        
        toast.success('Defense request approved successfully! Your signature has been added to the endorsement form.');
        
        // Close dialog
        onOpenChange(false);
        
        // Force full page reload to show updated data
        if (onApproveComplete) {
          onApproveComplete();
        }
        
        // Additional fallback: force full page reload after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const error = await statusRes.json();
        console.error('❌ Status update failed:', error);
        toast.error(error.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error('❌ Approval error:', err);
      toast.error('Failed to approve defense request');
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[95vh] w-full max-w-5xl flex-col p-0 gap-0 overflow-hidden">
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-72 border-r bg-muted/30 flex flex-col shrink-0">
              <div className="p-6 pb-4 shrink-0">
                <DialogHeader>
                  <DialogTitle className="text-lg">Approve Defense Request</DialogTitle>
                  <DialogDescription className="text-xs mt-2">
                    Review the adviser's endorsement and add your signature
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
                    Generate or upload an endorsement form
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
                        <h3 className="text-lg font-semibold">Loading Endorsement Form...</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Please wait while we load the adviser's endorsement
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview Tab */}
                  {!isLoadingPdf && currentTab === 'preview' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Endorsement Form Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            Review the endorsement before approving
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateDocument}
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
                            title="Endorsement Form Preview"
                          />
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Click "Generate" to create the endorsement form with your signature.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Signature Tab */}
                  {currentTab === 'signature' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Manage Your Signature</h3>
                        <p className="text-sm text-muted-foreground">
                          Your signature will be added to the endorsement form
                        </p>
                      </div>

                      {/* Active Signature */}
                      {activeSignature && (
                        <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Active Signature</Label>
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center">
                            <img
                              src={`/storage/${activeSignature.image_path}`}
                              alt="Active signature"
                              className="max-h-24 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Draw New Signature */}
                      <div className="border rounded-lg p-4 space-y-3">
                        <Label className="text-sm font-medium">Draw New Signature</Label>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowDrawSignature(true)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Draw Signature
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload Tab */}
                  {currentTab === 'upload' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Upload Endorsement Form</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload a pre-signed PDF if generation doesn't work
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

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Note:</strong> The uploaded file should already contain the adviser's signature and endorsement. 
                          Your coordinator signature will be added on top of it.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email Notification?</DialogTitle>
            <DialogDescription>
              Would you like to send an email notification to the student about this approval?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendEmailCheck"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="sendEmailCheck" className="text-sm font-normal cursor-pointer">
                Send email notification to {defenseRequest?.first_name} {defenseRequest?.last_name}
              </Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Approval
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draw Signature Dialog */}
      <Dialog open={showDrawSignature} onOpenChange={setShowDrawSignature}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Draw Your Signature</DialogTitle>
            <DialogDescription>
              Draw your signature below. This will replace any existing signatures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <SignatureCanvas
                ref={sigPad}
                penColor="black"
                backgroundColor="rgba(0,0,0,0)"
                minWidth={2}
                maxWidth={4}
                velocityFilterWeight={0.7}
                canvasProps={{
                  width: 690,
                  height: 300,
                  className: 'border border-border rounded bg-background w-full',
                  style: { cursor: 'crosshair' }
                }}
                onEnd={drawGuideLine}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  sigPad.current?.clear();
                  drawGuideLine();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDrawSignature(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDrawnSignature}
                disabled={isSavingSignature}
              >
                {isSavingSignature ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Signature
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
