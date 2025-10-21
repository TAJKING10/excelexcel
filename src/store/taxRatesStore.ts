import { create } from 'zustand';

export interface TaxRate {
  id: string;
  rate: number; // e.g., 21 for 21%
  effectiveFrom: string; // ISO date string
  status: 'active' | 'archived';
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

interface TaxRateHistory {
  id: string;
  taxRateId: string;
  action: 'created' | 'activated' | 'archived' | 'reverted';
  performedBy: string;
  performedAt: string;
  previousRate?: number;
  newRate: number;
  notes?: string;
}

interface TaxRatesState {
  taxRates: TaxRate[];
  history: TaxRateHistory[];

  // Actions
  addTaxRate: (rate: Omit<TaxRate, 'id' | 'createdAt' | 'status' | 'isDefault'>) => void;
  setDefaultTaxRate: (id: string) => void;
  archiveTaxRate: (id: string) => void;
  revertToRate: (id: string, performedBy: string) => void;
  getActiveTaxRate: () => TaxRate | undefined;
  getTaxRateById: (id: string) => TaxRate | undefined;
  getHistoryForRate: (id: string) => TaxRateHistory[];
}

export const useTaxRatesStore = create<TaxRatesState>((set, get) => ({
  taxRates: [
    // Initialize with a default rate
    {
      id: 'default-rate-1',
      rate: 21.0,
      effectiveFrom: '2025-10-01',
      status: 'active',
      isDefault: true,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      notes: 'Initial default tax rate'
    }
  ],
  history: [
    {
      id: 'history-1',
      taxRateId: 'default-rate-1',
      action: 'created',
      performedBy: 'system',
      performedAt: new Date().toISOString(),
      newRate: 21.0,
      notes: 'System initialization'
    }
  ],

  addTaxRate: (rateData) => {
    const newRate: TaxRate = {
      ...rateData,
      id: `tax-rate-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      isDefault: true, // New rate becomes default
    };

    const historyEntry: TaxRateHistory = {
      id: `history-${Date.now()}`,
      taxRateId: newRate.id,
      action: 'created',
      performedBy: rateData.createdBy,
      performedAt: new Date().toISOString(),
      newRate: rateData.rate,
      notes: rateData.notes
    };

    set(state => ({
      taxRates: [
        ...state.taxRates.map(r => ({ ...r, isDefault: false })), // Unset previous defaults
        newRate
      ],
      history: [...state.history, historyEntry]
    }));
  },

  setDefaultTaxRate: (id) => {
    const targetRate = get().taxRates.find(r => r.id === id);
    if (!targetRate) return;

    const historyEntry: TaxRateHistory = {
      id: `history-${Date.now()}`,
      taxRateId: id,
      action: 'activated',
      performedBy: 'admin', // TODO: Get from auth context
      performedAt: new Date().toISOString(),
      newRate: targetRate.rate,
      notes: `Set as default tax rate`
    };

    set(state => ({
      taxRates: state.taxRates.map(r => ({
        ...r,
        isDefault: r.id === id,
        status: r.id === id ? 'active' : r.status
      })),
      history: [...state.history, historyEntry]
    }));
  },

  archiveTaxRate: (id) => {
    const targetRate = get().taxRates.find(r => r.id === id);
    if (!targetRate || targetRate.isDefault) {
      console.error('Cannot archive default rate');
      return;
    }

    const historyEntry: TaxRateHistory = {
      id: `history-${Date.now()}`,
      taxRateId: id,
      action: 'archived',
      performedBy: 'admin',
      performedAt: new Date().toISOString(),
      newRate: targetRate.rate,
      notes: 'Tax rate archived'
    };

    set(state => ({
      taxRates: state.taxRates.map(r =>
        r.id === id ? { ...r, status: 'archived', isDefault: false } : r
      ),
      history: [...state.history, historyEntry]
    }));
  },

  revertToRate: (id, performedBy) => {
    const targetRate = get().taxRates.find(r => r.id === id);
    if (!targetRate) return;

    const currentDefault = get().getActiveTaxRate();

    // Create new rate based on old one
    const revertedRate: TaxRate = {
      id: `tax-rate-${Date.now()}`,
      rate: targetRate.rate,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'active',
      isDefault: true,
      createdAt: new Date().toISOString(),
      createdBy: performedBy,
      notes: `Reverted from rate ${targetRate.id} (${targetRate.rate}%)`
    };

    const historyEntry: TaxRateHistory = {
      id: `history-${Date.now()}`,
      taxRateId: revertedRate.id,
      action: 'reverted',
      performedBy,
      performedAt: new Date().toISOString(),
      previousRate: currentDefault?.rate,
      newRate: targetRate.rate,
      notes: `Reverted to ${targetRate.rate}% from ${currentDefault?.rate}%`
    };

    set(state => ({
      taxRates: [
        ...state.taxRates.map(r => ({ ...r, isDefault: false })),
        revertedRate
      ],
      history: [...state.history, historyEntry]
    }));
  },

  getActiveTaxRate: () => {
    return get().taxRates.find(r => r.isDefault && r.status === 'active');
  },

  getTaxRateById: (id) => {
    return get().taxRates.find(r => r.id === id);
  },

  getHistoryForRate: (id) => {
    return get().history.filter(h => h.taxRateId === id);
  }
}));
