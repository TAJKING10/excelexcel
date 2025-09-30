import React from 'react'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, FileText } from 'lucide-react'

export function IndividualList() {
  const { t } = useLanguageStore()
  const { individuals } = useDataStore()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">{t('individuals.title')}</h2>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          {t('individuals.create')}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('individuals.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">{t('employees.name')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.firstname')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.email')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {individuals.map((individual) => (
                <TableRow key={individual.id} className="hover:bg-muted/50">
                  <TableCell className="text-foreground">{individual.lastName}</TableCell>
                  <TableCell className="text-foreground">{individual.firstName}</TableCell>
                  <TableCell className="text-foreground">{individual.email}</TableCell>
                  <TableCell>
                    <Button size="sm" className="bg-tertiary text-tertiary-foreground hover:bg-tertiary/90">
                      <FileText size={16} className="mr-2" />
                      {t('payslips.create')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
