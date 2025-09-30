import React from 'react'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, DollarSign } from 'lucide-react'

export function CompanyList() {
  const { t } = useLanguageStore()
  const { companies } = useDataStore()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">{t('companies.title')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-card-foreground">
                <Building2 size={20} className="text-primary" />
                <span>{company.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employés</span>
                </div>
                <span className="font-semibold text-foreground">{company.employeeCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Masse salariale</span>
                </div>
                <span className="font-semibold text-foreground">€{company.totalPayroll.toLocaleString()}</span>
              </div>
              
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                {t('companies.details')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
