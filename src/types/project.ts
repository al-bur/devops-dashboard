export interface Project {
  id: string
  name: string
  vercelProjectId?: string
  githubRepo?: string
  supabaseProjectRef?: string
  url?: string
  healthCheckUrl?: string
}

export interface VercelDeployment {
  uid: string
  name: string
  url: string
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED'
  created: number
  meta?: {
    githubCommitMessage?: string
    githubCommitRef?: string
  }
}

export interface GitHubWorkflowRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  html_url: string
  created_at: string
  head_branch: string
}

export interface GitHubWorkflow {
  id: number
  name: string
  state: 'active' | 'disabled_manually' | 'disabled_inactivity'
  path: string
}

export interface SupabaseStats {
  tables: number
  totalRows: number
  users: {
    total: number
    todaySignups: number
    activeUsers: number
  }
}

export interface HealthCheckResult {
  url: string
  status: 'healthy' | 'unhealthy' | 'checking'
  responseTime?: number
  lastChecked?: string
}

export interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  service: 'vercel' | 'supabase' | 'github'
}

export interface RecentUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}
