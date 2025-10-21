import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaxRatesStore } from '../../store/taxRatesStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Plus, History, CheckCircle, Archive, RotateCcw, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function TaxManagement() {
  const { t } = useTranslation();
  const {
    taxRates,
    history,
    addTaxRate,
    setDefaultTaxRate,
    archiveTaxRate,
    revertToRate,
    getActiveTaxRate
  } = useTaxRatesStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    rate: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const activeTaxRate = getActiveTaxRate();

  const handleAddRate = () => {
    if (!newRate.rate || parseFloat(newRate.rate) <= 0) {
      alert('Please enter a valid tax rate');
      return;
    }

    addTaxRate({
      rate: parseFloat(newRate.rate),
      effectiveFrom: newRate.effectiveFrom,
      createdBy: 'admin', // TODO: Get from auth context
      notes: newRate.notes
    });

    setNewRate({ rate: '', effectiveFrom: new Date().toISOString().split('T')[0], notes: '' });
    setIsAddDialogOpen(false);
  };

  const handleRevert = (rateId: string) => {
    if (confirm('Are you sure you want to revert to this tax rate?')) {
      revertToRate(rateId, 'admin'); // TODO: Get from auth context
    }
  };

  const sortedRates = [...taxRates].sort((a, b) =>
    new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  );

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Rate Management</h1>
          <p className="text-muted-foreground mt-1">
            Centralized tax rate configuration for all payslips
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tax Rate Change History</DialogTitle>
                <DialogDescription>
                  Complete audit trail of all tax rate changes
                </DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistory.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {format(new Date(entry.performedAt), 'PPp')}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.action === 'created' ? 'bg-green-100 text-green-800' :
                          entry.action === 'activated' ? 'bg-blue-100 text-blue-800' :
                          entry.action === 'archived' ? 'bg-gray-100 text-gray-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {entry.action.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {entry.previousRate && `${entry.previousRate}% → `}
                        {entry.newRate}%
                      </TableCell>
                      <TableCell className="text-sm">{entry.performedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Tax Rate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Tax Rate</DialogTitle>
                <DialogDescription>
                  This will become the new default tax rate for all new payslips
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Tax Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="21.00"
                    value={newRate.rate}
                    onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveFrom">Effective From</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={newRate.effectiveFrom}
                    onChange={(e) => setNewRate({ ...newRate, effectiveFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Reason for this rate change..."
                    value={newRate.notes}
                    onChange={(e) => setNewRate({ ...newRate, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRate}>
                  Add Tax Rate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Current Active Rate Card */}
      {activeTaxRate && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50/50 dark:bg-green-950/30">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Current Active Tax Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rate</p>
                <p className="text-3xl font-bold text-green-600">{activeTaxRate.rate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Effective From
                </p>
                <p className="text-lg font-semibold">
                  {format(new Date(activeTaxRate.effectiveFrom), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Created By
                </p>
                <p className="text-lg font-semibold">{activeTaxRate.createdBy}</p>
              </div>
            </div>
            {activeTaxRate.notes && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Notes:</p>
                <p className="text-sm mt-1">{activeTaxRate.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Tax Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tax Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rate</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell className="font-bold text-lg">
                    {rate.rate}%
                  </TableCell>
                  <TableCell>
                    {format(new Date(rate.effectiveFrom), 'PPP')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rate.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Default
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rate.status === 'active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      }`}>
                        {rate.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(rate.createdAt), 'PPp')}
                  </TableCell>
                  <TableCell>{rate.createdBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {rate.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!rate.isDefault && rate.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDefaultTaxRate(rate.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      {!rate.isDefault && rate.status === 'archived' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(rate.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Revert to This
                        </Button>
                      )}
                      {!rate.isDefault && rate.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => archiveTaxRate(rate.id)}
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
