import { create } from 'zustand';
import { taxRateService, type TaxRate as TaxRateDB, type TaxRateHistory as TaxRateHistoryDB } from '@/services/supabase';

// Re-export types for convenience
export type TaxRate = TaxRateDB;
export type TaxRateHistory = TaxRateHistoryDB;

interface TaxRatesState {
  taxRates: TaxRate[];
  history: TaxRateHistory[];
  isLoading: boolean;
  error: string | null;

  // Data loading
  loadTaxRates: () => Promise<void>;
  loadHistory: () => Promise<void>;

  // Actions
  addTaxRate: (rate: { rate: number; effectiveFrom: string; notes?: string; createdBy: string }) => Promise<void>;
  setDefaultTaxRate: (id: string, performedBy: string) => Promise<void>;
  revertToRate: (id: string, performedBy: string) => Promise<void>;
  deleteTaxRate: (id: string, performedBy: string) => Promise<void>;

  // Getters
  getActiveTaxRate: () => TaxRate | undefined;
  getTaxRateById: (id: string) => TaxRate | undefined;
  getHistoryForRate: (id: string) => TaxRateHistory[];
  getTaxRateForDate: (date: string) => TaxRate | undefined;
}

export const useTaxRatesStore = create<TaxRatesState>((set, get) => ({
  taxRates: [],
  history: [],
  isLoading: false,
  error: null,

  loadTaxRates: async () => {
    try {
      set({ isLoading: true, error: null });
      const rates = await taxRateService.getAll();
      set({ taxRates: rates, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load tax rates', isLoading: false, taxRates: [] });
    }
  },

  loadHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      const history = await taxRateService.getHistory();
      set({ history, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load tax history', isLoading: false });
    }
  },

  addTaxRate: async (rateData) => {
    try {
      set({ isLoading: true, error: null });

      // Create new tax rate (backend will handle archiving old ones)
      const newRate = await taxRateService.create(rateData);

      // Reload data to get updated status
      await get().loadTaxRates();
      await get().loadHistory();

      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to add tax rate', isLoading: false });
      throw error;
    }
  },

  setDefaultTaxRate: async (id, performedBy) => {
    try {
      set({ isLoading: true, error: null });

      // Activate the tax rate (backend will handle archiving others)
      await taxRateService.activate(id, performedBy);

      // Reload data
      await get().loadTaxRates();
      await get().loadHistory();

      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to set default tax rate', isLoading: false });
      throw error;
    }
  },

  revertToRate: async (id, performedBy) => {
    try {
      set({ isLoading: true, error: null });

      // Revert to old rate (creates new rate with old percentage)
      await taxRateService.revertTo(id, performedBy);

      // Reload data
      await get().loadTaxRates();
      await get().loadHistory();

      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to revert tax rate', isLoading: false });
      throw error;
    }
  },

  deleteTaxRate: async (id, performedBy) => {
    try {
      set({ isLoading: true, error: null });

      // Delete the tax rate
      await taxRateService.delete(id, performedBy);

      // Reload data
      await get().loadTaxRates();
      await get().loadHistory();

      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to delete tax rate', isLoading: false });
      throw error;
    }
  },

  getActiveTaxRate: () => {
    // Find the active tax rate (only one can be active at a time)
    const activeRate = get().taxRates.find(r => r.status === 'active');
    return activeRate;
  },

  getTaxRateById: (id) => {
    return get().taxRates.find(r => r.id === id);
  },

  getHistoryForRate: (id) => {
    return get().history.filter(h => h.taxRateId === id);
  },

  getTaxRateForDate: (date) => {
    // Find the tax rate that was effective on the given date
    const targetDate = new Date(date);
    const rates = get().taxRates
      .filter(r => new Date(r.effectiveFrom) <= targetDate)
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

    return rates[0]; // Return the most recent rate before or on the target date
  }
}));
