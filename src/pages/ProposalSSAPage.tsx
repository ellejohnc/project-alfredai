import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getWorkflowById } from '@/lib/workflowDefinitions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface QuoteData {
  id: string;
  quote_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  workflows: string[] | null;
  pricing_option: string | null;
  setup_fee_final: number | null;
  setup_fee_min: number | null;
  setup_fee_max: number | null;
  monthly_retainer_final: number | null;
  monthly_retainer_min: number | null;
  monthly_retainer_max: number | null;
  roi_conservative: number | null;
  roi_likely: number | null;
  roi_best: number | null;
  payback_months_conservative: number | null;
  payback_months_likely: number | null;
  payback_months_best: number | null;
  voice_agent_setup_cost: number | null;
  voice_agent_monthly_cost: number | null;
  created_at: string | null;
  bundle_pricing: boolean | null;
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return '$0';
  return new Intl.NumberFormat('en-AU', { 
    style: 'currency', 
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(amount);
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(dateString).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ProposalSSAPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    schedule1: true,
    schedule2: true,
    schedule3: false,
    schedule4: false,
    schedule5: true,
  });

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) {
        setError('No quote ID provided');
        setLoading(false);
        return;
      }

      try {
        // Use edge function to bypass RLS (quotes table has no public SELECT)
        const { data: fnData, error: fnError } = await supabase.functions.invoke('quote-operations', {
          body: { action: 'load', quoteId: quoteId.toUpperCase() }
        });

        if (fnError) throw fnError;
        if (!fnData?.data) {
          setError('Quote not found');
          setLoading(false);
          return;
        }

        const data = fnData.data;

        // Parse workflows - handle Json type from Supabase
        const parsedWorkflows: string[] = Array.isArray(data.workflows) 
          ? data.workflows.filter((w): w is string => typeof w === 'string')
          : [];
        const parsedCustomWorkflows = Array.isArray(data.workflows)
          ? (data.workflows as any[]).filter((w: any) => typeof w === 'object' && w !== null && w.custom === true)
          : [];

        setQuoteData({
          ...data,
          workflows: parsedWorkflows
        });
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError('Failed to load agreement');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const deliverables = useMemo(() => {
    if (!quoteData?.workflows) return [];
    return quoteData.workflows
      .map(wfId => getWorkflowById(wfId))
      .filter(Boolean);
  }, [quoteData]);

  const setupFee = quoteData?.setup_fee_final ?? quoteData?.setup_fee_max ?? 0;
  const monthlyRetainer = quoteData?.monthly_retainer_final ?? quoteData?.monthly_retainer_max ?? 0;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">{error || 'Agreement Not Found'}</h2>
            <p className="text-muted-foreground">
              We couldn't locate the agreement for this proposal. Please contact support if you believe this is an error.
            </p>
            <Button asChild className="w-full">
              <a href={`mailto:support@alfredai.bot?subject=SSA%20Access%20Issue%20-%20Quote%20${quoteId}&body=I%20was%20unable%20to%20access%20the%20Standard%20Service%20Agreement%20for%20quote%20${quoteId}.`}>
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to={`/proposal/${quoteId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Proposal
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to={`/proposal/${quoteId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Proposal</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-medium">Quote: {quoteData.quote_id || quoteId}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">AI Software Implementation & Services Agreement</h1>
          <p className="text-muted-foreground">Standard Service Agreement</p>
        </div>

        {/* Agreement Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          
          {/* Section 1: Parties */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">1. Parties</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-primary mb-2">Developer</h3>
                <p className="text-sm">alfred ai Agent Services</p>
                <p className="text-sm text-muted-foreground">ABN: 62 864 936 525</p>
                <p className="text-sm text-muted-foreground">Level 35, International Tower One, Barangaroo NSW 2000</p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">Client</h3>
                <p className="text-sm">{quoteData.company_name || '[Company Name]'}</p>
                <p className="text-sm text-muted-foreground">{quoteData.contact_name || '[Contact Name]'}</p>
                <p className="text-sm text-muted-foreground">{quoteData.contact_email || '[Contact Email]'}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Date of Contract: {formatDate(quoteData.created_at)}
            </p>
          </section>

          {/* Section 2: Background */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">2. Background & Purpose</h2>
            <p className="text-sm leading-relaxed">
              A. The Client wishes to engage the Developer to implement AI agents that integrate with the Client's existing systems in a minimal disruptive manner.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              B. The Developer provides modular artificial intelligence software agents and implementation services.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              The AI Solution will be accessible via alfred ai's web apps and connected services. Ongoing use requires an active maintenance subscription.
            </p>
          </section>

          {/* Section 3-18: Core Terms (Collapsible) */}
          <Collapsible open={openSections.terms} onOpenChange={() => toggleSection('terms')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-card border rounded-lg">
                <span className="font-semibold">Sections 3–18: Core Agreement Terms</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openSections.terms ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6 space-y-8">
              <div className="text-sm space-y-6">

                {/* 3. Scope of Services */}
                <div>
                  <h3 className="font-semibold text-base mb-3">3. Scope of Services</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">3.1 Implementation Services.</strong> The Developer shall design, configure, and deploy modular AI agents that integrate with the Client's existing systems via APIs, webhooks, or other light-touch connectors, without replacing the Client's systems of record.</p>
                    <p><strong className="text-foreground">3.2 Non-Disruptive Operation.</strong> The Client's personnel shall continue to operate within their existing tools. The AI Solution will automate data handling, outputs, and handoffs.</p>
                    <p><strong className="text-foreground">3.3 Service Packages.</strong> The specific modules to be implemented are described in Schedule 1 (Deliverables &amp; Scope).</p>
                    <p><strong className="text-foreground">3.4 Multi-Report Rule.</strong> A single workflow may support multiple report templates where the input logic and output data model are identical. Where inputs or outputs materially differ, a separate workflow and setup fee will apply.</p>
                    <p><strong className="text-foreground">3.5 Platform Access.</strong> The AI Solution will be accessible via alfred ai web applications and connected services, including Accountable.link where applicable. Continued access requires an active maintenance subscription.</p>
                  </div>
                </div>

                {/* 4. Project Governance */}
                <div>
                  <h3 className="font-semibold text-base mb-3">4. Project Governance and Acceptance</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">4.1 Kickoff.</strong> The project shall commence upon execution of this Agreement and receipt of the initial payment.</p>
                    <p><strong className="text-foreground">4.2 Client Responsibilities.</strong> The Client shall provide timely access to templates, data, systems, and personnel reasonably required to deliver the Services.</p>
                    <p><strong className="text-foreground">4.3 User Acceptance Testing (UAT).</strong> Following delivery, the Client shall conduct UAT using live or representative data. Unless the Client provides written notice of material defects within thirty (30) days of delivery, the deliverables shall be deemed accepted.</p>
                  </div>
                </div>

                {/* 5. Fees */}
                <div>
                  <h3 className="font-semibold text-base mb-3">5. Fees and Payment</h3>
                  <p className="text-muted-foreground">Fees, payment structure, and subscription charges are set out in Schedule 2 (Pricing &amp; Payment Terms).</p>
                </div>

                {/* 6. Change Management */}
                <div>
                  <h3 className="font-semibold text-base mb-3">6. Change Management</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">6.1 Out-of-Scope Work.</strong> Any functionality or modification beyond the agreed scope shall be treated as a Change Request and quoted separately.</p>
                    <p><strong className="text-foreground">6.2 Approval Requirement.</strong> No Change Request shall commence without the Client's written approval of cost and timeline impact.</p>
                  </div>
                </div>

                {/* 7. Intellectual Property */}
                <div>
                  <h3 className="font-semibold text-base mb-3">7. Intellectual Property (IP) Rights</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">7.1 Pre-Existing IP.</strong> Each Party retains all rights, title, and interest to any pre-existing Intellectual Property they own prior to this Agreement. Nothing in this Agreement transfers ownership of a Party's pre-existing Intellectual Property, except as otherwise agreed in writing.</p>
                    <p><strong className="text-foreground">7.2 Developer IP.</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><em>AI Solution &amp; Source Code:</em> All source code, libraries, workflows, scripts, and associated technical components created by the Developer specifically for the AI Solution are owned by the Developer unless otherwise agreed in writing. The Client is granted a non-exclusive, non-transferable, royalty-free license to use the delivered AI Solution, in object code form, for the specific purpose outlined in this Agreement.</li>
                      <li><em>Generated Reports &amp; Content:</em> The Client retains ownership of all final reports, data, and other written materials generated by the AI Solution, subject to any third-party licensing terms that may apply.</li>
                      <li><em>Custom Integrations &amp; Configurations:</em> Any custom prompts, configurations, or training data provided by the Client that is incorporated into the AI Solution remains the property of the Client. However, the Developer may reuse generic components or configurations that do not contain confidential or proprietary Client information in other projects.</li>
                    </ul>
                    <p><strong className="text-foreground">7.3 Licence to Client.</strong> The Client acknowledges that any data used to train or refine AI models may be stored, processed, or analyzed by third-party AI service providers under separate terms. Where feasible and commercially reasonable, the Developer shall configure the AI Solution to safeguard the Client's confidential information.</p>
                    <p><strong className="text-foreground">7.4 Third-party Components.</strong> The Developer may use open-source or third-party software libraries in the AI Solution. The Client agrees to comply with the terms of any open-source or third-party licenses, which the Developer shall disclose upon request.</p>
                    <p><strong className="text-foreground">7.6 Restrictions.</strong> The Client shall not reverse-engineer, decompile, or otherwise attempt to derive the source code of the Developer's proprietary components without prior written consent. The Client shall not remove or alter any proprietary notices or legends contained in or on the AI Solution.</p>
                    <p><strong className="text-foreground">7.7 License to Use Client Marks.</strong> Unless otherwise instructed in writing by the Client, the Developer may reference the Client's name, logo, or trademark in its marketing materials for the sole purpose of identifying the Client as a user of the AI Solution.</p>
                    <p><strong className="text-foreground">7.8 Post-Termination Access.</strong> For 30 days after Termination, the Developer shall not disable or restrict the Client's access to the AI Solution unless a complete data export under clause 8.8.1 has been confirmed in writing by the Client.</p>
                  </div>
                </div>

                {/* 8. Data Processing */}
                <div>
                  <h3 className="font-semibold text-base mb-3">8. Data Processing, Protection and Security</h3>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">8.1 Data Processing Agreement (DPA)</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>The parties acknowledge that the Service Provider may process Personal Information on behalf of the Client.</li>
                        <li>This Clause 8 constitutes the Data Processing Agreement between the parties and forms part of this Agreement.</li>
                        <li>The Service Provider acts as a data processor and shall process Personal Information solely on documented instructions from the Client.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.2 Definitions</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>"Applicable Data Protection Laws" means the Privacy Act 1988 (Cth), the Australian Privacy Principles (APPs), the Notifiable Data Breaches Scheme, and any other applicable data protection legislation.</li>
                        <li>"Personal Information" has the meaning given in the Privacy Act 1988 (Cth).</li>
                        <li>"Client Data" means all data, including Personal Information, provided to or collected by the Service Provider in connection with the Services.</li>
                        <li>"Processing" means any operation performed on Personal Information, including collection, storage, use, disclosure, deletion, or destruction.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.3 Scope of Processing</p>
                      <p>The Service Provider shall process Client Data solely for the purpose of providing the Services. The Service Provider shall not:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-1">
                        <li>use Client Data for AI model training;</li>
                        <li>use Client Data for product improvement unrelated to the Client;</li>
                        <li>sell, rent, disclose, or commercially exploit Client Data;</li>
                        <li>combine Client Data with other client datasets for cross-client analytics.</li>
                      </ul>
                      <p className="mt-1">Client Data shall be logically segregated from other customer environments.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.4 Data Hosting and Residency</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Client Data shall be hosted within Australia in AWS Australia (Sydney region) and Oracle Australia East (Sydney region).</li>
                        <li>All production databases and system backups shall be maintained within Australian data centres.</li>
                        <li>Where AI-enabled functionality is used, AI model processing may occur outside Australia; the Service Provider shall implement programmatic anonymisation to remove personally identifiable information prior to transmission.</li>
                        <li>The Service Provider shall comply with cross-border disclosure obligations under APP 8 where applicable.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.5 Security and Information Governance</p>
                      <p>The Service Provider maintains an Information Security Management System aligned with ISO/IEC 27001 principles and shall implement:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-1">
                        <li>Role-Based Access Control (RBAC) and least-privilege access principles</li>
                        <li>Multi-factor authentication for administrative accounts</li>
                        <li>Encryption in transit (TLS 1.2 or higher) and at rest (AES-256 or equivalent)</li>
                        <li>Access logging and audit trails</li>
                        <li>Structured patch and vulnerability management processes</li>
                      </ul>
                      <p className="mt-2">Access to Client Data shall be restricted to the CEO, the CTO, and authorised core engineering personnel, each bound by confidentiality and Non-Disclosure Agreements.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.6 Sub-Processors</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>The Service Provider may engage sub-processors including Stripe (payment processing), Xero (accounting integration), and OpenAI (AI processing).</li>
                        <li>Sub-processors are subject to written contractual obligations providing data protection standards no less protective than those in this Clause 8.</li>
                        <li>The Service Provider must notify the Client when engaging any new sub-processor with at least five (5) Business Days' prior written notice, during which the Client may object on reasonable grounds.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.7 Data Breach and Incident Management</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>The Service Provider shall maintain documented incident response procedures.</li>
                        <li>In the event of a confirmed eligible data breach, the Service Provider shall notify the Client within one (1) business day of confirmation, provide known details, outline remediation steps, and cooperate with regulatory reporting obligations.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.8 Data Retention, Return and Deletion</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Upon termination, the Service Provider shall provide a complete export of Client Data in a structured and commonly used format; following confirmed transfer, production databases and backups shall be securely deleted.</li>
                        <li>Deletion requests during the term shall be processed within one (1) business day, subject to legal retention obligations.</li>
                        <li>Residual system logs retained for compliance or security purposes remain protected under this Clause 8.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">8.9 Audit Rights</p>
                      <p>Upon reasonable written notice, the Client may request evidence of compliance with this Clause 8, including security policy summaries, certifications, or written compliance confirmations. Any audit shall not compromise the confidentiality or security of other customers.</p>
                    </div>
                    <p><strong className="text-foreground">8.10 Survival.</strong> Clauses 8.1 to 8.9 survive termination of this Agreement to the extent necessary to enforce data protection, confidentiality, and regulatory obligations.</p>
                  </div>
                </div>

                {/* 9. Confidentiality */}
                <div>
                  <h3 className="font-semibold text-base mb-3">9. Confidentiality</h3>
                  <p className="text-muted-foreground">Both Parties agree to keep confidential any proprietary or confidential information shared during the project, including but not limited to business data, code, training materials, and other sensitive information. This clause survives the termination of this Agreement.</p>
                </div>

                {/* 10. Warranties */}
                <div>
                  <h3 className="font-semibold text-base mb-3">10. Warranties &amp; Disclaimers</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">10.1 Performance Warranty.</strong> The Developer warrants that the delivered AI Solution will substantially perform as described under normal conditions.</p>
                    <p><strong className="text-foreground">10.2 No Guarantee of Outcomes.</strong> Project "Success" metrics will be jointly defined at kickoff. Approximately 6 months post-delivery, the Parties will review performance against those KPIs. If outcomes fall short, the Developer will continue reasonable efforts within scope and active maintenance to reach the agreed targets.</p>
                    <p><strong className="text-foreground">Disclaimer.</strong> The Developer does not warrant uninterrupted or error-free operation of the AI Solution, especially given reliance on third-party AI/LLM providers. Except as explicitly set forth herein, all express or implied warranties, including the implied warranties of merchantability and fitness for a particular purpose, are disclaimed to the extent allowed by law.</p>
                  </div>
                </div>

                {/* 11. Limitation of Liability */}
                <div>
                  <h3 className="font-semibold text-base mb-3">11. Limitation of Liability</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">11.1</strong> Neither Party shall be liable for any indirect, special, consequential, or incidental damages arising from this Agreement.</p>
                    <p><strong className="text-foreground">11.2</strong> The Developer's total liability for any claim or damage arising under this Agreement shall not exceed the total amount paid by the Client to the Developer under this Agreement.</p>
                    <p><strong className="text-foreground">11.3</strong> Clause 11.2 shall not apply to limit liability in respect of: (a) a breach of clause 8 (Data Processing, Protection and Security); (b) infringement of the Client's intellectual property rights; (c) the Developer's fraud or wilful misconduct; or (d) death or personal injury caused by negligence. In respect of item (a), the Developer's total liability shall not exceed the lesser of $50,000 or two times (2×) the total fees paid by the Client under this Agreement.</p>
                  </div>
                </div>

                {/* 12. Indemnification */}
                <div>
                  <h3 className="font-semibold text-base mb-3">12. Indemnification</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">12.1</strong> The Client agrees to indemnify and hold harmless the Developer from any claims, liabilities, or expenses (including reasonable legal fees) arising from: misuse or unauthorized modification of the AI Solution by the Client; and third-party claims related to data or content uploaded by the Client.</p>
                    <p><strong className="text-foreground">12.2 Security.</strong> The Developer will implement commercially reasonable administrative, technical, and physical safeguards. Where third-party platforms are used, the Developer will take reasonable steps to ensure comparable data security standards. The Client remains responsible for maintaining the security of its own systems, login credentials, and user access protocols.</p>
                    <p><strong className="text-foreground">12.3</strong> The Developer will indemnify the Client against third-party claims to the extent directly caused by: (a) infringement of a third party's intellectual property rights by the unmodified AI Solution; (b) a Personal Data breach caused by the Developer's material breach, negligence, or wilful misconduct; and (c) bodily injury, death, or physical property damage caused by the Developer's negligence. This clause is subject to clause 11.2. The Developer's obligations are conditional on prompt notice, control of defence, and reasonable cooperation by the Client.</p>
                  </div>
                </div>

                {/* 13. Termination */}
                <div>
                  <h3 className="font-semibold text-base mb-3">13. Termination</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">13.1 Termination for Cause.</strong> Either Party may terminate this Agreement upon material breach by the other Party if such breach is not remedied within 14 days after written notice.</p>
                    <p><strong className="text-foreground">13.2 Effect of Termination.</strong> If terminated, the Client shall pay the Developer for work completed up to the date of termination. Upon termination, all licenses granted to the Client under this Agreement immediately cease unless otherwise agreed in writing.</p>
                    {quoteData.pricing_option === 'C' && ((quoteData as unknown as Record<string, unknown>).contract_months as number) > 0 && (
                      <p><strong className="text-foreground">13.3 Termination for Convenience (Option C).</strong> Where the Client has elected Option C (Long-term Commitment), termination for convenience prior to the expiry of the {((quoteData as unknown as Record<string, unknown>).contract_months as number)}-month contracted period shall require the Client to pay the remainder of the total contractual value in full. The total contractual value comprises the Setup Fee plus the Monthly Retainer multiplied by the contracted period.</p>
                    )}
                  </div>
                </div>

                {/* 14. Maintenance */}
                <div>
                  <h3 className="font-semibold text-base mb-3">14. Maintenance &amp; Ongoing Improvements</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong className="text-foreground">14.1 Initial Testing Period.</strong> After delivery, the Client has approximately 3–4 months for testing.</p>
                    <p><strong className="text-foreground">14.2 Post-Project Work.</strong> Any enhancements, fine-tuning, or development outside original scope will be charged at an hourly rate or lump sum, to be agreed upon in writing before work commences. Maintenance services are provided only while an active subscription is in place, as detailed in Schedule 2.</p>
                  </div>
                </div>

                {/* 15. Governing Law */}
                <div>
                  <h3 className="font-semibold text-base mb-3">15. Governing Law</h3>
                  <p className="text-muted-foreground">This Agreement is governed by and construed in accordance with the laws of Australia. The Parties submit to the exclusive jurisdiction of the courts of the relevant state or territory.</p>
                </div>

                {/* 16. Refund & Satisfaction Guarantee */}
                <div>
                  <h3 className="font-semibold text-base mb-3">16. Refund &amp; Satisfaction Guarantee Policy</h3>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">16.1 Subscription Services Refund Policy</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><em>Monthly Subscriptions:</em> First-month subscriptions are non-refundable once activated. Cancel anytime to avoid further billing; no partial refunds for unused time.</li>
                        <li><em>Annual Subscriptions:</em> May be refunded within 14 days of activation if unused. After this period or upon active usage, no refunds apply; auto-renewal can be stopped at any time.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">16.2 Custom AI Development Projects</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><em>Discovery &amp; Design Phase:</em> During the first 14 days, clients receive strategy consultation, workflow mapping, and initial prototypes. If unsatisfied, clients may exit with a 50% refund of the paid Setup Fee before milestone sign-off.</li>
                        <li><em>Development &amp; Delivery Phase:</em> Once Discovery Phase outcomes are approved, no refunds apply. alfred ai ensures on-time delivery, adherence to scope, and bug fixes/minor adjustments at no extra cost within scope.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">16.3 Stop Work Flexibility</p>
                      <p>At any point during Development Phase, you may pause or terminate the project, ceasing future milestone payments. All prior payments remain non-refundable for completed phases. On termination, you retain rights to all completed and paid-for deliverables.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">16.4 Service Downtime Policy</p>
                      <p>In case of platform-wide outages exceeding 72 hours, you may be eligible for service credit or subscription extension, not cash refunds.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">16.5 Dispute Resolution</p>
                      <p>To raise an issue, contact support@alfredai.bot. Concerns are resolved first through service adjustments or credits, not direct refunds.</p>
                    </div>
                  </div>
                </div>

                {/* 17. Dispute Resolution */}
                <div>
                  <h3 className="font-semibold text-base mb-3">17. Dispute Resolution</h3>
                  <p className="text-muted-foreground">If a dispute arises under this Agreement, the Parties agree to attempt to resolve it through good-faith negotiation. If unresolved, they agree to consider mediation or arbitration before proceeding to litigation.</p>
                </div>

                {/* 18. General */}
                <div>
                  <h3 className="font-semibold text-base mb-3">18. General</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong className="text-foreground">18.1 Assignment.</strong> Neither Party may assign without consent (not unreasonably withheld).</p>
                    <p><strong className="text-foreground">18.2 Force Majeure.</strong> Neither Party is liable for events beyond reasonable control.</p>
                    <p><strong className="text-foreground">18.3 Severability.</strong> Invalid provisions do not affect the remainder.</p>
                    <p><strong className="text-foreground">18.4 Notices.</strong> Notices must be in writing to the addresses above.</p>
                    <p><strong className="text-foreground">18.5 Entire Agreement.</strong> This Agreement and its Schedules constitute the entire agreement.</p>
                    <p><strong className="text-foreground">18.6 Counterparts.</strong> This Agreement may be executed electronically and in counterparts.</p>
                  </div>
                </div>

              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Schedule 1: Deliverables */}
          <Collapsible open={openSections.schedule1} onOpenChange={() => toggleSection('schedule1')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-semibold text-primary">Schedule 1 – Deliverables & Scope</span>
                <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openSections.schedule1 ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  The Developer will implement modular AI agents that integrate with the Client's existing systems to automate workflows and operational visibility.
                </p>
                
                {deliverables.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Included Service Packages</h3>
                    {deliverables.map((workflow, index) => (
                      <div key={workflow?.id} className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-primary">
                          Deliverable #{index + 1} – {workflow?.name || 'Custom AI Workflow'}
                        </h4>
                        {workflow?.applications && workflow.applications.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {workflow.applications.map((app, appIndex) => (
                              <li key={appIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {app}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Custom AI workflows as agreed during discovery phase.</p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Shared Deliverables</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Configured workflows and integrations</li>
                    <li>• Template mappings and configuration documentation</li>
                    <li>• Onboarding and training materials</li>
                    <li>• Agreed KPI and success metrics sheet</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Exclusions</h3>
                  <p className="text-sm text-muted-foreground">
                    New workflows, major feature development, custom integrations, and material scope changes are excluded unless agreed in writing.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Schedule 2: Pricing */}
          <Collapsible open={openSections.schedule2} onOpenChange={() => toggleSection('schedule2')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-semibold text-primary">Schedule 2 – Pricing & Payment Terms</span>
                <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openSections.schedule2 ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Minimum $5,000 COMMITMENT PAYMENT REQUIRED TO SECURE YOUR PROJECT SLOT
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Quote Number</p>
                    <p className="font-mono font-medium">{quoteData.quote_id || quoteId}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">AUD | ex-GST</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Setup Fees</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    {deliverables.length > 0 && !quoteData?.bundle_pricing ? (
                      <div className="space-y-2">
                        {deliverables.map((workflow, index) => {
                          const perDeliverable = Math.round(setupFee / deliverables.length);
                          return (
                            <div key={workflow?.id} className="flex justify-between text-sm">
                              <span>Deliverable #{index + 1} – {workflow?.name}</span>
                              <span className="font-medium">{formatCurrency(perDeliverable)}</span>
                            </div>
                          );
                        })}
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span>Total Setup</span>
                          <span className="text-primary">{formatCurrency(setupFee)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between font-semibold">
                        <span>Total Setup</span>
                        <span className="text-primary">{formatCurrency(setupFee)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(quoteData.voice_agent_setup_cost || quoteData.voice_agent_monthly_cost) && (
                  <div>
                    <h3 className="font-medium mb-3">Voice Agent (Add-on)</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {quoteData.voice_agent_setup_cost && (
                        <div className="flex justify-between text-sm">
                          <span>Voice Agent Setup</span>
                          <span className="font-medium">{formatCurrency(quoteData.voice_agent_setup_cost)}</span>
                        </div>
                      )}
                      {quoteData.voice_agent_monthly_cost && (
                        <div className="flex justify-between text-sm">
                          <span>Voice Agent Monthly</span>
                          <span className="font-medium">{formatCurrency(quoteData.voice_agent_monthly_cost)}/mo</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-3">Maintenance Subscription</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly</span>
                      <span className="font-medium">{formatCurrency(monthlyRetainer)}/mo</span>
                    </div>
                    {!(((quoteData as unknown as Record<string, unknown>).contract_months as number) > 0) && (
                      <div className="flex justify-between text-sm">
                        <span>Annual (20% discount)</span>
                        <span className="font-medium">{formatCurrency(monthlyRetainer * 12 * 0.8)}/yr</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground pt-2">Monthly Retainer starts in Week 6 after contract.</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Payment Option</h3>
                  <div className="space-y-3">
                    {(!quoteData.pricing_option || quoteData.pricing_option === 'A') && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">Option A: Standard Setup</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• 50% upfront: {formatCurrency(setupFee * 0.5)}</li>
                          <li>• 20% month 1: {formatCurrency(setupFee * 0.2)}</li>
                          <li>• 20% month 2: {formatCurrency(setupFee * 0.2)}</li>
                          <li>• 10% post-UAT: {formatCurrency(setupFee * 0.1)}</li>
                        </ul>
                      </div>
                    )}
                    {quoteData.pricing_option === 'A1' && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">Option A1: Pay Full Upfront</h4>
                        <p className="text-sm text-muted-foreground">
                          100% Setup Fee paid upfront: {formatCurrency(setupFee)}
                        </p>
                      </div>
                    )}
                    {quoteData.pricing_option === 'B' && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">Option B: Price-Friendly Setup</h4>
                        <p className="text-sm text-muted-foreground">
                          Paid in full upfront with 20% discount: {formatCurrency(setupFee * 0.8)}
                        </p>
                      </div>
                    )}
                    {quoteData.pricing_option === 'C' && ((quoteData as unknown as Record<string, unknown>).contract_months as number) > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-sm mb-2">Option C: Long-term Commitment</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>
                            50% discounted setup ({formatCurrency(setupFee * 0.5)}) paid upfront. Savings redistributed into monthly retainer over {((quoteData as unknown as Record<string, unknown>).contract_months as number)}-month contract.
                          </p>
                          <p className="font-medium text-foreground">
                            Termination for convenience: The Client must pay the remainder of the total contractual value in full.
                          </p>
                          <p className="text-xs">
                            Total contractual value = Setup Fee + (Monthly Retainer × {((quoteData as unknown as Record<string, unknown>).contract_months as number)} months). Early termination does not relieve the Client of the obligation to pay the outstanding balance of the contracted period.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Schedule 3: Timeline */}
          <Collapsible open={openSections.schedule3} onOpenChange={() => toggleSection('schedule3')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-card border rounded-lg">
                <span className="font-semibold">Schedule 3 – Project Timeline & Milestones</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openSections.schedule3 ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6">
              <div className="space-y-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Week 1–2: Discovery &amp; Setup</h4>
                  <p className="text-muted-foreground">We start by mapping your key workflows, understanding how your team operates today, and identifying the highest-impact automation opportunities. We connect alfred ai to your existing systems with minimal disruption — no technical expertise required from your team.</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Week 3–4: AI Training</h4>
                  <p className="text-muted-foreground">alfred ai is trained on your documents, templates, processes, and business rules. We configure the AI engines to reflect how you work, ensuring outputs match your standards, language, and compliance requirements.</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Week 5–6: Pilot Launch (UAT)</h4>
                  <p className="text-muted-foreground">We launch a focused pilot, usually within one department or workflow. Your team uses the system in real scenarios while we collect feedback, refine logic, and fine-tune outputs to production quality. Monthly Retainer starts immediately after Contract.</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Week 7+: Scale &amp; Expand</h4>
                  <p className="text-muted-foreground">Once validated, alfred ai is rolled out across additional teams and use cases. The platform continues to improve through usage patterns, while dashboards provide visibility into efficiency, turnaround times, and ROI.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Schedule 4: SLA */}
          <Collapsible open={openSections.schedule4} onOpenChange={() => toggleSection('schedule4')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-card border rounded-lg">
                <span className="font-semibold">Schedule 4 – Service Levels & Support (SLA)</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openSections.schedule4 ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6">
              <div className="space-y-6 text-sm">
                <p className="text-muted-foreground italic">This Schedule applies while the Client maintains an active maintenance subscription.</p>

                {/* 1. Platform Availability */}
                <div>
                  <h4 className="font-semibold mb-2">1. Platform Availability (Uptime SLA)</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong className="text-foreground">1.1 Availability Target.</strong> The alfred ai platform will be available 99.9% of the time per calendar month after full launch, excluding Permitted Downtime.</p>
                    <p><strong className="text-foreground">1.2 Measurement.</strong> Availability is measured at the application level and excludes: scheduled maintenance (with reasonable notice), emergency maintenance, third-party outages outside the Developer's control, and force majeure events.</p>
                    <p><strong className="text-foreground">1.3 Scheduled Maintenance.</strong> Planned maintenance will be scheduled outside business hours where reasonably practicable.</p>
                  </div>
                </div>

                {/* 2. Support & Incident Response */}
                <div>
                  <h4 className="font-semibold mb-2">2. Support &amp; Incident Response</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong className="text-foreground">2.1 Support Channels.</strong> Support is provided via Email (support@alfredai.bot) and ticketing system (where applicable).</p>
                    <p><strong className="text-foreground">2.2 Incident Severity Levels:</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Severity 1 – Emergency:</strong> Platform outage or critical failure affecting core operations. No viable workaround. Response Time: within 1 to 12 hours. Resolution Effort: immediate prioritisation until service is restored.</li>
                      <li><strong>Severity 2 – High:</strong> Major functionality impaired but workaround exists. Response Time: within 1 business day. Resolution Effort: commercially reasonable efforts.</li>
                      <li><strong>Severity 3 – Normal:</strong> Non-critical issue, cosmetic defect, or general inquiry. Response Time: within 2–3 business days.</li>
                    </ul>
                  </div>
                </div>

                {/* 3. What the Monthly Retainer Includes */}
                <div>
                  <h4 className="font-semibold mb-2">3. What the Monthly Retainer Includes</h4>
                  <div className="space-y-3 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">3.1 Hosting &amp; Operations</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Cloud hosting of the AI Solution</li>
                        <li>Monitoring and uptime management</li>
                        <li>Basic performance optimisation</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">3.2 Support &amp; Maintenance</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Bug fixes and defect remediation</li>
                        <li>Platform updates and security patches</li>
                        <li>Compatibility updates with supported third-party services</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">3.3 Minor Enhancements (Included Allowance)</p>
                      <p>Up to three (3) hours per month of minor enhancements, such as: prompt tuning, small logic refinements, minor template adjustments, dashboard or report refinements. Unused hours do not roll over.</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">3.4 Usage &amp; Performance Reporting</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Usage monitoring</li>
                        <li>High-level performance insights</li>
                        <li>Support for KPI tracking agreed at kickoff</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">3.5 Advisory Support</p>
                      <p>Reasonable guidance on best-practice usage and recommendations for optimisation within existing scope.</p>
                    </div>
                  </div>
                </div>

                {/* 4. Exclusions */}
                <div>
                  <h4 className="font-semibold mb-2">4. Exclusions from SLA and Retainer</h4>
                  <p className="text-muted-foreground mb-2">The following are explicitly excluded unless agreed in writing:</p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>New AI agents or workflows</li>
                    <li>Material scope expansion</li>
                    <li>Large-scale retraining or re-implementation</li>
                    <li>Client-side system failures or credential issues</li>
                    <li>Third-party software licensing or usage fees</li>
                  </ul>
                </div>

                {/* 5. Service Credits */}
                <div>
                  <h4 className="font-semibold mb-2">5. Service Credits (Platform-Wide Outage Only)</h4>
                  <p className="text-muted-foreground">If a platform-wide outage exceeds 72 continuous hours, the Client may be eligible for a pro-rata service credit or subscription extension. Service credits are not cash-refundable and must be requested in writing.</p>
                </div>

                {/* 6. SLA Dependencies */}
                <div>
                  <h4 className="font-semibold mb-2">6. SLA Dependencies</h4>
                  <p className="text-muted-foreground mb-2">The SLA is conditional on:</p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Timely payment of subscription fees</li>
                    <li>Client compliance with usage and security obligations</li>
                    <li>Use of supported configurations and integrations</li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Schedule 5: ROI Guarantee */}
          <Collapsible open={openSections.schedule5} onOpenChange={() => toggleSection('schedule5')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-6 h-auto bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-semibold text-primary">Schedule 5 – Guaranteed Return on Investment (ROI)</span>
                <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openSections.schedule5 ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-card border border-t-0 rounded-b-lg p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">1. ROI Commitment</h3>
                  <p className="text-sm text-muted-foreground mb-4">Subject to the terms of this Agreement, the Developer commits to delivering the following minimum return on investment, measured against the total fees paid by the Client:</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="border-2 border-primary bg-primary/10 rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-primary mb-1">Guaranteed*</p>
                      <p className="text-2xl font-bold text-primary">{(quoteData.roi_conservative || 5).toLocaleString()}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Within 6 months</p>
                      {quoteData.payback_months_conservative && (
                        <p className="text-xs text-muted-foreground">({quoteData.payback_months_conservative} mo payback)</p>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Possible</p>
                      <p className="text-2xl font-bold text-primary">{(quoteData.roi_likely || 10).toLocaleString()}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Within 12 months</p>
                      {quoteData.payback_months_likely && (
                        <p className="text-xs text-muted-foreground">({quoteData.payback_months_likely} mo payback)</p>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-1">A-team result</p>
                      <p className="text-2xl font-bold text-primary">{(quoteData.roi_best || 20).toLocaleString()}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Within 24 months</p>
                      {quoteData.payback_months_best && (
                        <p className="text-xs text-muted-foreground">({quoteData.payback_months_best} mo payback)</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center italic">
                    "Full Implementation" means the point at which the AI Solution has been deployed into live operational use for the agreed workflows and accepted under this Agreement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Measurement of ROI</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    ROI shall be measured using mutually agreed, objective performance indicators, which may include (but are not limited to):
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-6">
                    <li>Reduction in administrative or processing time</li>
                    <li>Increase in operational throughput</li>
                    <li>Reduction in approval-to-invoice cycle time</li>
                    <li>Improvement in cash collection timelines</li>
                    <li>Reduction in manual rework or error rates</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">Baseline metrics, calculation methodology, and data sources shall be documented and agreed in writing at project kickoff.</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Conditions of Guarantee</h3>
                  <p className="text-sm text-muted-foreground mb-2">The ROI Commitment is conditional upon the Client:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-6">
                    <li>Actively using the AI Solution across the agreed workflows</li>
                    <li>Maintaining an active maintenance subscription throughout the measurement period</li>
                    <li>Providing timely access to data, systems, and personnel</li>
                    <li>Reasonably implementing configuration or optimisation recommendations made by the Developer</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. Review and Remediation</h3>
                  <p className="text-sm text-muted-foreground">
                    The Parties shall conduct periodic ROI reviews at agreed checkpoints. If ROI performance is not on track to meet the applicable threshold, the Developer shall use commercially reasonable efforts, within scope and under the active maintenance subscription, to optimise the AI Solution to achieve the ROI Commitment.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5. Remedy</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    If, after reasonable remediation efforts and continued compliant usage, the applicable ROI threshold is not achieved within the stated timeframe, the Parties agree to engage in good-faith discussions to determine an appropriate commercial remedy, which may include:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-6">
                    <li>Additional optimisation or enhancement work at no additional charge, or</li>
                    <li>Extension of the maintenance subscription at no cost.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2 italic">This section sets out the Client's sole and exclusive remedies in relation to the ROI Commitment.</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6. Exclusions</h3>
                  <p className="text-sm text-muted-foreground mb-2">The ROI Commitment does not apply where any shortfall results from:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-6">
                    <li>Client non-use, partial use, or misuse of the AI Solution</li>
                    <li>Client-initiated process changes outside the agreed scope</li>
                    <li>Incomplete or inaccurate data supplied by the Client</li>
                    <li>Delays caused by lack of access, approvals, or feedback</li>
                    <li>External events beyond the Developer's reasonable control</li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>End of Agreement</p>
            <p className="mt-2">
              By signing the proposal, both parties acknowledge they have read, understood, and agree to the terms 
              and conditions of this Agreement including all Schedules.
            </p>
          </div>
        </div>

        {/* Back to Proposal CTA */}
        <div className="sticky bottom-4 mt-8 flex justify-center">
          <Button asChild size="lg" className="shadow-lg min-h-[48px]">
            <Link to={`/proposal/${quoteId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Proposal
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
