import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/language'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
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
import { Plus, FileText, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import type { Individual } from '@/types'

export function IndividualList() {
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { individuals, addIndividual, updateIndividual, deleteIndividual } = useDataStore()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: 'Luxembourg',
    currency: 'EUR',
    status: 'active' as 'active' | 'terminated',
  })

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      country: 'Luxembourg',
      currency: 'EUR',
      status: 'active',
    })
  }

  const handleAdd = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: 'Error', description: 'Name fields are required', variant: 'destructive' })
      return
    }
    addIndividual(form)
    toast({ title: 'Success', description: 'Individual created successfully' })
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (!editingIndividual) return
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: 'Error', description: 'Name fields are required', variant: 'destructive' })
      return
    }
    updateIndividual(editingIndividual.id, form)
    toast({ title: 'Success', description: 'Individual updated successfully' })
    resetForm()
    setEditingIndividual(null)
    setIsEditDialogOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteIndividual(id)
      toast({ title: 'Success', description: 'Individual deleted successfully' })
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
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">{t('individuals.title')}</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} className="mr-2" />
          {t('individuals.create')}
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('individuals.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {individuals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('dashboard.noIndividualsYet')}</p>
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
                {individuals.map((individual) => (
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
                          onClick={() => navigate(user?.role === 'SUPER_ADMIN' ? `/admin/individuals/${individual.id}` : `/individuals/${individual.id}`)}
                        >
                          <Eye size={16} className="mr-2" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(user?.role === 'SUPER_ADMIN' ? `/admin/individuals/${individual.id}` : `/individuals/${individual.id}`)}>
                              <FileText size={16} className="mr-2" />
                              {t('payslips.create')}
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
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleAdd}>{t('common.save') || 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Individual Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('individuals.edit') || 'Edit Individual'}</DialogTitle>
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
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgium">Belgium</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingIndividual(null); resetForm(); }}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleEdit}>{t('common.save') || 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
