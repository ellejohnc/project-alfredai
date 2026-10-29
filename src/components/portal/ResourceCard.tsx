import { Download, ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

export type ResourceStatus = "available" | "coming-soon";
export type ResourceAction = "Download" | "View" | "Open";

export interface ResourceCardProps {
  title: string;
  description: string;
  status: ResourceStatus;
  action?: ResourceAction;
  href?: string;
  /** internal route — when set, renders a client-side link instead of an external anchor */
  to?: string;
}

const actionIcon = {
  Download: Download,
  View: Eye,
  Open: ExternalLink,
};

export function ResourceCard({
  title,
  description,
  status,
  action = "View",
  href = "#",
  to,
}: ResourceCardProps) {
  const available = status === "available";
  const Icon = actionIcon[action];
  const btnClass =
    "inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-partner-pink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover";
  return (
    <Card className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-portal-display text-base font-semibold text-partner-navy">{title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            available
              ? "bg-partner-teal/15 text-partner-teal"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {available ? "Available" : "Coming soon"}
        </span>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
      <div>
        {available ? (
          to ? (
            <Link to={to} className={btnClass}>
              <Icon className="h-4 w-4" />
              {action}
            </Link>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass}>
              <Icon className="h-4 w-4" />
              {action}
            </a>
          )
        ) : (
          <button
            disabled
            className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
          >
            <Icon className="h-4 w-4" />
            {action}
          </button>
        )}
      </div>
    </Card>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-portal-display text-lg font-semibold text-partner-navy">{children}</h2>
  );
}
