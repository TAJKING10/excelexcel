import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { History, Loader2, User, Calendar, FileEdit } from 'lucide-react';
import { getPayslipEditHistory, type PayslipEditHistory } from '@/services/payslipEditHistory';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PayslipHistoryButtonProps {
  payslipId: string;
  payslipType: 'monthly' | 'annual';
}

export function PayslipHistoryButton({ payslipId, payslipType }: PayslipHistoryButtonProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<PayslipEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!payslipId) {
      console.warn('⚠️ No payslipId provided to PayslipHistoryButton');
      return;
    }

    console.log('🔍 Loading history for payslip:', payslipId, 'type:', payslipType);
    setIsLoading(true);
    setError(null);

    try {
      const data = await getPayslipEditHistory(payslipId, payslipType);
      console.log('✅ History loaded:', data.length, 'records');
      console.log('   Data:', data);
      setHistory(data);
    } catch (err: any) {
      console.error('❌ Failed to load edit history:', err);
      setError(err.message || 'Échec du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadHistory();
    }
  };

  const getEventType = (edit: PayslipEditHistory): string => {
    // If it's the first entry and has no old values, it's a creation
    const changedFields = edit.changes?.changedFields || [];
    if (changedFields.length === 0 && !edit.changes?.oldValues) {
      return 'Créé';
    }
    return 'Modifié';
  };

  const getEventBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'Créé':
        return 'default'; // Green
      case 'Modifié':
        return 'secondary'; // Yellow
      case 'Restauré':
        return 'outline'; // Blue
      default:
        return 'secondary';
    }
  };

  const formatChangedFields = (changedFields?: string[]) => {
    if (!changedFields || changedFields.length === 0) return <span className="text-muted-foreground text-sm">—</span>;

    const display = changedFields.slice(0, 5);
    const remaining = changedFields.length - display.length;

    return (
      <div className="flex flex-wrap gap-1">
        {display.map((field) => (
          <Badge key={field} variant="outline" className="text-xs font-mono">
            {field}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remaining} autres
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <History className="h-4 w-4" />
                Historique
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir l'historique des modifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="h-5 w-5" />
            Historique des Modifications
          </DialogTitle>
          <DialogDescription>
            Toutes les modifications apportées à cette fiche de paie
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Chargement de l'historique...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Erreur: {error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucun historique trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les modifications seront enregistrées ici
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {history.map((edit, index) => {
                  const eventType = getEventType(edit);
                  const isFirst = index === history.length - 1;

                  return (
                    <div
                      key={edit.id}
                      className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={getEventBadgeVariant(eventType)} className="font-medium">
                            {isFirst && eventType === 'Créé' ? '🟢' : eventType === 'Modifié' ? '🟡' : '🔵'} {eventType}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(edit.editedAt).toLocaleString('fr-LU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Europe/Luxembourg'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <User className="h-3.5 w-3.5" />
                            Utilisateur
                          </div>
                          <div className="ml-5">
                            <div className="font-medium text-sm">{edit.editorName}</div>
                            <div className="text-xs text-muted-foreground">{edit.editorEmail}</div>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2 text-sm font-medium mb-1">
                            <FileEdit className="h-3.5 w-3.5" />
                            Champs Modifiés
                          </div>
                          <div className="ml-5">
                            {formatChangedFields(edit.changes?.changedFields)}
                          </div>
                        </div>
                      </div>

                      {edit.comment && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium mb-1">💬 Commentaire</div>
                          <div className="text-sm text-muted-foreground ml-5 italic">
                            "{edit.comment}"
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Total des modifications: <span className="font-semibold text-foreground">{history.length}</span>
                  {history.length === 1 ? ' modification' : ' modifications'}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
