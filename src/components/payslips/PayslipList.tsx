import React from 'react'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Download, FileSpreadsheet } from 'lucide-react'

export function PayslipList() {
  const { t } = useLanguageStore()
  const { payslips, employees, companies } = useDataStore()

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return 'Individual'
    const employee = employees.find(e => e.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">{t('payslips.title')}</h2>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          {t('payslips.create')}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('payslips.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune fiche de paie trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">{t('payslips.period')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('payslips.employee')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('payslips.company')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id} className="hover:bg-muted/50">
                    <TableCell className="text-foreground">{payslip.period}</TableCell>
                    <TableCell className="text-foreground">{getEmployeeName(payslip.employeeId)}</TableCell>
                    <TableCell className="text-foreground">{getCompanyName(payslip.companyId)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
                          <Download size={16} className="mr-2" />
                          PDF
                        </Button>
                        <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
                          <FileSpreadsheet size={16} className="mr-2" />
                          Excel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
