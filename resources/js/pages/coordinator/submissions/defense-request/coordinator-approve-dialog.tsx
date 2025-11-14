import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  FileText,
  Mail,
  Users,
  ShieldCheck
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

type ApprovalTab = 'preview' | 'upload';

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
  
  // Signature states - DEAN'S signatures (not coordinator's)
  const [signatures, setSignatures] = useState<any[]>([]);
  const [activeSignature, setActiveSignature] = useState<any | null>(null);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [showDrawSignature, setShowDrawSignature] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const sigPad = useRef<SignatureCanvas>(null);
  
  // Delegation status
  const [canSignOnBehalf, setCanSignOnBehalf] = useState(false);
  const [checkingDelegation, setCheckingDelegation] = useState(true);

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
  const [sendEmail, setSendEmail] = useState(true); // Default to true - emails are important!

  // Check delegation status and load dean's signatures
  useEffect(() => {
    if (open) {
      const initDialog = async () => {
        await checkDelegationStatus();
        await loadDeanSignatures();
      };
      initDialog();
    } else {
      // Reset state when dialog closes
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      setEndorsementPdfUrl(null);
      setCurrentTab('preview');
      setUploadedFile(null);
      setCheckingDelegation(true);
    }
  }, [open]);

  // Auto-generate document when dialog opens (regardless of delegation)
  useEffect(() => {
    if (open && !checkingDelegation && !endorsementPdfUrl && !isGenerating) {
      saveDataAndGeneratePreview();
    }
  }, [open, checkingDelegation]);

  async function checkDelegationStatus() {
    setCheckingDelegation(true);
    try {
      const res = await fetch('/api/coordinator/delegation-status');
      if (res.ok) {
        const data = await res.json();
        setCanSignOnBehalf(data.can_sign_on_behalf || false);
      }
    } catch (err) {
      console.error('Failed to check delegation status:', err);
      setCanSignOnBehalf(false);
    } finally {
      setCheckingDelegation(false);
    }
  }

  async function loadDeanSignatures() {
    setLoadingSignatures(true);
    try {
      // Fetch DEAN's signatures (not coordinator's)
      const res = await fetch('/api/dean-signatures');
      if (res.ok) {
        const data = await res.json();
        setSignatures(data);
        const active = data.find((s: any) => s.active);
        setActiveSignature(active || null);
      }
    } catch (err) {
      console.error('Failed to load dean signatures:', err);
    } finally {
      setLoadingSignatures(false);
    }
  }



  async function saveDataAndGeneratePreview() {
    if (!defenseRequest?.id) {
      toast.error('Invalid defense request');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('💾 Saving panels and schedule before generating preview...');
      console.log('📦 Panels to save:', panelsData);
      console.log('📅 Schedule to save:', scheduleData);
      
      // STEP 1: Save panels if provided
      if (panelsData) {
        console.log('💾 Saving panel assignments...');
        const panelsRes = await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/panels`, panelsData);
        
        if (!panelsRes.ok) {
          const errorText = await panelsRes.text();
          console.error('❌ Failed to save panels:', errorText);
          toast.error('Failed to save panel assignments');
          setIsGenerating(false);
          return;
        }
        console.log('✅ Panels saved successfully');
      }
      
      // STEP 2: Save schedule if provided
      if (scheduleData) {
        console.log('💾 Saving schedule information...');
        const scheduleRes = await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/schedule`, scheduleData);
        
        if (!scheduleRes.ok) {
          const errorText = await scheduleRes.text();
          console.error('❌ Failed to save schedule:', errorText);
          toast.error('Failed to save schedule information');
          setIsGenerating(false);
          return;
        }
        console.log('✅ Schedule saved successfully');
      }
      
      // STEP 3: Wait for database commit
      console.log('⏳ Waiting for database commit...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // STEP 4: Now generate the PDF with the updated data
      console.log('🔄 Generating PDF preview with assigned panels and schedule...');
      await handleGenerateDocument();
      
    } catch (err) {
      console.error('💥 Error saving data:', err);
      toast.error('Failed to save panel/schedule data');
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

  

  function handleApproveClick() {
    console.log('🔘 Approve button clicked');
    
    // If not delegated, send to dean directly
    if (!canSignOnBehalf) {
      handleSendToDean();
      return;
    }
    
    // Validate document for delegated approval
    if (!endorsementPdfUrl && !uploadedFile) {
      toast.error('Please generate or upload a document first');
      return;
    }

    // Validate dean's signature exists
    if (!activeSignature) {
      toast.error('Dean must set up signature first');
      return;
    }

    // Show email confirmation dialog
    console.log('✅ Validation passed - opening email confirmation dialog');
    setShowEmailDialog(true);
  }

  async function handleSendToDean() {
    setIsApproving(true);
    try {
      console.log('📤 Sending to Dean for approval...');
      
      // Save panels and schedule, then update status to "Pending Dean Approval"
      if (panelsData) {
        await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/panels`, panelsData);
      }
      if (scheduleData) {
        await postWithCsrf(`/coordinator/defense-requests/${defenseRequest.id}/schedule`, scheduleData);
      }
      
      const payload: any = {
        coordinator_status: 'Pending Dean Approval'
      };
      if (coordinatorId) {
        payload.coordinator_user_id = coordinatorId;
      }

      const statusRes = await patchWithCsrf(
        `/coordinator/defense-requirements/${defenseRequest.id}/coordinator-status`,
        payload
      );

      if (statusRes.ok) {
        toast.success('Sent to Dean for approval');
        onOpenChange(false);
        if (onApproveComplete) {
          onApproveComplete();
        }
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error('Failed to send to Dean');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      toast.error('Failed to send to Dean');
    } finally {
      setIsApproving(false);
    }
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
      console.log('📦 Defense Request ID:', defenseRequest.id);
      console.log('� Using existing PDF (panels/schedule already saved during preview generation)');
      
      // Panels and schedule were already saved when the dialog opened (in saveDataAndGeneratePreview)
      // The PDF preview already shows the correct data
      // So we just need to upload the PDF and update the status
      
      // STEP 1: Upload the generated PDF with coordinator signature
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

      // STEP 2: Update coordinator status to approved
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
                  <DialogTitle className="text-lg">
                    {checkingDelegation ? 'Checking...' : canSignOnBehalf ? 'Approve Defense Request' : 'Send to Dean'}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-2">
                    {checkingDelegation ? 'Checking authorization...' : canSignOnBehalf 
                      ? 'Review and approve with Dean\'s signature' 
                      : 'Review and send to Dean for final approval'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <Separator />

              {/* Scrollable middle section */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-6 py-4 space-y-6">
                  {/* Delegation Status Alert - Simplified */}
                  {checkingDelegation ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Checking...</span>
                    </div>
                  ) : !canSignOnBehalf ? (
                    <Alert className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        This will be sent to the Dean for approval
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="py-2">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        You can approve using Dean's signature
                      </AlertDescription>
                    </Alert>
                  )}
                  
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
                  disabled={checkingDelegation || isApproving || (canSignOnBehalf && !activeSignature)}
                  onClick={handleApproveClick}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : canSignOnBehalf ? (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Approve & Sign
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to Dean
                    </>
                  )}
                </Button>
                
                {canSignOnBehalf && !activeSignature && !checkingDelegation && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Dean must set up signature first
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
                      {endorsementPdfUrl && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateDocument}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Regenerate
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {endorsementPdfUrl ? (
                        <div className="border rounded-lg overflow-hidden" style={{ height: '700px' }}>
                          <iframe
                            src={endorsementPdfUrl}
                            className="w-full h-full"
                            title="Endorsement Form Preview"
                          />
                        </div>
                      ) : isGenerating ? (
                        <div className="flex items-center justify-center h-[600px]">
                          <div className="text-center space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-sm text-muted-foreground">Generating document...</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Signature Tab - Dean's Signature */}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email Notifications?
            </DialogTitle>
            <DialogDescription>
              Notify all parties about this defense approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sendEmailSwitch" className="text-sm font-medium cursor-pointer">
                    Send email to all parties
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Emails will be sent to student, adviser, and all panel members
                </p>
              </div>
              <Switch
                id="sendEmailSwitch"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
            </div>

            {/* Who will receive emails */}
            {sendEmail && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="font-medium mb-2">The following parties will receive email notifications:</div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Student: {defenseRequest?.first_name} {defenseRequest?.last_name}</li>
                    <li>Adviser: {defenseRequest?.defense_adviser || 'Not assigned'}</li>
                    <li>Defense Chairperson: {panelsData?.defense_chairperson || 'Not assigned'}</li>
                    {panelsData?.defense_panelist1 && <li>Panelist 1: {panelsData.defense_panelist1}</li>}
                    {panelsData?.defense_panelist2 && <li>Panelist 2: {panelsData.defense_panelist2}</li>}
                    {panelsData?.defense_panelist3 && <li>Panelist 3: {panelsData.defense_panelist3}</li>}
                    {panelsData?.defense_panelist4 && <li>Panelist 4: {panelsData.defense_panelist4}</li>}
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    Each email will include defense schedule, venue details, and panel assignments.
                  </p>
                </AlertDescription>
              </Alert>
            )}
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
                  {sendEmail ? 'Approve & Send Emails' : 'Approve Without Emails'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
