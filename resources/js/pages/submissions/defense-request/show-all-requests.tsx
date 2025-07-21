// show-all-requests.tsx
'use client'

import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import { format } from 'date-fns'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Loader2, MoreHorizontal } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export type DefenseRequestSummary = {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string
  program: string
  thesis_title: string
  date_of_defense: string
  mode_defense: string
  status?: 'pending' | 'approved' | 'rejected' | 'needs-info'
}

type Action = 'approve' | 'reject' | 'needs-info'

export default function ShowAllRequests({
  defenseRequests,
}: {
  defenseRequests: DefenseRequestSummary[]
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = useMemo(() => {
    if (!search) return defenseRequests
    return defenseRequests.filter((r) =>
      `${r.first_name} ${r.last_name} ${r.thesis_title}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [search, defenseRequests])

  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / perPage)

  const handleAction = (id: number, action: Action) => {
    setLoadingId(id)
    router.put(
      `/defense-requests/${id}/review`,
      { action },
      {
        preserveScroll: true,
        onFinish: () => setLoadingId(null),
      }
    )
  }

  return (
    <Card className="shadow">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <CardTitle>All Defense Requests</CardTitle>
        <Input
          placeholder="Search by student or title…"
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
          className="max-w-sm"
        />
      </CardHeader>

      <CardContent className="overflow-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Thesis Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((r, idx) => (
              <TableRow
                key={r.id}
                className={`${idx % 2 === 0 ? 'bg-muted' : ''
                  } hover:bg-muted/50 transition-colors`}
              >
                <TableCell>
                  {r.first_name}{' '}
                  {r.middle_name ? `${r.middle_name.charAt(0)}. ` : ''}
                  {r.last_name}
                </TableCell>
                <TableCell>{r.program}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block max-w-xs truncate cursor-help">
                        {r.thesis_title}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{r.thesis_title}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{format(new Date(r.date_of_defense), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="capitalize">{r.mode_defense.replace('-', ' ')}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === 'approved'
                        ? 'default'
                        : r.status === 'rejected'
                          ? 'destructive'
                          : r.status === 'needs-info'
                            ? 'secondary'
                            : 'outline'
                    }
                  >
                    {(r.status || 'pending').replace('-', ' ')}
                  </Badge>

                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(['approve', 'reject', 'needs-info'] as const).map((act) => (
                        <DropdownMenuItem
                          key={act}
                          onClick={() => handleAction(r.id, act)}
                          disabled={loadingId === r.id}
                        >
                          {loadingId === r.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {act === 'needs-info' ? 'Needs Info' : act.charAt(0).toUpperCase() + act.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} request{filtered.length !== 1 ? 's' : ''} total
        </p>
        <div className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
