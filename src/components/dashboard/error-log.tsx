'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ErrorLog } from "@/types/project"

interface ErrorLogViewerProps {
  logs: ErrorLog[]
  loading?: boolean
  maxHeight?: string
}

function LogIcon({ level }: { level: ErrorLog['level'] }) {
  switch (level) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
    case 'warn':
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
    default:
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />
  }
}

function ServiceBadge({ service }: { service: ErrorLog['service'] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0",
        service === 'vercel' && "border-blue-500/50 text-blue-400",
        service === 'supabase' && "border-emerald-500/50 text-emerald-400",
        service === 'github' && "border-purple-500/50 text-purple-400"
      )}
    >
      {service}
    </Badge>
  )
}

export function ErrorLogViewer({ logs, loading, maxHeight = "300px" }: ErrorLogViewerProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-2 p-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Info className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No errors found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="pr-4" style={{ height: maxHeight }}>
      <div className="space-y-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className={cn(
              "flex items-start gap-2 p-2 rounded-md text-sm",
              "hover:bg-muted/50 transition-colors"
            )}
          >
            <LogIcon level={log.level} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <ServiceBadge service={log.service} />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground break-words font-mono text-xs">
                {log.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
