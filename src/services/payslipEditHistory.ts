import { supabase } from '@/lib/supabase';

export interface PayslipEditHistory {
  id: string;
  payslipId: string;
  payslipType: 'monthly' | 'annual';
  editedBy: string;
  editedAt: string;
  changes?: {
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
  };
  comment?: string;
  // Joined fields
  editorName?: string;
  editorEmail?: string;
}

/**
 * Record an edit to a payslip
 */
export async function recordPayslipEdit(
  payslipId: string,
  payslipType: 'monthly' | 'annual',
  oldValues: any,
  newValues: any,
  comment?: string
): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    throw new Error('User not authenticated');
  }
  // Calculate changed fields
  const changedFields: string[] = [];
  if (oldValues && newValues) {
    Object.keys(newValues).forEach(key => {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key);
      }
    });
  }
  const recordToInsert = {
    payslip_id: payslipId,
    payslip_type: payslipType,
    edited_by: user.id,
    edited_at: new Date().toISOString(),
    changes: {
      oldValues,
      newValues,
      changedFields,
    },
    comment: comment || null,
  };
  const { error } = await supabase.from('payslip_edit_history').insert(recordToInsert);

  if (error) {
    throw error;
  }
}

/**
 * Get edit history for a payslip
 */
export async function getPayslipEditHistory(
  payslipId: string,
  payslipType: 'monthly' | 'annual'
): Promise<PayslipEditHistory[]> {
  const { data, error } = await supabase
    .from('payslip_edit_history')
    .select(`
      *,
      profiles:edited_by (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('payslip_id', payslipId)
    .eq('payslip_type', payslipType)
    .order('edited_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data || []).map((item: any) => ({
    id: item.id,
    payslipId: item.payslip_id,
    payslipType: item.payslip_type,
    editedBy: item.edited_by,
    editedAt: item.edited_at,
    changes: item.changes,
    comment: item.comment,
    editorName: item.profiles
      ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim()
      : 'Unknown',
    editorEmail: item.profiles?.email || '',
  }));
}

/**
 * Get all edit history for a user
 */
export async function getUserEditHistory(
  userId: string,
  limit: number = 50
): Promise<PayslipEditHistory[]> {
  const { data, error } = await supabase
    .from('payslip_edit_history')
    .select(`
      *,
      profiles:edited_by (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('edited_by', userId)
    .order('edited_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    payslipId: item.payslip_id,
    payslipType: item.payslip_type,
    editedBy: item.edited_by,
    editedAt: item.edited_at,
    changes: item.changes,
    comment: item.comment,
    editorName: item.profiles
      ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim()
      : 'Unknown',
    editorEmail: item.profiles?.email || '',
  }));
}
