import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar } from 'lucide-react'
import { Separator } from "@/components/ui/separator"

type Props = {
  request: {
    first_name: string
    middle_name: string | null
    last_name: string
    school_id: string
    program: string
    thesis_title: string
    date_of_defense: string
    mode_defense: string
    defense_type: string
    advisers_endorsement?: string
    rec_endorsement?: string
    proof_of_payment?: string
    reference_no?: string
    defense_adviser: string
    defense_chairperson: string
    defense_panelist1: string
    defense_panelist2?: string
    defense_panelist3?: string
    defense_panelist4?: string
  }
}

export default function DisplayRequest({ request }: Props) {
  return (
    <Card className="pt-10 pb-10 border-rose-500">
      <CardHeader>
        <CardTitle className="text-2xl">Your Defense Request Was Sent</CardTitle>
        <div className="pb-5">
          <h1 className="text-muted-foreground">The request will be reviewed shortly</h1>
        </div>

      </CardHeader>

      
      <CardContent className="space-y-4">
        <Separator className="w-full"/>
        <div className="flex-1">
          <h3 className="text-xs text-zinc-600">Thesis Title</h3>
          <h1 className="text-xl font-bold">{request.thesis_title}</h1>
          <div className="mt-2 space-x-2">
            <Badge variant="secondary">{request.mode_defense}</Badge>
            <Badge variant="secondary">{request.defense_type}</Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-baseline gap-8">
          <div className="flex flex-col">
            <h3 className="text-xs text-zinc-600 mb-1">Presenter</h3>
            <h1 className="text-sm font-bold leading-tight">
              {`${request.first_name} ${request.middle_name ?? ""} ${request.last_name}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {request.school_id}
            </p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-xs text-zinc-600 mb-1">Program</h3>
            <h1 className="text-sm font-bold leading-tight">
              {request.program}
            </h1>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 mb-1">
              <Calendar className="size-4 text-zinc-600" />
              <h3 className="text-xs text-zinc-600">Date Scheduled</h3>
            </div>
            <p className="text-sm font-bold leading-tight">
              {format(new Date(request.date_of_defense), "PPP")}
            </p>
          </div>
        </div>  

     


        <div>
          <h3 className="text-xs">Committee</h3>
          <ul className="list-disc list-inside text-sm font-medium">
            <li>Adviser: {request.defense_adviser}</li>
            <li>Chair: {request.defense_chairperson}</li>
            <li>Panelist I: {request.defense_panelist1}</li>
            {request.defense_panelist2 && <li>Panelist II: {request.defense_panelist2}</li>}
            {request.defense_panelist3 && <li>Panelist III: {request.defense_panelist3}</li>}
            {request.defense_panelist4 && <li>Panelist IV: {request.defense_panelist4}</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
