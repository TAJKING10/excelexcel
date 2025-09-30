import React from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Topbar } from './Topbar'
import { Toaster } from '@/components/ui/toaster'
import {
  LayoutDashboard,
  FileText,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export function UserShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const location = useLocation()
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/my-payslips', icon: FileText, label: t('nav.myPayslips') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ]

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-200 ease-in-out flex flex-col",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">A</span>
                </div>
                <span className="font-semibold text-card-foreground">{t('auth.title')}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted",
                    isActive && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    sidebarCollapsed && "px-2"
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}