import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/stores/language'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { t } = useLanguageStore()
  const { logout, user } = useAuthStore()

  // Navigation based on role
  const getNavItems = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
        { path: '/admin/companies', icon: Building2, label: t('nav.companies') },
        { path: '/admin/individuals', icon: UserCircle, label: t('nav.individuals') },
        { path: '/admin/employees', icon: Users, label: t('nav.employees') },
        { path: '/admin/payslips', icon: FileText, label: t('nav.payslips') },
      ]
    }

    // Employee role navigation
    return [
      { path: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/payslips', icon: FileText, label: t('nav.payslips') },
      { path: '/profile', icon: UserCircle, label: t('nav.profile') || 'Profile' },
    ]
  }

  const navItems = getNavItems()

  return (
    <div className={cn(
      "bg-card border-r border-border transition-all duration-200 ease-in-out flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
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
            onClick={() => onToggle(!collapsed)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                  collapsed && "px-2"
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Bottom Actions */}
      <div className="p-4 space-y-2">
        <Link to="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted",
              collapsed && "px-2"
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
            "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted",
            collapsed && "px-2"
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="ml-3">{t('nav.logout')}</span>}
        </Button>
      </div>
    </div>
  )
}
