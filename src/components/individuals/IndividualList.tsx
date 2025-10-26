import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Plus, FileText, MoreHorizontal, Edit, Trash2, Eye, FileSpreadsheet, Search } from 'lucide-react'
import type { Individual } from '@/types'

export function IndividualList() {
  const { t } = useLanguageStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { individuals, addIndividual, updateIndividual, deleteIndividual } = useDataStore()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter individuals based on user role and access
  const accessibleIndividuals = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      return individuals
    }

    // Employee - filter by access
    if (user?.role === 'EMPLOYEE' && user.access) {
      // If user has access to all individuals, return all
      if (user.access.hasAllIndividualsAccess) {
        return individuals
      }
      // Otherwise filter by specific individual IDs
      return individuals.filter(i => user.access?.individualIds?.includes(i.id))
    }

    return []
  }, [individuals, user])

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Luxembourg',
    currency: 'EUR',
    status: 'active' as 'active' | 'terminated',
    baseSalary: 0,
    taxClass: 2,
    matricule: '',
    address: '',
  })

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      country: 'Luxembourg',
      currency: 'EUR',
      status: 'active',
      baseSalary: 0,
      taxClass: 2,
      matricule: '',
      address: '',
    })
  }

  const handleAdd = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: t('common.error'), description: t('individuals.nameRequired'), variant: 'destructive' })
      return
    }
    try {
      await addIndividual(form)
      toast({ title: t('common.success'), description: t('individuals.createdSuccess') })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('individuals.addFailed'), variant: 'destructive' })
    }
  }

  const handleEdit = async () => {
    if (!editingIndividual) return
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: t('common.error'), description: t('individuals.nameRequired'), variant: 'destructive' })
      return
    }
    try {
      await updateIndividual(editingIndividual.id, form)
      toast({ title: t('common.success'), description: t('common.update') })
      resetForm()
      setEditingIndividual(null)
      setIsEditDialogOpen(false)
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message || t('individuals.updateFailed'), variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(t('individuals.confirmDelete', { name }))) {
      try {
        await deleteIndividual(id)
        toast({ title: t('common.success'), description: t('actions.delete') })
      } catch (error: any) {
        toast({ title: t('common.error'), description: error.message || t('individuals.deleteFailed'), variant: 'destructive' })
      }
    }
  }

  const openEditDialog = (individual: Individual) => {
    setEditingIndividual(individual)
    setForm({
      firstName: individual.firstName,
      lastName: individual.lastName,
      email: individual.email,
      country: individual.country,
      currency: individual.currency,
      status: individual.status,
      baseSalary: individual.baseSalary || 0,
      taxClass: individual.taxClass || 2,
      matricule: individual.matricule || '',
      address: individual.address || '',
    })
    setIsEditDialogOpen(true)
  }

  const filteredIndividuals = accessibleIndividuals.filter((individual) => {
    const fullName = `${individual.firstName} ${individual.lastName}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const canCreateIndividuals = user?.role === 'SUPER_ADMIN' || user?.access?.canCreateIndividuals

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">{t('individuals.title')}</h2>
        {canCreateIndividuals && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={16} className="mr-2" />
            {t('individuals.create')}
          </Button>
        )}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">{t('individuals.title')}</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder={t('common.searchByName')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIndividuals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? t('individuals.noIndividualsFound') : t('dashboard.noIndividualsYet')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">{t('employees.name')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.firstname')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.email')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('companies.country')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.status')}</TableHead>
                  <TableHead className="text-muted-foreground">{t('employees.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndividuals.map((individual) => (
                  <TableRow key={individual.id} className="hover:bg-muted/50">
                    <TableCell className="text-foreground">{individual.lastName}</TableCell>
                    <TableCell className="text-foreground">{individual.firstName}</TableCell>
                    <TableCell className="text-foreground">{individual.email}</TableCell>
                    <TableCell className="text-foreground">{individual.country}</TableCell>
                    <TableCell>
                      <Badge variant={individual.status === 'active' ? 'default' : 'secondary'}>
                        {individual.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/individuals/${individual.id}/monthly-payslip`)}
                        >
                          <FileText size={16} className="mr-2" />
                          Fiche de Paie Mensuelle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/individuals/${individual.id}/annual-payslip`)}
                        >
                          <FileSpreadsheet size={16} className="mr-2" />
                          Fiche de Paie Annuelle
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/individuals/${individual.id}`)}>
                              <Eye size={16} className="mr-2" />
                              {t('employees.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(individual)}>
                              <Edit size={16} className="mr-2" />
                              {t('employees.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(individual.id, `${individual.firstName} ${individual.lastName}`)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              {t('employees.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Individual Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('individuals.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-firstName">{t('employees.firstname')}</Label>
              <Input
                id="add-firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="add-lastName">{t('employees.name')}</Label>
              <Input
                id="add-lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="add-email">{t('employees.email')}</Label>
              <Input
                id="add-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="add-country">{t('companies.country')}</Label>
              <Select value={form.country} onValueChange={(value) => setForm({ ...form, country: value })}>
                <SelectTrigger id="add-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luxembourg">{t('countries.luxembourg')}</SelectItem>
                  <SelectItem value="France">{t('countries.france')}</SelectItem>
                  <SelectItem value="Belgium">{t('countries.belgium')}</SelectItem>
                  <SelectItem value="Germany">{t('countries.germany')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-currency">{t('companies.currency')}</Label>
              <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                <SelectTrigger id="add-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-status">{t('employees.status')}</Label>
              <Select value={form.status} onValueChange={(value: 'active' | 'terminated') => setForm({ ...form, status: value })}>
                <SelectTrigger id="add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('common.active')}</SelectItem>
                  <SelectItem value="terminated">{t('employees.terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-baseSalary">{t('employees.baseSalaryMonthly')}</Label>
              <Input
                id="add-baseSalary"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })}
                placeholder="5500"
              />
            </div>
            <div>
              <Label htmlFor="add-taxClass">{t('employees.taxClass')}</Label>
              <Select value={String(form.taxClass)} onValueChange={(value) => setForm({ ...form, taxClass: parseInt(value) })}>
                <SelectTrigger id="add-taxClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('employees.class')} 1</SelectItem>
                  <SelectItem value="1a">{t('employees.class')} 1a</SelectItem>
                  <SelectItem value="2">{t('employees.class')} 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-matricule">{t('employees.matricule')} ({t('common.optional')})</Label>
              <Input
                id="add-matricule"
                value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                placeholder="1989 11 24 004 47"
              />
            </div>
            <div>
              <Label htmlFor="add-address">{t('employees.address')} ({t('common.optional')})</Label>
              <Input
                id="add-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="52, Grand-Rue"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdd}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Individual Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('individuals.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-firstName">{t('employees.firstname')}</Label>
              <Input
                id="edit-firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">{t('employees.name')}</Label>
              <Input
                id="edit-lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">{t('employees.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-country">{t('companies.country')}</Label>
              <Select value={form.country} onValueChange={(value) => setForm({ ...form, country: value })}>
                <SelectTrigger id="edit-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luxembourg">{t('countries.luxembourg')}</SelectItem>
                  <SelectItem value="France">{t('countries.france')}</SelectItem>
                  <SelectItem value="Belgium">{t('countries.belgium')}</SelectItem>
                  <SelectItem value="Germany">{t('countries.germany')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-currency">{t('companies.currency')}</Label>
              <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                <SelectTrigger id="edit-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">{t('employees.status')}</Label>
              <Select value={form.status} onValueChange={(value: 'active' | 'terminated') => setForm({ ...form, status: value })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('common.active')}</SelectItem>
                  <SelectItem value="terminated">{t('employees.terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-baseSalary">{t('employees.baseSalaryMonthly')}</Label>
              <Input
                id="edit-baseSalary"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })}
                placeholder="5500"
              />
            </div>
            <div>
              <Label htmlFor="edit-taxClass">{t('employees.taxClass')}</Label>
              <Select value={String(form.taxClass)} onValueChange={(value) => setForm({ ...form, taxClass: parseInt(value) })}>
                <SelectTrigger id="edit-taxClass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('employees.class')} 1</SelectItem>
                  <SelectItem value="1a">{t('employees.class')} 1a</SelectItem>
                  <SelectItem value="2">{t('employees.class')} 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-matricule">{t('employees.matricule')} ({t('common.optional')})</Label>
              <Input
                id="edit-matricule"
                value={form.matricule}
                onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                placeholder="1989 11 24 004 47"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">{t('employees.address')} ({t('common.optional')})</Label>
              <Input
                id="edit-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="52, Grand-Rue"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingIndividual(null); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEdit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
