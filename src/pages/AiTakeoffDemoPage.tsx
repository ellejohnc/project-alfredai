import { useSearchParams } from "react-router-dom";
import { AlertCircle, Mail } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { AiTakeoffLiveDemo } from "@/components/demos/takeoff/AiTakeoffLiveDemo";
import { isFeaturedTrade, type TradeId } from "@/components/demos/takeoff/takeoffData";

function Fallback() {
  const href = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("AI Take-Off demo error")}&body=${encodeURIComponent(`Page: ${window.location.href}\n\nPlease attach a screenshot.`)}`;
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="font-semibold">The live demo couldn't load.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button className="min-h-[44px]" onClick={() => window.location.reload()}>Try again</Button>
        <Button asChild variant="outline" className="min-h-[44px]"><a href="https://new.alfredai.bot/book">Book a demo instead</a></Button>
        <Button asChild variant="ghost" className="min-h-[44px]"><a href={href}><Mail className="mr-2 h-4 w-4" />Report it</a></Button>
      </div>
    </div>
  );
}

export default function AiTakeoffDemoPage() {
  const [params] = useSearchParams();
  const t = params.get("trade");
  const initial: TradeId = isFeaturedTrade(t) ? t : "gc";
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        fullTitle="AI Take-Off Live Demo — From Drawings to Decisions | alfred ai"
        description="Try the AI Take-Off live demo for builders, window and steelwork contractors: sample set, measure, review and export a bill of quantities."
        path="/demos/ai-takeoff"
      />
      <Header />
      <main className="flex-1 pb-12 pt-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <ErrorBoundary fallback={<Fallback />}>
            <AiTakeoffLiveDemo initialTrade={initial} />
          </ErrorBoundary>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
}
