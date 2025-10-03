import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Download, FileSpreadsheet, Edit, Trash2, Eye, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PayslipEditor } from './PayslipEditor'
import { Payslip } from '@/types'

export function PayslipList() {
  const navigate = useNavigate()
  const { t } = useLanguageStore()
  const { payslips, employees, companies, updatePayslip, deletePayslip } = useDataStore()
  const { user } = useAuthStore()
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [filterCompanyId, setFilterCompanyId] = useState<string>('all')
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all')

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return 'Individual'
    const employee = employees.find(e => e.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown'
  }

  // Check user permissions
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.access?.canEditPayslips
  const canDelete = user?.role === 'SUPER_ADMIN' || user?.access?.canDeletePayslips
  const canView = user?.role === 'SUPER_ADMIN' || user?.access?.canViewPayslips

  // Filter employees based on company filter (for employee dropdown)
  const availableEmployees = filterCompanyId !== 'all'
    ? employees.filter(e => e.companyId === filterCompanyId)
    : employees

  // Filter payslips based on user access and filters
  const filteredPayslips = payslips.filter((payslip) => {
    // Role-based access control
    if (user?.role === 'SUPER_ADMIN') {
      // SuperAdmin sees all
    } else if (user?.role === 'EMPLOYEE' && user?.access) {
      // Employee - check access to companies or individuals
      const hasAccess = user.access.companyIds.includes(payslip.companyId) ||
                       user.access.individualIds.includes(payslip.employeeId)
      if (!hasAccess) return false
    } else {
      return false
    }

    // Company filter
    if (filterCompanyId !== 'all' && payslip.companyId !== filterCompanyId) {
      return false
    }

    // Employee filter
    if (filterEmployeeId !== 'all' && payslip.employeeId !== filterEmployeeId) {
      return false
    }

    return true
  })

  const handleEdit = (payslip: Payslip) => {
    setSelectedPayslip(payslip)
    setIsEditorOpen(true)
  }

  const handleSave = (updatedPayslip: Payslip) => {
    updatePayslip(updatedPayslip.id, updatedPayslip)
    setIsEditorOpen(false)
    setSelectedPayslip(null)
  }

  const handleDelete = (payslipId: string) => {
    if (confirm('Are you sure you want to delete this payslip?')) {
      deletePayslip(payslipId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('payslips.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPayslips.length} payslip(s) •
            {canEdit && ' Can Edit • '}
            {canDelete && ' Can Delete'}
          </p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              navigate('/admin/payslips/create');
            }}
          >
            <Plus size={16} className="mr-2" />
            {t('payslips.create')}
          </Button>
        )}
      </div>

      {/* Filters */}
      {user?.role === 'SUPER_ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={18} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user?.role === 'SUPER_ADMIN' && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select value={filterCompanyId} onValueChange={(val) => {
                    setFilterCompanyId(val)
                    setFilterEmployeeId('all') // Reset employee filter when company changes
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {availableEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('payslips.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payslips found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">{t('payslips.period')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('payslips.employee')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('payslips.company')}</TableHead>
                  <TableHead className="text-muted-foreground">Gross</TableHead>
                  <TableHead className="text-muted-foreground">Net Pay</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id} className="hover:bg-muted/50">
                    <TableCell className="text-foreground">
                      {payslip.period.month}/{payslip.period.year}
                    </TableCell>
                    <TableCell className="text-foreground">{getEmployeeName(payslip.employeeId)}</TableCell>
                    <TableCell className="text-foreground">{getCompanyName(payslip.companyId)}</TableCell>
                    <TableCell className="text-foreground">
                      €{payslip.earnings.grossMonthly.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <Badge variant="default">€{payslip.netPay.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {canView && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(payslip)}
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(payslip)}
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(payslip.id)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
                          <Download size={16} className="mr-1" />
                          PDF
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

      {/* Payslip Editor Dialog */}
      {selectedPayslip && (
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <PayslipEditor
              payslip={selectedPayslip}
              onSave={handleSave}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
