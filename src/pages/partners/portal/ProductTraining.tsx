import { ResourceCard, ResourceCardProps } from "@/components/portal/ResourceCard";

const ITEMS: ResourceCardProps[] = [
  {
    title: "Product training video / recorded walkthrough",
    description: "Learn the platform end to end at your own pace.",
    status: "coming-soon",
    action: "View",
  },
  {
    title: "Short certification",
    description: "Pass this to be signed off to sell alfred ai. 20 questions, 100% to pass.",
    status: "available",
    action: "Open",
    to: "/partners/portal/training/certification",
  },
  {
    title: "Technical and security FAQ (data, EVA)",
    description: "The detail IT buyers will ask about.",
    status: "coming-soon",
    action: "View",
  },
];

export default function ProductTraining() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">
          Product & Training
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Get certified and ready to answer the technical questions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <ResourceCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}
