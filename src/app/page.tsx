'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  RefreshCw,
  Activity,
  Users,
  Database,
  AlertTriangle,
  Rocket,
  GitBranch,
  Server,
  Eye,
  Settings,
  LogOut,
  Bell
} from "lucide-react"
import { toast } from "sonner"

import { StatsCard } from "@/components/dashboard/stats-card"
import { ProjectCard } from "@/components/dashboard/project-card"
import { ErrorLogViewer } from "@/components/dashboard/error-log"
import { UserList } from "@/components/dashboard/user-list"
import { HealthCheck } from "@/components/dashboard/health-check"
import { NotificationPanel } from "@/components/dashboard/notification-panel"
import { SendPushDialog } from "@/components/dashboard/send-push-dialog"

import type {
  Project,
  ErrorLog,
  RecentUser,
  HealthCheckResult
} from "@/types/project"

interface DashboardStats {
  totalUsers: number
  todaySignups: number
  activeUsers: number
  totalProjects: number
}

type ServiceStatus = 'live' | 'building' | 'error' | 'unknown' | 'na'

interface ProjectStatus {
  [projectId: string]: {
    vercel: ServiceStatus
    github: ServiceStatus
    supabase: ServiceStatus
  }
}

const HIDDEN_PROJECTS_KEY = 'devops-dashboard-hidden-projects'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [hiddenProjects, setHiddenProjects] = useState<string[]>([])
  const [showHiddenPanel, setShowHiddenPanel] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todaySignups: 0,
    activeUsers: 0,
    totalProjects: 0
  })
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus>({})
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([])
  const [deployingProject, setDeployingProject] = useState<string | null>(null)
  const [triggeringProject, setTriggeringProject] = useState<string | null>(null)
  const [maintenanceStatuses, setMaintenanceStatuses] = useState<Record<string, boolean>>({})
  const [togglingMaintenance, setTogglingMaintenance] = useState<string | null>(null)

  // Load hidden projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HIDDEN_PROJECTS_KEY)
    if (saved) {
      setHiddenProjects(JSON.parse(saved))
    }
  }, [])

  // Save hidden projects to localStorage
  const saveHiddenProjects = (ids: string[]) => {
    localStorage.setItem(HIDDEN_PROJECTS_KEY, JSON.stringify(ids))
    setHiddenProjects(ids)
  }

  const handleHideProject = (projectId: string) => {
    const updated = [...hiddenProjects, projectId]
    saveHiddenProjects(updated)
    toast.success('Project hidden')
  }

  const handleUnhideProject = (projectId: string) => {
    const updated = hiddenProjects.filter(id => id !== projectId)
    saveHiddenProjects(updated)
    toast.success('Project restored')
  }

  // Filter visible projects
  const visibleProjects = projects.filter(p => !hiddenProjects.includes(p.id))
  const hiddenProjectsList = projects.filter(p => hiddenProjects.includes(p.id))

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch projects from Vercel
      const projectsRes = await fetch('/api/projects')
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
        setStats(prev => ({ ...prev, totalProjects: projectsData.total || 0 }))
      }

      // Fetch stats
      const statsRes = await fetch('/api/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(prev => ({ ...prev, ...statsData }))
      }

      // Fetch project statuses
      const statusRes = await fetch('/api/projects/status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setProjectStatuses(statusData)
      }

      // Fetch error logs
      const logsRes = await fetch('/api/logs')
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setErrorLogs(logsData)
      }

      // Fetch recent users
      const usersRes = await fetch('/api/users/recent')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setRecentUsers(usersData)
      }

      // Fetch health checks
      const healthRes = await fetch('/api/health')
      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealthChecks(healthData)
      }

      // Fetch maintenance statuses
      const maintenanceRes = await fetch('/api/projects/maintenance')
      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json()
        const statuses: Record<string, boolean> = {}
        for (const [projectId, data] of Object.entries(maintenanceData)) {
          statuses[projectId] = (data as { enabled: boolean }).enabled
        }
        setMaintenanceStatuses(statuses)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchDashboardData()
      setLoading(false)
    }
    loadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  const handleLogout = async () => {
    document.cookie = 'devops-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    window.location.href = '/login'
  }

  const handleToggleMaintenance = async (projectId: string, projectName: string) => {
    setTogglingMaintenance(projectId)
    const currentStatus = maintenanceStatuses[projectId] ?? false
    try {
      const res = await fetch('/api/projects/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          enabled: !currentStatus
        })
      })
      if (res.ok) {
        setMaintenanceStatuses(prev => ({
          ...prev,
          [projectId]: !currentStatus
        }))
        toast.success(currentStatus ? `${projectName} 점검 해제` : `${projectName} 점검 모드 설정`)
      } else {
        toast.error('점검 모드 변경 실패')
      }
    } catch {
      toast.error('점검 모드 변경 실패')
    } finally {
      setTogglingMaintenance(null)
    }
  }

  const handleDeploy = async (projectId: string) => {
    setDeployingProject(projectId)
    try {
      const res = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (res.ok) {
        toast.success('Deployment triggered successfully')
      } else {
        toast.error('Failed to trigger deployment')
      }
    } catch {
      toast.error('Failed to trigger deployment')
    } finally {
      setDeployingProject(null)
    }
  }

  const handleTriggerAction = async (projectId: string, workflow?: string) => {
    setTriggeringProject(projectId)
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const res = await fetch('/api/github/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: project.githubRepo,
          workflow // 워크플로우 지정 시 해당 워크플로우 실행, 미지정 시 자동 감지
        })
      })
      if (res.ok) {
        const workflowName = workflow || 'default'
        toast.success(`GitHub Action "${workflowName}" triggered`)
      } else {
        toast.error('Failed to trigger GitHub Action')
      }
    } catch {
      toast.error('Failed to trigger GitHub Action')
    } finally {
      setTriggeringProject(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">DevOps Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <SendPushDialog />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              change="+12% from last month"
              changeType="positive"
              icon={<Users className="h-4 w-4" />}
              loading={loading}
            />
            <StatsCard
              title="Today's Signups"
              value={stats.todaySignups}
              change="vs yesterday"
              changeType="neutral"
              icon={<Users className="h-4 w-4" />}
              loading={loading}
            />
            <StatsCard
              title="Active Users"
              value={stats.activeUsers}
              change="Last 24h"
              changeType="neutral"
              icon={<Activity className="h-4 w-4" />}
              loading={loading}
            />
            <StatsCard
              title="Projects"
              value={stats.totalProjects}
              change="All monitored"
              changeType="neutral"
              icon={<Database className="h-4 w-4" />}
              loading={loading}
            />
          </div>
        </section>

        <Separator />

        {/* Projects Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              Projects
              <span className="text-sm font-normal text-muted-foreground">
                ({visibleProjects.length})
              </span>
            </h2>
            {hiddenProjectsList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHiddenPanel(!showHiddenPanel)}
                className="text-muted-foreground"
              >
                <Settings className="h-4 w-4 mr-1" />
                {hiddenProjectsList.length} hidden
              </Button>
            )}
          </div>

          {/* Hidden Projects Panel */}
          {showHiddenPanel && hiddenProjectsList.length > 0 && (
            <Card className="mb-4 border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hidden Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {hiddenProjectsList.map((project) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnhideProject(project.id)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {project.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.length === 0 && !loading && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {projects.length === 0
                  ? 'No projects found. Make sure VERCEL_TOKEN is configured.'
                  : 'All projects are hidden. Click "hidden" button to restore.'}
              </div>
            )}
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                name={project.name}
                url={project.url}
                githubRepo={project.githubRepo}
                vercelStatus={projectStatuses[project.id]?.vercel || 'unknown'}
                githubStatus={projectStatuses[project.id]?.github || 'unknown'}
                supabaseStatus={projectStatuses[project.id]?.supabase || 'unknown'}
                hasGitHub={!!project.githubRepo}
                maintenance={maintenanceStatuses[project.id] ?? false}
                onDeploy={() => handleDeploy(project.id)}
                onTriggerAction={(workflow) => handleTriggerAction(project.id, workflow)}
                onToggleMaintenance={() => handleToggleMaintenance(project.id, project.name)}
                onHide={() => handleHideProject(project.id)}
                loading={loading}
                deploying={deployingProject === project.id}
                triggering={triggeringProject === project.id}
                togglingMaintenance={togglingMaintenance === project.id}
              />
            ))}
          </div>
        </section>

        <Separator />

        {/* Tabs Section */}
        <section>
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="mt-4">
              <NotificationPanel />
            </TabsContent>

            <TabsContent value="health" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    Health Checks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HealthCheck checks={healthChecks} loading={loading} maxHeight="400px" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Recent Signups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserList users={recentUsers} loading={loading} maxHeight="400px" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Error Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorLogViewer logs={errorLogs} loading={loading} maxHeight="400px" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            DevOps Dashboard • Auto-refreshes every 30s
          </p>
        </div>
      </footer>
    </div>
  )
}
