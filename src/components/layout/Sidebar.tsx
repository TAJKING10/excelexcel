import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/language'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  Activity,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  FileSpreadsheet,
  Receipt
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { t } = useLanguageStore()
  const { user, logout } = useAuth()

  // Navigation based on role
  const getNavItems = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
        { path: '/admin/companies', icon: Building2, label: t('nav.companies') },
        { path: '/admin/individuals', icon: UserCircle, label: t('nav.individuals') },
        { path: '/admin/employees', icon: Users, label: t('nav.employees') },
        { path: '/admin/payslips', icon: FileText, label: t('nav.payslips') },
        { path: '/admin/payslips/explorer', icon: FileText, label: t('nav.explorer', { defaultValue: 'Explorer' }) },
        { path: '/admin/payslips/annual', icon: FileSpreadsheet, label: 'Fiches Annuelles' },
        { path: '/admin/tax-management', icon: Receipt, label: 'Gestion des Taxes' },
      ]
    }

    // Employee role navigation
    return [
      { path: '/employee/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
//       { path: '/employee/payslips', icon: FileText, label: t('nav.payslips') },
      { path: '/employee/profile', icon: UserCircle, label: t('nav.profile') },
    ]
  }

  const navItems = getNavItems()

  return (
    <div className={cn(
      "bg-white border-r border-[#eff6ff] transition-all duration-300 ease-in-out flex flex-col shadow-sm dark:bg-[#0f172a] dark:border-[#1e293b]",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[#eff6ff] dark:border-[#1e293b]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#003ABD] to-[#00226E] rounded-lg flex items-center justify-center shadow-md dark:from-[#3b82f6] dark:to-[#1d4ed8]">
                <span className="text-white font-extrabold text-lg">A</span>
              </div>
              <span className="font-bold text-[#00226E] text-lg tracking-tight dark:text-[#f8fafc]">{t('auth.title')}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(!collapsed)}
            className="text-[#64748B] hover:text-[#003ABD] hover:bg-[#eff6ff] dark:text-[#cbd5e1] dark:hover:text-[#60a5fa] dark:hover:bg-[#1e293b]"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
                          (item.path !== '/' && item.path !== '/admin' && location.pathname.startsWith(item.path))

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-11 text-[#64748B] hover:text-[#003ABD] hover:bg-[#eff6ff] transition-advensys font-medium dark:text-[#94a3b8] dark:hover:text-[#60a5fa] dark:hover:bg-[#1e293b]",
                  isActive && "bg-[#eff6ff] text-[#003ABD] shadow-sm border-l-4 border-[#003ABD] rounded-l-none dark:bg-[#1e293b] dark:text-[#60a5fa] dark:border-[#60a5fa]",
                  collapsed ? "px-2 justify-center" : "px-4"
                )}
              >
                <Icon size={20} className={cn("shrink-0", isActive && "text-[#003ABD] dark:text-[#60a5fa]")} />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Bottom Actions */}
      <div className="p-3 space-y-1 border-t border-[#eff6ff] dark:border-[#1e293b]">
        {user?.role === 'SUPER_ADMIN' && (
          <Link to="/activity-log">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-11 text-[#64748B] hover:text-[#003ABD] hover:bg-[#eff6ff] transition-advensys font-medium dark:text-[#94a3b8] dark:hover:text-[#60a5fa] dark:hover:bg-[#1e293b]",
                location.pathname.includes('/activity-log') && "bg-[#eff6ff] text-[#003ABD] dark:bg-[#1e293b] dark:text-[#60a5fa]",
                collapsed ? "px-2 justify-center" : "px-4"
              )}
            >
              <Activity size={20} className="shrink-0" />
              {!collapsed && <span className="ml-3">Activity Log</span>}
            </Button>
          </Link>
        )}

        <Link to={user?.role === 'SUPER_ADMIN' ? '/admin/settings' : '/employee/settings'}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-11 text-[#64748B] hover:text-[#003ABD] hover:bg-[#eff6ff] transition-advensys font-medium dark:text-[#94a3b8] dark:hover:text-[#60a5fa] dark:hover:bg-[#1e293b]",
              location.pathname.includes('/settings') && "bg-[#eff6ff] text-[#003ABD] dark:bg-[#1e293b] dark:text-[#60a5fa]",
              collapsed ? "px-2 justify-center" : "px-4"
            )}
          >
            <Settings size={20} className="shrink-0" />
            {!collapsed && <span className="ml-3">{t('nav.settings')}</span>}
          </Button>
        </Link>

        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start h-11 text-[#64748B] hover:text-[#dc2626] hover:bg-red-50 transition-advensys font-medium dark:text-[#94a3b8] dark:hover:text-[#ef4444] dark:hover:bg-[#1e293b]",
            collapsed ? "px-2 justify-center" : "px-4"
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="ml-3">{t('nav.logout')}</span>}
        </Button>
      </div>
    </div>
  )
}
