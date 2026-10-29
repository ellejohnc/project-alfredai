import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Business function category variants
        rose: "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400", // Sales
        violet: "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400", // Marketing
        emerald: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", // Operations
        amber: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400", // Finance
        teal: "border-transparent bg-teal-500/15 text-teal-600 dark:text-teal-400", // Service/Delivery
        indigo: "border-transparent bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", // Recruiting
        sky: "border-transparent bg-sky-500/15 text-sky-600 dark:text-sky-400", // Strategy/Intelligence
        orange: "border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400", // Technology/Platform
        slate: "border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-400", // Procurement/Supply Chain
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
