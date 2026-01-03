'use client'

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HealthCheckResult } from "@/types/project"

interface HealthCheckProps {
  checks: HealthCheckResult[]
  loading?: boolean
}

function StatusIcon({ status }: { status: HealthCheckResult['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'unhealthy':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
  }
}

export function HealthCheck({ checks, loading }: HealthCheckProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (checks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p className="text-sm">No health checks configured</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {checks.map((check) => (
        <div
          key={check.url}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <StatusIcon status={check.status} />
            <span className="text-sm text-muted-foreground truncate font-mono">
              {check.url.replace('https://', '')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {check.responseTime && (
              <span className="text-xs text-muted-foreground font-mono">
                {check.responseTime}ms
              </span>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                check.status === 'healthy' && "border-emerald-500/50 text-emerald-500",
                check.status === 'unhealthy' && "border-red-500/50 text-red-500",
                check.status === 'checking' && "border-muted-foreground/50 text-muted-foreground"
              )}
            >
              {check.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
