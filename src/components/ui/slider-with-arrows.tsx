import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderWithArrowsProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const SliderWithArrows = React.forwardRef<
  HTMLDivElement,
  SliderWithArrowsProps
>(({ value, onValueChange, min = 0, max = 100, step = 1, className, disabled }, ref) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value[0] - step);
    onValueChange([newValue]);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value[0] + step);
    onValueChange([newValue]);
  };

  return (
    <div ref={ref} className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleDecrement}
        disabled={disabled || value[0] <= min}
        aria-label="Decrease value"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleIncrement}
        disabled={disabled || value[0] >= max}
        aria-label="Increase value"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
});

SliderWithArrows.displayName = "SliderWithArrows";

export { SliderWithArrows };
