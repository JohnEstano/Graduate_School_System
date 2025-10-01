import { DocumentGeneratorDialog } from "@/components/DocumentGeneratorDialog";
import { usePage } from "@inertiajs/react";

export default function DocumentPage() {
  // You should fetch or receive the defenseRequest data here
  // For demo, use a placeholder or get from props
  const { props } = usePage<any>();
  const defenseRequest = props.defenseRequest;

  return (
    <DocumentGeneratorDialog
      open={true}
      onOpenChange={() => {}}
      defenseRequest={defenseRequest}
      asPage
    />
  );
}