import React, { useState } from 'react';
import { useDataStore } from '@/stores/data';
import { useLanguageStore } from '@/stores/language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Search } from 'lucide-react';
import { ActivityLog } from '@/types';

export function ActivityLogViewer() {
  const { t } = useLanguageStore();
  const { getActivityLogs, users } = useDataStore();
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get filtered logs
  const logs = getActivityLogs({
    userId: selectedUserId !== 'all' ? selectedUserId : undefined,
    entityType: selectedEntityType !== 'all' ? selectedEntityType : undefined,
    limit: 100,
  });

  // Apply search filter
  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.username.toLowerCase().includes(searchLower) ||
      log.entityName?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower)
    );
  });

  const getEntityTypeBadgeColor = (entityType: string) => {
    switch (entityType) {
      case 'payslip':
        return 'default';
      case 'employee':
        return 'secondary';
      case 'company':
        return 'outline';
      case 'individual':
        return 'destructive';
      case 'user':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Activity className="mr-3 h-8 w-8" />
          {t('activity.title', 'Activity Log')}
        </h1>
        <p className="text-muted-foreground">{t('activity.subtitle', 'Track all user actions and system events')}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.filters', 'Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-filter">{t('users.user', 'User')}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('activity.allUsers', 'All Users')}</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} (@{user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-filter">{t('activity.entityType', 'Entity Type')}</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger id="entity-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('activity.allTypes', 'All Types')}</SelectItem>
                  <SelectItem value="payslip">{t('nav.payslips', 'Payslips')}</SelectItem>
                  <SelectItem value="employee">{t('nav.employees', 'Employees')}</SelectItem>
                  <SelectItem value="company">{t('nav.companies', 'Companies')}</SelectItem>
                  <SelectItem value="individual">{t('nav.individuals', 'Individuals')}</SelectItem>
                  <SelectItem value="user">{t('activity.users', 'Users')}</SelectItem>
                  <SelectItem value="other">{t('activity.other', 'Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">{t('common.search', 'Search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('activity.searchPlaceholder', 'Search actions, details...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('activity.recentActivity', 'Recent Activity')} ({filteredLogs.length} {t('activity.entries', 'entries')})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('activity.timestamp', 'Timestamp')}</TableHead>
                  <TableHead>{t('users.user', 'User')}</TableHead>
                  <TableHead>{t('activity.action', 'Action')}</TableHead>
                  <TableHead>{t('activity.entityType', 'Entity Type')}</TableHead>
                  <TableHead>{t('activity.entity', 'Entity')}</TableHead>
                  <TableHead>{t('activity.details', 'Details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t('activity.noLogs', 'No activity logs found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium">{log.username}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{log.action}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEntityTypeBadgeColor(log.entityType)}>
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entityName || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                        {log.details || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
