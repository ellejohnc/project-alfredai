// TypeScript interfaces for AI Payment Schedule structured response

export interface PaymentScheduleItem {
  invoice_id: string;
  supplier_name: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  payment_week: number; // 1-4
  payment_date: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  discount_captured: boolean;
  savings: number;
}

export interface WeeklySummary {
  week: number;
  start_date: string;
  end_date: string;
  total_payments: number;
  invoice_count: number;
  cash_remaining: number;
}

export interface PaymentAlert {
  type: 'overdue' | 'risk' | 'discount_expiring';
  message: string;
  invoice_ids: string[];
}

export interface AIScheduleResponse {
  items: PaymentScheduleItem[];
  weekly_summaries: WeeklySummary[];
  alerts: PaymentAlert[];
  total_savings: number;
  recommendations: string[];
}

export interface EnhancedBillSummary {
  id: string;
  supplier_name: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  days_until_due: number;
  status: string;
  has_early_pay_discount: boolean;
  discount_percentage: number;
  discount_deadline: string;
  risk_level: 'high' | 'medium' | 'low';
  risk_flags: string[];
  cost_code: string;
  project_name: string;
  is_recurring: boolean;
}

export const getPriorityColor = (priority: PaymentScheduleItem['priority']) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-500/50 dark:bg-red-950/30 dark:text-red-400';
    case 'high':
      return 'bg-amber-50 text-amber-700 border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-400';
    case 'medium':
      return 'bg-blue-50 text-blue-700 border-blue-500/50 dark:bg-blue-950/30 dark:text-blue-400';
    case 'low':
      return 'bg-slate-50 text-slate-600 border-slate-500/50 dark:bg-slate-900/30 dark:text-slate-400';
  }
};

export const getPriorityLabel = (priority: PaymentScheduleItem['priority']) => {
  switch (priority) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
};

export const getAlertTypeColor = (type: PaymentAlert['type']) => {
  switch (type) {
    case 'overdue':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800';
    case 'risk':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
    case 'discount_expiring':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
  }
};

export const getAlertTypeIcon = (type: PaymentAlert['type']) => {
  switch (type) {
    case 'overdue':
      return 'AlertCircle';
    case 'risk':
      return 'Shield';
    case 'discount_expiring':
      return 'Clock';
  }
};
