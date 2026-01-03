'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RefreshCw,
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"

type ServiceStatus = 'live' | 'building' | 'error' | 'unknown'

interface ProjectCardProps {
  name: string
  url?: string
  vercelStatus?: ServiceStatus
  githubStatus?: ServiceStatus
  supabaseStatus?: ServiceStatus
  onDeploy?: () => void
  onTriggerAction?: () => void
  onHide?: () => void
  loading?: boolean
  deploying?: boolean
  triggering?: boolean
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  switch (status) {
    case 'live':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'building':
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        status === 'live' && "border-emerald-500/50 text-emerald-500 bg-emerald-500/10",
        status === 'building' && "border-yellow-500/50 text-yellow-500 bg-yellow-500/10",
        status === 'error' && "border-red-500/50 text-red-500 bg-red-500/10",
        status === 'unknown' && "border-muted-foreground/50 text-muted-foreground"
      )}
    >
      {status === 'live' && 'Live'}
      {status === 'building' && 'Building'}
      {status === 'error' && 'Error'}
      {status === 'unknown' && 'Unknown'}
    </Badge>
  )
}

export function ProjectCard({
  name,
  url,
  vercelStatus = 'unknown',
  githubStatus = 'unknown',
  supabaseStatus = 'unknown',
  onDeploy,
  onTriggerAction,
  onHide,
  loading,
  deploying,
  triggering
}: ProjectCardProps) {
  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-20" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <StatusBadge status={vercelStatus} />
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
          >
            {url.replace('https://', '')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon status={vercelStatus} />
            <span className="text-muted-foreground">Vercel</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status={githubStatus} />
            <span className="text-muted-foreground">Actions</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status={supabaseStatus} />
            <span className="text-muted-foreground">Supabase</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeploy}
          disabled={deploying}
        >
          {deploying ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Deploy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTriggerAction}
          disabled={triggering}
        >
          {triggering ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Run Action
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHide}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
