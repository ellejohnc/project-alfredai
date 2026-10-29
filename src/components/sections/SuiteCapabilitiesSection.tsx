import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  FileText,
  ListTree,
  ScanText,
  ShieldCheck,
  Search,
  CheckCircle2,
  Send,
  Repeat,
  GitCompare,
} from "lucide-react";

const capabilities = [
  { icon: FileText, name: "Read", description: "Understands PDFs, spreadsheets, docs, emails, and scans — any layout." },
  { icon: ListTree, name: "Classify", description: "Sorts and routes documents intelligently, even in complex many-to-many cases." },
  { icon: ScanText, name: "Extract", description: "Captures precise data from any structure, standard or not." },
  { icon: ShieldCheck, name: "Validate", description: "Multi-layer checks against your business rules and master data." },
  { icon: Search, name: "Search", description: "Answers natural-language questions across your knowledge base." },
  { icon: CheckCircle2, name: "Confirm", description: "Keeps a human in the loop wherever judgement matters." },
  { icon: Send, name: "Respond", description: "Sends emails, updates systems, and generates reports automatically." },
  { icon: Repeat, name: "Transform", description: "Exports to any format your systems need — CSV, Excel, JSON, XML." },
  { icon: GitCompare, name: "Reconcile", description: "Cross-checks multiple documents to surface discrepancies." },
];

const SuiteCapabilitiesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mb-12 md:mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">One engine</span>
          <h2 className="section-heading">
            Shared capabilities under{" "}
            <span className="text-muted-foreground">every layer.</span>
          </h2>
          <p className="section-subtitle">
            Axiom, Butler, Watch, Omega, and AOS are built from the same proven
            capabilities — so the suite works as one engineered system, not five
            separate tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.name}
              className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
            >
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
                <cap.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">{cap.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuiteCapabilitiesSection;
