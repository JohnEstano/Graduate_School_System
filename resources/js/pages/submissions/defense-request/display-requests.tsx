"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar, Info, Paperclip, Send } from "lucide-react"
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
  const [showDetails, setShowDetails] = useState(false)

  const attachments: { label: string; url?: string }[] = [
    { label: "Adviser’s Endorsement", url: request.advisers_endorsement },
    { label: "REC Endorsement", url: request.rec_endorsement },
    { label: "Proof of Payment", url: request.proof_of_payment },
    { label: "Reference No.", url: request.reference_no },
  ]

  return (
    <Card className="pt-10 pb-10">
      <CardHeader className="flex flex-row justify-between items-start col-span-2">
        <div>
          <CardTitle className="text-2xl pl-2 flex gap-3 ">Your Defense Request Was Sent</CardTitle>
          <div className="pb-5 pl-2">
            <h1 className="text-muted-foreground">
              The request will be reviewed shortly
            </h1>
          </div>
        </div>

      </CardHeader>
      <CardContent className="space-y-4">
        <Separator className="w-full" />
        <div className="pl-3">
          <h3 className="text-xs text-zinc-600">Thesis Title</h3>
          <h1 className="text-xl font-bold">{request.thesis_title}</h1>
          <div className="mt-2 space-x-2">
            <Badge variant="secondary">{request.mode_defense}</Badge>
            <Badge variant="secondary">{request.defense_type}</Badge>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-baseline pl-3 gap-8">
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

        <div className="flex justify-end items-center space-x-2">
          <button
            onClick={() => setShowDetails((v) => !v)}
            aria-label="Toggle details"
            className="p-2 rounded-lg hover:bg-zinc-100 "
          >
            <Info className="size-5" />
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 p-5  rounded-lg">
            <div className="flex flex-col lg:flex-row gap-6">

              <div className="w-full lg:w-1/2">
                <h3 className="text-xs text-zinc-600 mb-2">Attachments</h3>
                <div className="flex flex-col space-y-2">
                  {attachments.map(
                    ({ label, url }) =>
                      url && (
                        <a
                          key={label}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-zinc-50 transition w-full"
                        >
                          <div className="flex-shrink-0 p-2 bg-rose-500 rounded">
                            <Paperclip className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {url.split("/").pop()}
                            </span>
                          </div>
                        </a>
                      )
                  )}
                  {!attachments.some((att) => att.url) && (
                    <p className="text-sm text-muted-foreground">
                      No attachments available.
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <h3 className="text-xs text-zinc-600 mb-2">Committee</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Adviser:</span>{" "}
                    {request.defense_adviser}
                  </div>
                  <div>
                    <span className="font-medium">Chair:</span>{" "}
                    {request.defense_chairperson}
                  </div>
                  <div>
                    <span className="font-medium">Panelist I:</span>{" "}
                    {request.defense_panelist1}
                  </div>
                  {request.defense_panelist2 && (
                    <div>
                      <span className="font-medium">Panelist II:</span>{" "}
                      {request.defense_panelist2}
                    </div>
                  )}
                  {request.defense_panelist3 && (
                    <div>
                      <span className="font-medium">Panelist III:</span>{" "}
                      {request.defense_panelist3}
                    </div>
                  )}
                  {request.defense_panelist4 && (
                    <div>
                      <span className="font-medium">Panelist IV:</span>{" "}
                      {request.defense_panelist4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  )
}
