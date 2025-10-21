import React from 'react';
import { useTaxRatesStore, TaxRate } from '../../store/taxRatesStore';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Info, CheckCircle, Archive } from 'lucide-react';
import { format } from 'date-fns';

interface TaxRateSelectorProps {
  value?: string; // Tax rate ID
  onChange: (taxRateId: string, taxRate: TaxRate) => void;
  disabled?: boolean;
  className?: string;
}

export function TaxRateSelector({ value, onChange, disabled, className }: TaxRateSelectorProps) {
  const { taxRates, getActiveTaxRate, getTaxRateById } = useTaxRatesStore();

  // Sort: active default first, then by effective date descending
  const sortedRates = [...taxRates].sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
  });

  const activeTaxRate = getActiveTaxRate();
  const selectedValue = value || activeTaxRate?.id || '';

  const handleValueChange = (newValue: string) => {
    const selectedRate = getTaxRateById(newValue);
    if (selectedRate) {
      onChange(newValue, selectedRate);
    }
  };

  return (
    <div className={className}>
      <Select
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select tax rate..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1">
              <Info className="h-3 w-3" />
              Available Tax Rates
            </SelectLabel>
            {sortedRates.map((rate) => {
              const isActive = rate.status === 'active';
              const isDefault = rate.isDefault;

              return (
                <SelectItem
                  key={rate.id}
                  value={rate.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{rate.rate}%</span>
                      {isDefault && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {rate.status === 'archived' && (
                        <Archive className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                      {!isDefault && isActive && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      )}
                      {rate.status === 'archived' && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          Archived
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rate.effectiveFrom), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Info text */}
      <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          Tax rate selected will be saved with this payslip and won't change even if rates are updated later.
        </span>
      </p>
    </div>
  );
}
