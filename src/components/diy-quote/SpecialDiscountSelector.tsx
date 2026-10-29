import { useState, memo } from 'react';
import { 
  BadgePercent, 
  Rocket, 
  Handshake, 
  KeyRound,
  Lock,
  Check,
  AlertCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { SliderWithArrows } from '@/components/ui/slider-with-arrows';
import { cn } from '@/lib/utils';
import { specialSalesDiscounts, SpecialSalesDiscount } from '@/lib/pricingEngine';

interface SpecialDiscountSelectorProps {
  value: string;
  customPercent: number;
  onChange: (discountId: string) => void;
  onCustomPercentChange: (percent: number) => void;
  hideHeader?: boolean;
}

const discountIcons: Record<string, React.ElementType> = {
  'none': BadgePercent,
  'new-market': Rocket,
  'gtm-strategic': Handshake,
  'ceo-approval': KeyRound,
};

const CEO_PASSWORD = 'alfred2025';

export const SpecialDiscountSelector = memo(function SpecialDiscountSelector({
  value,
  customPercent,
  onChange,
  onCustomPercentChange,
  hideHeader = false,
}: SpecialDiscountSelectorProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);

  const selectedDiscount = specialSalesDiscounts.find(d => d.id === value) || specialSalesDiscounts[0];
  const isCeoApproval = value === 'ceo-approval';

  const handlePasswordSubmit = () => {
    if (passwordInput === CEO_PASSWORD) {
      setPasswordVerified(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setPasswordVerified(false);
    }
  };

  const handleDiscountChange = (newValue: string) => {
    onChange(newValue);
    // Reset password state when changing discount
    if (newValue !== 'ceo-approval') {
      setPasswordInput('');
      setPasswordVerified(false);
      setShowPasswordError(false);
    }
  };

  const getDiscountDisplay = (discount: SpecialSalesDiscount) => {
    if (discount.id === 'none') return null;
    if (discount.isCustom && value === 'ceo-approval' && passwordVerified) {
      return `${customPercent}% off setup`;
    }
    if (discount.isCustom) return 'Custom % off setup';
    return `${Math.round((1 - discount.discount) * 100)}% off setup`;
  };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <>
          <div className="flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">Special Sales Discount</Label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Apply strategic discount to the <span className="font-medium text-foreground">setup fee only</span>. Monthly retainer remains unchanged.
          </p>
        </>
      )}

      <RadioGroup
        value={value}
        onValueChange={handleDiscountChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {specialSalesDiscounts.map((discount) => {
          const Icon = discountIcons[discount.id] || BadgePercent;
          const isSelected = value === discount.id;
          const discountLabel = getDiscountDisplay(discount);

          return (
            <div key={discount.id} className="relative">
              <RadioGroupItem
                value={discount.id}
                id={`discount-${discount.id}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`discount-${discount.id}`}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-medium",
                      isSelected && "text-primary"
                    )}>
                      {discount.name}
                    </span>
                    {discountLabel && (
                      <Badge 
                        variant={isSelected ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          discount.id !== 'none' && isSelected && "bg-green-600 hover:bg-green-600"
                        )}
                      >
                        {discountLabel}
                      </Badge>
                    )}
                    {discount.requiresPassword && (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {discount.description}
                  </p>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {/* CEO Approval Password & Custom Percent Section */}
      {isCeoApproval && (
        <div className="mt-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <KeyRound className="w-4 h-4" />
            <span className="text-sm font-medium">CEO Approval Required</span>
          </div>

          {!passwordVerified ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter CEO password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setShowPasswordError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  className={cn(
                    "flex-1",
                    showPasswordError && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Verify
                </button>
              </div>
              {showPasswordError && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid password. Please contact CEO for approval.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Password verified — Custom discount enabled</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">Custom Discount Percentage</Label>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {customPercent}% off
                  </span>
                </div>
                <SliderWithArrows
                  value={[customPercent]}
                  onValueChange={([val]) => onCustomPercentChange(val)}
                  min={5}
                  max={80}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Discount Summary */}
      {value !== 'none' && (value !== 'ceo-approval' || passwordVerified) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {value === 'ceo-approval' 
              ? `CEO Approved: ${customPercent}% discount applied to setup fee only`
              : `${selectedDiscount.name}: ${Math.round((1 - selectedDiscount.discount) * 100)}% discount applied to setup fee only`
            }
          </span>
        </div>
      )}
    </div>
  );
});
