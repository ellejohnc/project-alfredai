import { useState, useEffect } from "react";
import { format, subDays, startOfMonth, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DatePreset = "today" | "7days" | "30days" | "month" | "custom" | null;

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  activePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  showPresets?: boolean;
  className?: string;
}

// Generate years from 2020 to current year + 1
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 2020; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activePreset,
  onPresetChange,
  showPresets = true,
  className,
}: DateRangeFilterProps) {
  const [startMonth, setStartMonth] = useState<Date>(startDate || new Date());
  const [endMonth, setEndMonth] = useState<Date>(endDate || new Date());
  const [isInvalid, setIsInvalid] = useState(false);

  // Check for invalid date range
  useEffect(() => {
    if (startDate && endDate) {
      setIsInvalid(isAfter(startOfDay(startDate), endOfDay(endDate)));
    } else {
      setIsInvalid(false);
    }
  }, [startDate, endDate]);

  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    onPresetChange(preset);
    
    switch (preset) {
      case "today":
        onStartDateChange(today);
        onEndDateChange(today);
        break;
      case "7days":
        onStartDateChange(subDays(today, 6));
        onEndDateChange(today);
        break;
      case "30days":
        onStartDateChange(subDays(today, 29));
        onEndDateChange(today);
        break;
      case "month":
        onStartDateChange(startOfMonth(today));
        onEndDateChange(today);
        break;
      default:
        break;
    }
  };

  const clearDateFilters = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    onPresetChange(null);
    setIsInvalid(false);
  };

  const handleStartMonthChange = (month: string) => {
    const newDate = new Date(startMonth);
    newDate.setMonth(parseInt(month));
    setStartMonth(newDate);
  };

  const handleStartYearChange = (year: string) => {
    const newDate = new Date(startMonth);
    newDate.setFullYear(parseInt(year));
    setStartMonth(newDate);
  };

  const handleEndMonthChange = (month: string) => {
    const newDate = new Date(endMonth);
    newDate.setMonth(parseInt(month));
    setEndMonth(newDate);
  };

  const handleEndYearChange = (year: string) => {
    const newDate = new Date(endMonth);
    newDate.setFullYear(parseInt(year));
    setEndMonth(newDate);
  };

  const years = generateYears();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground mr-1">Date:</span>
      
      {showPresets && (
        <div className="flex flex-wrap gap-1">
          <Button
            variant={activePreset === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("today")}
            className="h-8"
          >
            Today
          </Button>
          <Button
            variant={activePreset === "7days" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("7days")}
            className="h-8"
          >
            Last 7 days
          </Button>
          <Button
            variant={activePreset === "30days" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("30days")}
            className="h-8"
          >
            Last 30 days
          </Button>
          <Button
            variant={activePreset === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("month")}
            className="h-8"
          >
            This month
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2 ml-2">
        {/* Start Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal h-8",
                !startDate && "text-muted-foreground",
                isInvalid && "border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20"
              )}
              onClick={() => onPresetChange("custom")}
            >
              <CalendarIcon className={cn("mr-2 h-3.5 w-3.5", isInvalid && "text-red-500")} />
              {startDate ? format(startDate, "MMM d, yyyy") : "Start"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b flex gap-2">
              <Select
                value={startMonth.getMonth().toString()}
                onValueChange={handleStartMonthChange}
              >
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={startMonth.getFullYear().toString()}
                onValueChange={handleStartYearChange}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                onStartDateChange(date);
                onPresetChange("custom");
              }}
              month={startMonth}
              onMonthChange={setStartMonth}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-muted-foreground">–</span>

        {/* End Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal h-8",
                !endDate && "text-muted-foreground",
                isInvalid && "border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20"
              )}
              onClick={() => onPresetChange("custom")}
            >
              <CalendarIcon className={cn("mr-2 h-3.5 w-3.5", isInvalid && "text-red-500")} />
              {endDate ? format(endDate, "MMM d, yyyy") : "End"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b flex gap-2">
              <Select
                value={endMonth.getMonth().toString()}
                onValueChange={handleEndMonthChange}
              >
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={endMonth.getFullYear().toString()}
                onValueChange={handleEndYearChange}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                onEndDateChange(date);
                onPresetChange("custom");
              }}
              month={endMonth}
              onMonthChange={setEndMonth}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Invalid date warning */}
      {isInvalid && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>End date must be after start date</span>
        </div>
      )}
      
      {/* Clear button */}
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDateFilters}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
