import React, { useState } from 'react';
import { useLanguageStore } from '@/stores/language';
import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Calendar } from 'lucide-react';
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
  const { getCompanyAnalytics } = useDataStore();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const analytics = getCompanyAnalytics(companyId);

  const handleExport = (format: 'png' | 'csv' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {t('analytics.selectPeriod')}
          </Button>
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
              {t('analytics.exportPNG')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              {t('analytics.exportCSV')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              {t('analytics.exportExcel')}
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
  );
}