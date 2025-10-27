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

interface CoordinatorApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any;
  coordinatorId?: number;
  coordinatorName?: string;
  onApproveComplete?: () => void;
}

type ApprovalTab = 'preview' | 'signature' | 'upload';

export default function CoordinatorApproveDialog({
  open,
  onOpenChange,
  defenseRequest,
  coordinatorId,
  coordinatorName = 'Coordinator',
  onApproveComplete
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

  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Email confirmation dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  function csrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
  }

  // Load existing endorsement form when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
      loadEndorsementForm();
      loadSignatures();
      // Set default coordinator name
      setCoordinatorFullName(coordinatorName || '');
      setCoordinatorTitle('Program Coordinator');
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

  async function loadTemplates() {
    try {
      const res = await fetch('/api/document-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        
        // Auto-select template based on defense type
        const defenseType = defenseRequest?.defense_type?.toLowerCase() || '';
        const matchingTemplate = data.find((t: any) => {
          const name = t.name.toLowerCase();
          if (defenseType.includes('prefinal') || defenseType.includes('pre-final')) {
            return name.includes('prefinal') || name.includes('pre-final');
          }
          if (defenseType.includes('final')) {
            return name.includes('final') && !name.includes('prefinal');
          }
          return false;
        });
        
        if (matchingTemplate) {
          setSelectedTemplate(matchingTemplate);
        } else if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }

  async function loadEndorsementForm() {
    // Check both possible locations for endorsement_form
    const endorsementForm = defenseRequest?.attachments?.endorsement_form || defenseRequest?.endorsement_form;
    
    if (!endorsementForm) {
      toast.error('No endorsement form found. The adviser must submit the endorsement first.');
      return;
    }

    setIsLoadingPdf(true);
    try {
      // Load the existing endorsement form from storage
      const endorsementPath = endorsementForm.startsWith('/storage/') 
        ? endorsementForm 
        : `/storage/${endorsementForm}`;
      
      console.log('📄 Loading endorsement form from:', endorsementPath);
      
      const response = await fetch(endorsementPath);
      if (!response.ok) {
        throw new Error('Failed to load endorsement form');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setEndorsementPdfUrl(url);
      
      console.log('✅ Endorsement form loaded successfully');
      toast.success('Endorsement form loaded successfully!');
    } catch (err) {
      console.error('❌ Failed to load endorsement form:', err);
      toast.error('Failed to load endorsement form');
    } finally {
      setIsLoadingPdf(false);
    }
  }

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
    if (!selectedTemplate) {
      toast.error('No template selected');
      return;
    }

    if (!defenseRequest?.id) {
      toast.error('Invalid defense request');
      return;
    }

    if (!coordinatorFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
          'X-CSRF-TOKEN': csrf()
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          defense_request_id: defenseRequest.id,
          fields: {
            'coordinator.full_name': coordinatorFullName,
            'coordinator.title': coordinatorTitle
          },
          role: 'coordinator' // Specify coordinator role
        })
      });

      if (!res.ok) {
        toast.error('Failed to generate document');
        setIsGenerating(false);
        return;
      }

      // Get the PDF as a blob
      const blob = await res.blob();
      
      // Revoke old URL if exists
      if (endorsementPdfUrl && endorsementPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(endorsementPdfUrl);
      }
      
      // Create a URL for the blob to use in iframe
      const url = URL.createObjectURL(blob);
      setEndorsementPdfUrl(url);
      
      toast.success('Endorsement form generated successfully with coordinator info!');
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate endorsement form');
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
      // Don't fill background - keep it transparent
      tempCtx.drawImage(canvas, 0, 0);
    }
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    setIsSavingSignature(true);
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf()
        },
        body: JSON.stringify({
          image_base64: dataUrl,
          label: 'Drawn Signature',
          natural_width: canvas.width,
          natural_height: canvas.height
        })
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
      const res = await fetch(`/api/signatures/${sigId}/activate`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-TOKEN': csrf()
        }
      });

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

    if (!coordinatorFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    // Show email confirmation dialog
    setShowEmailDialog(true);
  }

  async function handleFinalApprove() {
    setIsApproving(true);
    setShowEmailDialog(false);
    try {
      console.log('🚀 Starting coordinator approval process...');
      
      // Prepare the form data
      const formData = new FormData();
      
      // If uploaded file exists, use it. Otherwise use the generated/loaded one
      if (uploadedFile) {
        formData.append('endorsement_form', uploadedFile, 'coordinator-signed-endorsement.pdf');
      } else if (endorsementPdfUrl) {
        const response = await fetch(endorsementPdfUrl);
        const blob = await response.blob();
        formData.append('endorsement_form', blob, 'endorsement-form-signed.pdf');
      }
      
      formData.append('add_coordinator_signature', 'true');
      formData.append('coordinator_full_name', coordinatorFullName);
      formData.append('coordinator_title', coordinatorTitle);
      
      console.log('📤 Uploading PDF with coordinator signature overlay...');
      
      const uploadRes = await fetch(`/api/defense-requests/${defenseRequest.id}/add-coordinator-signature`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf(),
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('❌ Failed to add coordinator signature:', errorText);
        toast.error('Failed to sign the endorsement form');
        setIsApproving(false);
        return;
      }

      console.log('✅ Coordinator signature added successfully');

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
      const statusRes = await fetch(
        `/coordinator/defense-requirements/${defenseRequest.id}/coordinator-status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf()
          },
          body: JSON.stringify(payload)
        }
      );

      if (statusRes.ok) {
        const data = await statusRes.json();
        console.log('✅ Approval successful:', data);
        
        if (onApproveComplete) {
          await onApproveComplete();
        }
        
        onOpenChange(false);
        toast.success('Defense request approved successfully!');
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

                  <Separator />

                  {/* Coordinator Info Form */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Coordinator Information</Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Full Name *</Label>
                        <Input
                          value={coordinatorFullName}
                          onChange={(e) => setCoordinatorFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <Input
                          value={coordinatorTitle}
                          onChange={(e) => setCoordinatorTitle(e.target.value)}
                          placeholder="e.g., Program Coordinator"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Request Info */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-medium text-muted-foreground">Student</div>
                      <div className="font-semibold">
                        {defenseRequest?.first_name} {defenseRequest?.last_name}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Program</div>
                      <div className="font-semibold">{defenseRequest?.program}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Defense Type</div>
                      <div className="font-semibold">{defenseRequest?.defense_type}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Thesis Title</div>
                      <div className="font-semibold text-wrap">{defenseRequest?.thesis_title}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Info */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-medium text-muted-foreground">Adviser Status</div>
                      <div className="font-semibold text-green-600">
                        {defenseRequest?.adviser_status || 'Approved'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Your Action</div>
                      <div className="font-semibold text-amber-600">Pending Approval</div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <Separator />

              {/* Footer with Approve Button */}
              <div className="p-6 pt-4 shrink-0">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!endorsementPdfUrl && !uploadedFile || !activeSignature || isApproving || !coordinatorFullName.trim()}
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
                {!coordinatorFullName.trim() && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Enter your full name above
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
                          disabled={isGenerating || !coordinatorFullName.trim()}
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
                            {!coordinatorFullName.trim() 
                              ? 'Please enter your full name in the sidebar, then click Generate.'
                              : 'Click "Generate" to create the endorsement form with your information.'}
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

                      {/* All Signatures */}
                      <div className="border rounded-lg p-4 space-y-3">
                        <Label className="text-sm font-medium">All Signatures</Label>
                        {loadingSignatures ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : signatures.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {signatures.map((sig) => (
                              <div
                                key={sig.id}
                                className={`border rounded-lg p-3 space-y-2 ${
                                  sig.active ? 'ring-2 ring-primary' : ''
                                }`}
                              >
                                <div className="bg-muted/50 rounded p-2 flex items-center justify-center min-h-[60px]">
                                  <img
                                    src={`/storage/${sig.image_path}`}
                                    alt="Signature"
                                    className="max-h-12 object-contain"
                                  />
                                </div>
                                <Button
                                  variant={sig.active ? 'secondary' : 'outline'}
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleActivateSignature(sig.id)}
                                  disabled={sig.active}
                                >
                                  {sig.active ? 'Active' : 'Set Active'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              No signatures found. Draw one to get started.
                            </AlertDescription>
                          </Alert>
                        )}
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
