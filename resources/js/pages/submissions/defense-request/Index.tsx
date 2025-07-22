// resources/js/Pages/submissions/defense-request/Index.tsx
import AppLayout from '@/layouts/app-layout'
import { Head, usePage } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import DefenseRequestForm from './defense-request-form'
import ShowAllRequests, {
  type DefenseRequestSummary,
} from './show-all-requests'
import DisplayRequest, {
  type DefenseRequestFull,
} from './display-requests'

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Defense Requests', href: '/defense-request' },
]

type PageProps = {
  auth: {
    user: {
      role: string
      school_id: string
    }
  }
  defenseRequest?: DefenseRequestFull | null
  defenseRequests?: DefenseRequestSummary[]
}

export default function DefenseRequestIndex() {
  const { props } = usePage<PageProps>()
  const { auth, defenseRequest, defenseRequests } = props
  const role = auth.user.role

  const staffRoles = ['Administrative Assistant', 'Coordinator', 'Dean']
  const isStaff = staffRoles.includes(role)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Defense Requests" />

      <div className="flex h-full pb-5 flex-1 flex-col pt-5 gap-4 px-7 overflow-auto">
        {isStaff ? (
          <ShowAllRequests defenseRequests={defenseRequests || []} />
        ) : (
          <div className="grid auto-rows-min gap-4 md:grid-cols-1">
            {defenseRequest ? (
              <DisplayRequest request={defenseRequest} />
            ) : (
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex flex-1 flex-col justify-center h-full items-center gap-5">
                  <div className="gap-2 items-center flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-700">
                      No defense request sent
                    </h2>
                    <p className="text-sm text-gray-500">
                      If you're eligible to apply for a defense, submit your request here.
                    </p>
                  </div>
                  <DefenseRequestForm />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
