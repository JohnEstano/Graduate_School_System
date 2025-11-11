import { Card, CardContent } from "@/components/ui/card";
import { CircleAlert } from "lucide-react";

type SummaryCardsProps = {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
};

export function SummaryCards({
  pending,
  approved,
  rejected,
}: SummaryCardsProps) {
  return (
    <Card className="w-full rounded-sm border-none  h-auto p-0">
      <CardContent className="flex flex-row items-center justify-between px-4 min-h-10">
        <div className="flex items-center p-1    rounded gap-2">
          <CircleAlert className="size-4 text-rose-500" />
          <span className="text-xs  text-muted-foreground font-medium">
            Pending for Dean Approval:
          </span>
          <span className="text-base font-bold text-rose-600">{pending}</span>
        </div>
        <div className="flex items-center gap-4 ">
          <div className="flex items-center gap-1 ">
            <span className="text-xs text-muted-foreground">Approved</span>
            <span className="text-xs font-semibold text-green-600">
              {approved}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Rejected</span>
            <span className="text-xs font-semibold text-red-500">
              {rejected}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
