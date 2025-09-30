import React from 'react'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Edit, Trash2, RotateCcw } from 'lucide-react'

export function EmployeeList() {
  const { t } = useLanguageStore()
  const { employees, companies } = useDataStore()

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">{t('employees.title')}</h2>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          {t('employees.add')}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('employees.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">{t('employees.name')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.firstname')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.email')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.status')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.salary')}</TableHead>
                <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-muted/50">
                  <TableCell className="text-foreground">{employee.lastName}</TableCell>
                  <TableCell className="text-foreground">{employee.firstName}</TableCell>
                  <TableCell className="text-foreground">{employee.email}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">€{employee.baseSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <Edit size={16} className="mr-2" />
                          {t('employees.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-muted">
                          <RotateCcw size={16} className="mr-2" />
                          {t('employees.reset')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:bg-muted">
                          <Trash2 size={16} className="mr-2" />
                          {t('employees.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
