# Coordinator Signature Dialog - Simplified Fix

## Problem
The current coordinator approve dialog is **regenerating the entire document** instead of just adding a signature overlay on top of the adviser's existing endorsement form. This causes:
1. Loss of adviser's signature and information
2. Inaccurate field positioning
3. Over-complicated UI with unnecessary options
4. Confusing workflow

## Solution Overview
Simplify the dialog to:
1. **Load the existing endorsement form** from the adviser (no regeneration)
2. **Add a draggable signature overlay** that the coordinator can position
3. **Remove unnecessary UI clutter** from sidebar
4. **Send only the signature position coordinates** to the backend for accurate PDF overlay

## Key Changes

### 1. Remove These Features
- ❌ Document generation/regeneration
- ❌ Template selection
- ❌ Coordinator information form fields (full name, title)
- ❌ Upload tab
- ❌ Multiple tabs (preview/signature/upload)
- ❌ "Generate Document" button

### 2. Keep Only Essential Features
- ✅ Load existing endorsement form
- ✅ Signature management (draw, save, activate)
- ✅ Draggable signature positioning on PDF preview
- ✅ Approve & sign button
- ✅ Email notification option

### 3. New Simplified Flow
1. Dialog opens → automatically loads adviser's endorsement form
2. Coordinator selects/draws their signature
3. Coordinator drags signature box to desired position on PDF
4. Coordinator clicks "Approve & Sign"
5. Backend receives:
   - Original PDF file (from adviser)
   - Signature position coordinates (x, y, width, height)
   - Active signature image
6. Backend overlays coordinator signature at exact coordinates
7. Saves signed PDF and updates status

## Implementation

### Frontend Changes (coordinator-approve-dialog.tsx)

#### Remove These State Variables:
```typescript
// REMOVE
const [currentTab, setCurrentTab] = useState<ApprovalTab>('preview');
const [isGenerating, setIsGenerating] = useState(false);
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const [coordinatorFullName, setCoordinatorFullName] = useState('');
const [coordinatorTitle, setCoordinatorTitle] = useState('');
const [templates, setTemplates] = useState<any[]>([]);
const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
```

#### Add These State Variables:
```typescript
// ADD
const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>({
  x: 100,
  y: 550,
  width: 150,
  height: 60
});
const [isDraggingSignature, setIsDraggingSignature] = useState(false);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const pdfContainerRef = useRef<HTMLDivElement>(null);
```

#### Remove These Functions:
```typescript
// REMOVE
loadTemplates()
handleGenerateDocument()
handleUploadFile()
handleDragOver()
handleDragLeave()
handleDrop()
handleUseUploadedFile()
```

#### Add These Functions:
```typescript
// ADD
function handleSignatureMouseDown(e: React.MouseEvent) {
  e.preventDefault();
  setIsDraggingSignature(true);
  const rect = pdfContainerRef.current?.getBoundingClientRect();
  if (rect) {
    setDragOffset({
      x: e.clientX - rect.left - signaturePosition.x,
      y: e.clientY - rect.top - signaturePosition.y
    });
  }
}

function handleMouseMove(e: React.MouseEvent) {
  if (!isDraggingSignature) return;
  const rect = pdfContainerRef.current?.getBoundingClientRect();
  if (rect) {
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - signaturePosition.width));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - signaturePosition.height));
    setSignaturePosition(prev => ({ ...prev, x: newX, y: newY }));
  }
}

function handleMouseUp() {
  setIsDraggingSignature(false);
}
```

####  Update handleFinalApprove():
```typescript
async function handleFinalApprove() {
  setIsApproving(true);
  setShowEmailDialog(false);
  try {
    const formData = new FormData();
    
    // Add the existing endorsement form (not regenerated!)
    const response = await fetch(endorsementPdfUrl!);
    const blob = await response.blob();
    formData.append('endorsement_form', blob, 'endorsement-form.pdf');
    
    // Add signature positioning data
    formData.append('signature_x', signaturePosition.x.toString());
    formData.append('signature_y', signaturePosition.y.toString());
    formData.append('signature_width', signaturePosition.width.toString());
    formData.append('signature_height', signaturePosition.height.toString());
    
    // Rest of approval logic...
  }
}
```

### Backend Changes Required

The endpoint `/api/defense-requests/{id}/add-coordinator-signature` needs to:

1. Accept signature position parameters:
   - `signature_x`
   - `signature_y`
   - `signature_width`
   - `signature_height`

2. Load the coordinator's active signature image

3. Use a PDF library (e.g., FPDI, TCPDF, or similar) to:
   - Load the existing PDF
   - Calculate exact pixel positions
   - Overlay the signature image at the specified coordinates
   - Save the new PDF

### UI Simplifications

#### Sidebar Should Only Show:
1. **Dialog Header**: "Sign Document"
2. **Active Signature Section**: Shows current active signature with instructions
3. **Manage Signature Button**: Opens draw signature dialog
4. **Your Signatures List**: Grid of saved signatures with "Set Active" buttons
5. **Approve & Sign Button**: Main action button at bottom

#### Main Content Should Show:
1. **PDF Preview**: Full endorsement form in iframe
2. **Draggable Signature Box**: Highlighted box with signature preview that can be dragged
3. **Position Instructions**: "Drag the signature box to where you want it placed"

#### Remove From UI:
- ❌ "Preview Document" / "My Signature" / "Upload File" tabs
- ❌ Template selector
- ❌ Coordinator information form
- ❌ Request info section (student, program, etc.) - already visible in main table
- ❌ Status info section
- ❌ Generate/Regenerate buttons
- ❌ Upload drag & drop zone

## Benefits

1. **Accurate Signature Placement**: No more moving/shifting signatures
2. **Preserves Adviser's Work**: Original endorsement form stays intact
3. **Simpler UX**: One clear workflow - load, position, sign
4. **Faster**: No document regeneration needed
5. **Less Error-Prone**: Fewer moving parts, less can go wrong

## Testing Checklist

- [ ] Endorsement form loads correctly from adviser
- [ ] Signature box is visible and draggable
- [ ] Signature stays within PDF boundaries when dragging
- [ ] Position coordinates are accurate
- [ ] Backend correctly overlays signature at specified position
- [ ] Final PDF has both adviser and coordinator signatures
- [ ] Email notification works
- [ ] Status updates correctly after approval

## Notes

- The draggable signature box uses a highlighted border to show placement
- Mouse events handle the dragging (mousedown, mousemove, mouseup)
- Position is calculated relative to the PDF container
- Signature maintains aspect ratio during placement
- Backend must convert UI coordinates to PDF points accurately
