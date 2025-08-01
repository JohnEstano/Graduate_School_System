import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileClock, Files } from "lucide-react";

type SummaryCardsProps = {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
};

export function SummaryCards({
  total,
  pending,
  inProgress,
  approved,
  rejected,
}: SummaryCardsProps) {
  const completed = approved + rejected + inProgress;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
      <Card className="shadow-none h-auto">
        <CardContent className=" flex flex-col items-left px-5">
          <div className="flex justify-between">
            <div className="text-[10px] text-muted-foreground">Total Requests</div>
            <Files className="size-4 text-muted-foreground"/>
          </div>

          <div className="text-lg font-bold">{total}</div>
        </CardContent>
      </Card>
      <Card className="shadow-none h-auto">
        <CardContent className="flex flex-col  items-left px-5">
           <div className="flex justify-between">
            <div className="text-[10px] text-muted-foreground">Pending Requests</div>
            <FileClock className="size-4 text-muted-foreground"/>
          </div>
          <div className="text-lg font-bold">{pending}</div>
        </CardContent>
      </Card>
   
      <Card className="shadow-none h-auto">
        <CardContent className=" flex flex-col items-center w-full">
          <div className="flex justify-between w-full text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full h-1" />
          <div className="w-full flex justify-between mt-1 text-[10px] text-muted-foreground"></div>
        </CardContent>
      </Card>
    </div>
  );
}