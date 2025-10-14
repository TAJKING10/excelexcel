import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CompanyAnalyticsProps {
  companyId: string;
}

export function CompanyAnalytics({ companyId }: CompanyAnalyticsProps) {
  const { t } = useLanguageStore();
  const { getCompanyAnalytics, annualPayslips } = useDataStore();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });

  // Get full analytics
  const fullAnalytics = getCompanyAnalytics(companyId);

  // Filter analytics based on date range
  const analytics = React.useMemo(() => {
    if (!dateRange.start || !dateRange.end) return fullAnalytics;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Filter months within date range
    const filteredNetVsGross = fullAnalytics.netVsGross.filter((item) => {
      const monthDate = new Date(item.month);
      return monthDate >= startDate && monthDate <= endDate;
    });

    const filteredContributions = fullAnalytics.contributions.filter((item) => {
      const monthDate = new Date(item.month);
      return monthDate >= startDate && monthDate <= endDate;
    });

    const filteredTaxes = fullAnalytics.taxes.filter((item) => {
      const monthDate = new Date(item.month);
      return monthDate >= startDate && monthDate <= endDate;
    });

    return {
      ...fullAnalytics,
      netVsGross: filteredNetVsGross,
      contributions: filteredContributions,
      taxes: filteredTaxes,
    };
  }, [fullAnalytics, dateRange]);

  const handleOpenPeriodDialog = () => {
    setTempDateRange(dateRange);
    setPeriodDialogOpen(true);
  };

  const handleApplyPeriod = () => {
    setDateRange(tempDateRange);
    setPeriodDialogOpen(false);
    toast({
      title: 'Période mise à jour',
      description: `Analyse de ${tempDateRange.start} à ${tempDateRange.end}`,
    });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Net vs Gross Sheet
    const netGrossData = analytics.netVsGross.map(item => ({
      'Mois': item.month,
      'Brut': item.gross,
      'Net': item.net
    }));
    const wsNetGross = XLSX.utils.json_to_sheet(netGrossData);
    XLSX.utils.book_append_sheet(wb, wsNetGross, 'Net vs Brut');

    // Contributions Sheet
    const contributionsData = analytics.contributions.map(item => ({
      'Mois': item.month,
      'Maladie': item.maladie,
      'Pension': item.pension,
      'Santé': item.sante,
      'Accident': item.accident
    }));
    const wsContributions = XLSX.utils.json_to_sheet(contributionsData);
    XLSX.utils.book_append_sheet(wb, wsContributions, 'Cotisations');

    // Taxes Sheet
    const taxesData = analytics.taxes.map(item => ({
      'Mois': item.month,
      'Montant': item.amount
    }));
    const wsTaxes = XLSX.utils.json_to_sheet(taxesData);
    XLSX.utils.book_append_sheet(wb, wsTaxes, 'Impôts');

    // Download
    const filename = `Analytique_${companyId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast({
      title: 'Export réussi',
      description: 'Les données analytiques ont été exportées en Excel',
    });
  };

  const handleExportCSV = () => {
    // Combine all data into CSV format
    let csv = 'NET VS BRUT\n';
    csv += 'Mois,Brut,Net\n';
    analytics.netVsGross.forEach(item => {
      csv += `${item.month},${item.gross},${item.net}\n`;
    });

    csv += '\n\nCOTISATIONS\n';
    csv += 'Mois,Maladie,Pension,Santé,Accident\n';
    analytics.contributions.forEach(item => {
      csv += `${item.month},${item.maladie},${item.pension},${item.sante},${item.accident}\n`;
    });

    csv += '\n\nIMPÔTS\n';
    csv += 'Mois,Montant\n';
    analytics.taxes.forEach(item => {
      csv += `${item.month},${item.amount}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Analytique_${companyId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export réussi',
      description: 'Les données analytiques ont été exportées en CSV',
    });
  };

  const handleExportPNG = async () => {
    try {
      const element = document.getElementById('analytics-container');
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Analytique_${companyId}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: 'Export réussi',
          description: 'Les graphiques ont été exportés en PNG',
        });
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'export en PNG',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (format: 'png' | 'csv' | 'excel') => {
    if (format === 'excel') {
      handleExportExcel();
    } else if (format === 'csv') {
      handleExportCSV();
    } else if (format === 'png') {
      handleExportPNG();
    }
  };

  return (
    <>
      <div className="space-y-6" id="analytics-container">
        {/* Filters and Export */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenPeriodDialog}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('analytics.selectPeriod')}
            </Button>
            {dateRange.start && dateRange.end && (
              <span className="text-sm text-muted-foreground">
                {dateRange.start} - {dateRange.end}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t('analytics.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('png')}>
                {t('analytics.exportPNG', 'Exporter en PNG')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                {t('analytics.exportCSV', 'Exporter en CSV')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                {t('analytics.exportExcel', 'Exporter en Excel')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Net vs Gross Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.netVsGross')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.netVsGross}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gross"
                  stroke="#3b82f6"
                  name={t('analytics.gross')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10b981"
                  name={t('analytics.net')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contributions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.contributions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.contributions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="maladie"
                  stackId="a"
                  fill="#3b82f6"
                  name={t('analytics.maladie')}
                />
                <Bar
                  dataKey="pension"
                  stackId="a"
                  fill="#8b5cf6"
                  name={t('analytics.pension')}
                />
                <Bar
                  dataKey="sante"
                  stackId="a"
                  fill="#10b981"
                  name={t('analytics.sante')}
                />
                <Bar
                  dataKey="accident"
                  stackId="a"
                  fill="#f59e0b"
                  name={t('analytics.accident')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taxes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.taxes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.taxes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="amount"
                  fill="#ef4444"
                  name={t('analytics.taxAmount')}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Period Selection Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sélectionner une période</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={tempDateRange.start}
                onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={tempDateRange.end}
                onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleApplyPeriod}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}