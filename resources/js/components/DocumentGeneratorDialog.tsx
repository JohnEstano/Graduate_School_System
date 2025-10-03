import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type TemplateField = {
  key: string;
  label?: string;
  type?: string;
};

type DocumentTemplate = {
  id: number;
  name: string;
  code: string;
  fields: TemplateField[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseRequest: any; // Should match your backend shape
  trigger?: React.ReactNode;
  asPage?: boolean;
  onGenerated?: (url: string) => void;
};

export function DocumentGeneratorDialog({
  open,
  onOpenChange,
  defenseRequest,
  trigger,
  asPage = false,
  onGenerated,
}: Props) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Fetch templates on open
  useEffect(() => {
    if (open || asPage) {
      fetch("/api/document-templates")
        .then((r) => r.json())
        .then(setTemplates);
    }
  }, [open, asPage]);

  // Fetch template fields when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      fetch(`/api/document-templates/${selectedTemplateId}`)
        .then((r) => r.json())
        .then((tpl) => {
          setTemplateFields(tpl.fields || []);
          // Auto-fill values from defenseRequest
          const values: Record<string, string> = {};
          (tpl.fields || []).forEach((f: { key: string }) => {
            values[f.key] = getValueFromRequest(f.key, defenseRequest);
          });
          setFieldValues(values);
        });
    }
  }, [selectedTemplateId, defenseRequest]);

  function getValueFromRequest(key: string, req: any) {
    // Support dot notation, e.g. "student.full_name"
    const parts = key.split(".");
    let val = req;
    for (const p of parts) {
      if (val && typeof val === "object" && p in val) {
        val = val[p];
      } else {
        return "";
      }
    }
    return typeof val === "string" ? val : "";
  }

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedUrl(null);
    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-TOKEN":
            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
              ?.content || "",
        },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          defense_request_id: defenseRequest.id,
          fields: fieldValues,
        }),
      });
      const data = await res.json();
      if (data.ok && data.download_url) {
        setGeneratedUrl(data.download_url);
        toast.success("Document generated!");
        if (onGenerated) onGenerated(data.download_url);
      } else {
        toast.error(data.error || "Failed to generate document");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  }

  // PDF Preview (simple <iframe> for now)
  function Preview() {
    if (!generatedUrl) return null;
    return (
      <div className="mt-4">
        <div className="font-semibold mb-1">Preview:</div>
        <iframe
          src={generatedUrl}
          title="Generated PDF"
          style={{ width: "100%", height: "500px", border: "1px solid #ccc" }}
        />
        <a
          href={generatedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-blue-600 underline"
        >
          Download PDF
        </a>
      </div>
    );
  }

  // Main content
  const content = (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1">Select Template</label>
        <Select
          value={selectedTemplateId ? String(selectedTemplateId) : ""}
          onValueChange={(v) => setSelectedTemplateId(Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={String(tpl.id)}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {templateFields.length > 0 && (
        <div>
          <div className="font-semibold mb-2">Field Values</div>
          <div className="grid grid-cols-1 gap-2">
            {templateFields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1">{f.label || f.key}</label>
                <Input
                  value={fieldValues[f.key] || ""}
                  onChange={(e) =>
                    setFieldValues((vals) => ({
                      ...vals,
                      [f.key]: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={handleGenerate}
        disabled={!selectedTemplateId || generating}
        className="w-full"
      >
        {generating ? "Generating..." : "Generate Document"}
      </Button>
      <Preview />
    </div>
  );

  // Render as dialog or page
  if (asPage) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-xl font-bold mb-4">Generate Document</h1>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Document</DialogTitle>
          <DialogDescription>
            Select a template and generate a document for this defense request.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function mapToTemplateData(req: any) {
  return {
    ...req,
    student: {
      full_name: `${req.first_name || ''} ${req.last_name || ''}`.trim(),
      program: req.program || '',
      school_id: req.school_id || '',
    },
    request: {
      thesis_title: req.thesis_title || '',
      defense_type: req.defense_type || req.status || '',
    },
    adviser: req.adviser || req.defense_adviser || '',
    // Add more mappings as needed
  };
}