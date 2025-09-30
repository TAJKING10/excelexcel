import React from 'react'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, FileText, DollarSign } from 'lucide-react'

export function DashboardCards() {
  const { t } = useLanguageStore()
  const { employees, companies, payslips } = useDataStore()

  const stats = [
    {
      title: t('dashboard.employees'),
      value: employees.length.toString(),
      icon: Users,
      color: 'text-primary'
    },
    {
      title: t('dashboard.companies'),
      value: companies.length.toString(),
      icon: Building2,
      color: 'text-secondary'
    },
    {
      title: t('dashboard.payslips'),
      value: payslips.length.toString(),
      icon: FileText,
      color: 'text-tertiary'
    },
    {
      title: t('dashboard.payroll'),
      value: '€' + companies.reduce((sum, company) => sum + company.totalPayroll, 0).toLocaleString(),
      icon: DollarSign,
      color: 'text-success'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon size={20} className={stat.color} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
