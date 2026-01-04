'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  RefreshCw,
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  EyeOff,
  Minus,
  Wrench,
  ChevronDown,
  Github
} from "lucide-react"
import { cn } from "@/lib/utils"

type ServiceStatus = 'live' | 'building' | 'error' | 'unknown' | 'na'

interface WorkflowInfo {
  id: number
  name: string
  path: string
  state: string
}

interface ProjectCardProps {
  name: string
  url?: string
  githubRepo?: string
  vercelStatus?: ServiceStatus
  githubStatus?: ServiceStatus
  supabaseStatus?: ServiceStatus
  hasGitHub?: boolean
  maintenance?: boolean
  onDeploy?: () => void
  onTriggerAction?: (workflow?: string) => void
  onToggleMaintenance?: () => void
  onHide?: () => void
  loading?: boolean
  deploying?: boolean
  triggering?: boolean
  togglingMaintenance?: boolean
}

function StatusIcon({ status }: { status: ServiceStatus }) {
  switch (status) {
    case 'live':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'building':
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'na':
      return <Minus className="h-4 w-4 text-muted-foreground/50" />
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
        (status === 'unknown' || status === 'na') && "border-muted-foreground/50 text-muted-foreground"
      )}
    >
      {status === 'live' && 'Live'}
      {status === 'building' && 'Building'}
      {status === 'error' && 'Error'}
      {status === 'unknown' && 'Unknown'}
      {status === 'na' && 'N/A'}
    </Badge>
  )
}

export function ProjectCard({
  name,
  url,
  githubRepo,
  vercelStatus = 'unknown',
  githubStatus = 'unknown',
  supabaseStatus = 'unknown',
  hasGitHub = true,
  maintenance = false,
  onDeploy,
  onTriggerAction,
  onToggleMaintenance,
  onHide,
  loading,
  deploying,
  triggering,
  togglingMaintenance
}: ProjectCardProps) {
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Fetch workflows when dropdown opens
  useEffect(() => {
    if (dropdownOpen && hasGitHub && githubRepo && workflows.length === 0) {
      setLoadingWorkflows(true)
      fetch(`/api/github/workflows?repo=${encodeURIComponent(githubRepo)}`)
        .then(res => res.json())
        .then(data => {
          setWorkflows(data.workflows || [])
        })
        .catch(() => {
          setWorkflows([])
        })
        .finally(() => {
          setLoadingWorkflows(false)
        })
    }
  }, [dropdownOpen, hasGitHub, githubRepo, workflows.length])

  const handleRunWorkflow = (workflowPath?: string) => {
    const workflowFile = workflowPath?.split('/').pop()
    onTriggerAction?.(workflowFile)
    setDropdownOpen(false)
  }

  const githubUrl = githubRepo ? `https://github.com/${githubRepo}` : undefined

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
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
            {maintenance && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-xs">
                점검중
              </Badge>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Open GitHub repository"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
          </div>
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

        {/* Workflow Selection Dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={triggering || !hasGitHub}
              title={!hasGitHub ? 'GitHub not connected' : undefined}
            >
              {triggering ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Action
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Select Workflow
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loadingWorkflows ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : workflows.length === 0 ? (
              <>
                <DropdownMenuItem onClick={() => handleRunWorkflow()}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Default
                </DropdownMenuItem>
                <p className="text-xs text-muted-foreground px-2 py-1">
                  No workflows found
                </p>
              </>
            ) : (
              workflows.map((workflow) => (
                <DropdownMenuItem
                  key={workflow.id}
                  onClick={() => handleRunWorkflow(workflow.path)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  <span className="truncate">{workflow.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMaintenance}
          disabled={togglingMaintenance}
          className={cn(
            "ml-auto",
            maintenance ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"
          )}
          title={maintenance ? "점검 모드 해제" : "점검 모드 설정"}
        >
          {togglingMaintenance ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wrench className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onHide}
          className="text-muted-foreground hover:text-destructive"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
