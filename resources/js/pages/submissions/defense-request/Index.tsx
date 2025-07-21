import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import DefenseRequestForm from './defense-request-form'
import DisplayRequest from './display-requests'

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Defense Requests', href: '/defense-request' },
]

type PageProps = {
  defenseRequest: {
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
  } | null
}

export default function DefenseRequestIndex() {
  const { defenseRequest } = usePage<PageProps>().props

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Defense Requests" />

      <div className="flex h-full pb-5 flex-1 flex-col pt-5 gap-4 px-7 overflow-auto">
        <div className="flex justify-between">
        
        </div>

        <div className="grid auto-rows-min gap-4 md:grid-cols-1">
          {defenseRequest ? (
            <DisplayRequest request={defenseRequest} />
          ) : (
            <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border p-5">
              <div className="flex flex-1 flex-col justify-center h-full items-center gap-5">
                <div className="gap-2 items-center flex flex-col">
                  <h2 className="text-lg font-semibold text-zinc-700">No defense request sent</h2>
                  <p className="text-sm text-muted-foreground">
                    If you’re eligible to apply for a defense submit your request here.
                  </p>
                </div>
                <DefenseRequestForm />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
