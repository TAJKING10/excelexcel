import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPayslipEditHistory, type PayslipEditHistory } from '@/services/payslipEditHistory';
import { History, User, Calendar, FileEdit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PayslipEditHistoryProps {
  payslipId: string;
  payslipType: 'monthly' | 'annual';
}

export function PayslipEditHistoryComponent({ payslipId, payslipType }: PayslipEditHistoryProps) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<PayslipEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!payslipId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getPayslipEditHistory(payslipId, payslipType);
        setHistory(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load edit history');
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [payslipId, payslipType]);

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Edit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading edit history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Edit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Edit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No edits recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const formatChangedFields = (changedFields?: string[]) => {
    if (!changedFields || changedFields.length === 0) return 'No specific fields tracked';

    // Limit to first 5 fields
    const display = changedFields.slice(0, 5);
    const remaining = changedFields.length - display.length;

    return (
      <div className="flex flex-wrap gap-1">
        {display.map((field) => (
          <Badge key={field} variant="secondary" className="text-xs">
            {field}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remaining} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Edit History
          <Badge variant="outline" className="ml-2">
            {history.length} {history.length === 1 ? 'edit' : 'edits'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Edited By
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4" />
                    Changed Fields
                  </div>
                </TableHead>
                <TableHead className="max-w-[300px]">Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((edit) => (
                <TableRow key={edit.id}>
                  <TableCell className="font-medium">
                    {new Date(edit.editedAt).toLocaleString('fr-LU', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{edit.editorName}</div>
                      <div className="text-sm text-muted-foreground">{edit.editorEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatChangedFields(edit.changes?.changedFields)}
                  </TableCell>
                  <TableCell className="max-w-[300px] text-sm text-muted-foreground">
                    {edit.comment || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
