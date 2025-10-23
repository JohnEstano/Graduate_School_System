import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileText, 
  Eye, 
  Signature, 
  Upload, 
  Download,
  Check,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface EndorsementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any;
  coordinatorName?: string;
  onEndorseComplete?: () => void;
}

type EndorsementTab = 'preview' | 'signature' | 'upload';

export default function EndorsementDialog({
  open,
  onOpenChange,
  defenseRequest,
  coordinatorName = 'Coordinator',
  onEndorseComplete
}: EndorsementDialogProps) {
  const [currentTab, setCurrentTab] = useState<EndorsementTab>('preview');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedDocId, setGeneratedDocId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEndorsing, setIsEndorsing] = useState(false);
  
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
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  function csrf() {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
  }

  // Load templates and auto-generate document
  useEffect(() => {
    if (open) {
      loadTemplates();
      loadSignatures();
    } else {
      // Reset state when dialog closes
      if (generatedPdfUrl && generatedPdfUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(generatedPdfUrl);
      }
      setGeneratedPdfUrl(null);
      setGeneratedDocId(null);
      setCurrentTab('preview');
      setUploadedFile(null);
    }
  }, [open]);

  // Auto-generate document when templates are loaded
  useEffect(() => {
    if (open && templates.length > 0 && selectedTemplate && !generatedPdfUrl && !isGenerating) {
      handleGenerateDocument();
    }
  }, [open, templates, selectedTemplate]);

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
          fields: {}
        })
      });

      if (!res.ok) {
        toast.error('Failed to generate document');
        setIsGenerating(false);
        return;
      }

      // Get the PDF as a blob
      const blob = await res.blob();
      
      // Create a URL for the blob to use in iframe
      const url = window.URL.createObjectURL(blob);
      setGeneratedPdfUrl(url);
      
      // Also trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `endorsement_form_${defenseRequest.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Document generated and downloaded!');
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
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

  async function handleUseUploadedFile() {
    if (!uploadedFile || !defenseRequest?.id) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('endorsement_form', uploadedFile);
      formData.append('defense_request_id', defenseRequest.id.toString());

      const res = await fetch(`/api/defense-requests/${defenseRequest.id}/upload-endorsement`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf()
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPdfUrl(data.file_url);
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFinalEndorse() {
    if (!generatedPdfUrl && !uploadedFile) {
      toast.error('Please generate or upload a document first');
      return;
    }

    if (!activeSignature) {
      toast.error('Please set an active signature first');
      return;
    }

    setIsEndorsing(true);
    try {
      const res = await fetch(`/api/defense-requests/${defenseRequest.id}/adviser-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf()
        },
        body: JSON.stringify({
          adviser_status: 'Approved'
        })
      });

      if (res.ok) {
        toast.success('Request endorsed successfully!');
        onOpenChange(false);
        onEndorseComplete?.();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to endorse request');
      }
    } catch (err) {
      console.error('Endorse error:', err);
      toast.error('Failed to endorse request');
    } finally {
      setIsEndorsing(false);
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
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0 flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/30 flex flex-col">
              <div className="p-6 pb-4">
                <DialogHeader>
                  <DialogTitle className="text-lg">Endorse Request</DialogTitle>
                  <DialogDescription className="text-xs mt-2">
                    Generate and review the endorsement form
                  </DialogDescription>
                </DialogHeader>
              </div>

              <Separator />

              {/* Scrollable middle section */}
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 py-4">
                  <nav className="space-y-1">
                    <Button
                      variant={currentTab === 'preview' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setCurrentTab('preview')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>

                    <Button
                      variant={currentTab === 'signature' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setCurrentTab('signature')}
                    >
                      <Signature className="mr-2 h-4 w-4" />
                      Signature
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

                  {/* Request Info */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-medium text-muted-foreground">Student</div>
                      <div className="font-semibold">
                        {defenseRequest?.first_name} {defenseRequest?.last_name}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Defense Type</div>
                      <div className="font-semibold">{defenseRequest?.defense_type}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Coordinator</div>
                      <div className="font-semibold">{coordinatorName}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      {activeSignature ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Signature Ready</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-600">No Signature</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      {generatedPdfUrl ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Document Ready</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-amber-600">No Document</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <Separator />

              {/* Footer with Endorse Button */}
              <div className="p-6 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!generatedPdfUrl || !activeSignature || isEndorsing}
                  onClick={handleFinalEndorse}
                >
                  {isEndorsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Endorsing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Endorse to Coordinator
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {/* Generating State */}
                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Generating Document...</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Please wait while we prepare your endorsement form
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preview Tab */}
                  {!isGenerating && currentTab === 'preview' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Document Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            Review the generated endorsement form
                          </p>
                        </div>
                        {generatedPdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generatedPdfUrl, '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>

                      {generatedPdfUrl ? (
                        <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                          <iframe
                            src={generatedPdfUrl}
                            className="w-full h-full"
                            title="Document Preview"
                          />
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Document is being generated automatically. Please wait...
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Signature Tab */}
                  {currentTab === 'signature' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Manage Signature</h3>
                        <p className="text-sm text-muted-foreground">
                          View, draw, or upload your signature
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
                        <h3 className="text-lg font-semibold mb-2">Upload Custom File</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload your own endorsement form PDF
                        </p>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          If you prefer to use your own endorsement form, you can upload it here instead of generating one.
                        </AlertDescription>
                      </Alert>

                      <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {uploadedFile ? uploadedFile.name : 'No file selected'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF files only, max 10MB
                          </p>
                        </div>
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
                          Choose File
                        </Button>
                      </div>

                      {uploadedFile && (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleUseUploadedFile}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Use This File
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
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
