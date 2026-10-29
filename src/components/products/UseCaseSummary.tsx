import { AlertTriangle, Flag, User, Workflow } from "lucide-react";
import type { UseCase } from "@/data/useCases";

const SummaryCard = ({
  icon: Icon,
  label,
  children,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-6 bg-card shadow-elevation-1 ${
      accent ? "border-primary/30" : "border-border"
    }`}
  >
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
          accent ? "bg-primary/10 border-primary/30" : "bg-muted border-border"
        }`}
      >
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-foreground"}`} />
      </span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
    </div>
    <div className="text-sm md:text-base text-foreground leading-relaxed">{children}</div>
  </div>
);

const UseCaseSummary = ({ useCase }: { useCase: UseCase }) => {
  return (
    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
      <SummaryCard icon={AlertTriangle} label="The problem">
        {useCase.problem}
      </SummaryCard>
      <SummaryCard icon={Flag} label="The goal">
        {useCase.goal}
      </SummaryCard>
      <SummaryCard icon={User} label="Who this is for">
        {useCase.persona}
      </SummaryCard>
      <SummaryCard icon={Workflow} label="The solution" accent>
        {useCase.solution}
      </SummaryCard>
    </div>
  );
};

export default UseCaseSummary;
