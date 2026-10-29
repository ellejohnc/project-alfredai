import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Terms of Service" 
        description="Read alfred ai's terms of service to understand your rights and responsibilities when using our platform."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/legal/terms" }
        ]}
      />
      <Header />
      <main className="pt-24 pb-16 relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <section className="container-wide py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">Legal</span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              {/* 1. Acceptance of Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using alfred ai's website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              {/* 2. Background & Purpose */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Background & Purpose</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  alfred ai provides modular artificial intelligence software agents and implementation services. Our AI agents integrate with your existing systems in a minimal disruptive manner, automating data handling, outputs, and handoffs while your personnel continue to operate within their existing tools.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The AI Solution is accessible via alfred ai's web applications and connected services (including app.Accountable.link where applicable). Ongoing use requires an active maintenance subscription.
                </p>
              </section>

              {/* 3. Scope of Services */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Scope of Services</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">3.1 Implementation Services</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  alfred ai designs, configures, and deploys modular AI agents that integrate with the Client's existing systems via APIs, webhooks, or other light-touch connectors, without replacing the Client's systems of record.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">3.2 Non-Disruptive Operation</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Client's personnel shall continue to operate within their existing tools. The AI Solution will automate data handling, outputs, and handoffs.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">3.3 Multi-Report Rule</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A single workflow may support multiple report templates where the input logic and output data model are identical. Where inputs or outputs materially differ, a separate workflow and setup fee will apply.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">3.4 Platform Access</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The AI Solution will be accessible via alfred ai web applications and connected services, including Accountable.link where applicable. Continued access requires an active maintenance subscription.
                </p>
              </section>

              {/* 4. Project Governance and Acceptance */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Project Governance and Acceptance</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">4.1 Kickoff</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Projects commence upon execution of the applicable service agreement and receipt of the initial payment.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">4.2 Client Responsibilities</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The Client shall provide timely access to templates, data, systems, and personnel reasonably required to deliver the Services.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">4.3 User Acceptance Testing (UAT)</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Following delivery, the Client shall conduct UAT using live or representative data. Unless the Client provides written notice of material defects within thirty (30) days of delivery, the deliverables shall be deemed accepted.
                </p>
              </section>

              {/* 5. Fees and Payment */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Fees and Payment</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Fees, payment structure, and subscription charges are set out in the applicable service agreement or proposal. All pricing is quoted in AUD and excludes GST unless otherwise stated.
                </p>
              </section>

              {/* 6. Change Management */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Change Management</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">6.1 Out-of-Scope Work</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Any functionality or modification beyond the agreed scope shall be treated as a Change Request and quoted separately.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">6.2 Approval Requirement</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No Change Request shall commence without the Client's written approval of cost and timeline impact.
                </p>
              </section>

              {/* 7. Intellectual Property */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property (IP) Rights</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">7.1 Pre-Existing IP</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Each Party retains all rights, title, and interest to any pre-existing Intellectual Property they own prior to the engagement. Nothing in these terms transfers ownership of a Party's pre-existing Intellectual Property, except as otherwise agreed in writing.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">7.2 Developer IP</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>AI Solution & Source Code:</strong> All source code, libraries, workflows, scripts, and associated technical components created by alfred ai are owned by alfred ai unless otherwise agreed in writing. The Client is granted a non-exclusive, non-transferable, royalty-free license to use the delivered AI Solution for the specific purpose outlined in their agreement.</li>
                  <li><strong>Generated Reports & Content:</strong> The Client retains ownership of all final reports, data, and other written materials generated by the AI Solution, subject to any third-party licensing terms that may apply (e.g., terms of LLM providers).</li>
                  <li><strong>Custom Integrations & Configurations:</strong> Any custom prompts, configurations, or training data provided by the Client remains the property of the Client. However, alfred ai may reuse generic components or configurations that do not contain confidential or proprietary Client information.</li>
                </ul>
                <h3 className="text-xl font-medium text-foreground mb-3">7.3 Third-Party Components</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  alfred ai may use open-source or third-party software libraries. The Client agrees to comply with the terms of any open-source or third-party licenses, which alfred ai shall disclose upon request.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">7.4 Restrictions</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>The Client shall not reverse-engineer, decompile, or otherwise attempt to derive the source code of alfred ai's proprietary components without prior written consent.</li>
                  <li>The Client shall not remove or alter any proprietary notices or legends contained in or on the AI Solution.</li>
                </ul>
                <h3 className="text-xl font-medium text-foreground mb-3">7.5 License to Use Client Marks</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Unless otherwise instructed in writing, alfred ai may reference the Client's name, logo, or trademark in marketing materials for the sole purpose of identifying the Client as a user of the AI Solution.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">7.6 Post-Termination Access</h3>
                <p className="text-muted-foreground leading-relaxed">
                  For 30 days after termination, alfred ai shall not disable or restrict the Client's access to the AI Solution unless a complete data export has been confirmed in writing by the Client.
                </p>
              </section>

              {/* 8. Data Processing, Protection and Security */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Processing, Protection and Security</h2>
                
                <h3 className="text-xl font-medium text-foreground mb-3">8.1 Data Processing Agreement (DPA)</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>In connection with the Services, alfred ai may process Personal Information on behalf of the Client.</li>
                  <li>alfred ai acts as a data processor and shall process Personal Information solely on documented instructions from the Client.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.2 Definitions</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>"Applicable Data Protection Laws"</strong> means the Privacy Act 1988 (Cth), the Australian Privacy Principles (APPs), the Notifiable Data Breaches Scheme, and any other applicable data protection legislation.</li>
                  <li><strong>"Personal Information"</strong> has the meaning given in the Privacy Act 1988 (Cth).</li>
                  <li><strong>"Client Data"</strong> means all data, including Personal Information, provided to or collected by alfred ai in connection with the Services.</li>
                  <li><strong>"Processing"</strong> means any operation performed on Personal Information, including collection, storage, use, disclosure, deletion, or destruction.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.3 Scope of Processing</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">alfred ai shall process Client Data solely for the purpose of providing the Services and shall not:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Use Client Data for AI model training</li>
                  <li>Use Client Data for product improvement unrelated to the Client</li>
                  <li>Sell, rent, disclose, or commercially exploit Client Data</li>
                  <li>Combine Client Data with other client datasets for cross-client analytics</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Client Data is logically segregated from other customer environments.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">8.4 Data Hosting and Residency</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Client Data shall be hosted within Australia in AWS Australia (Sydney region) and Oracle Australia East (Sydney region).</li>
                  <li>All production databases and system backups shall be maintained within Australian data centres.</li>
                  <li>Where AI-enabled functionality is used, AI model processing may occur outside Australia. alfred ai implements programmatic anonymisation to remove personally identifiable information prior to transmission. Sensitive or regulated data shall not be transmitted in identifiable form.</li>
                  <li>alfred ai complies with cross-border disclosure obligations under APP 8 where applicable.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.5 Security and Information Governance</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  alfred ai maintains an Information Security Management System aligned with ISO/IEC 27001 principles and implements appropriate technical and organisational measures including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Role-Based Access Control (RBAC)</li>
                  <li>Least-privilege access principles</li>
                  <li>Multi-factor authentication for administrative accounts</li>
                  <li>Encryption in transit (TLS 1.2 or higher)</li>
                  <li>Encryption at rest (AES-256 or equivalent)</li>
                  <li>Access logging and audit trails</li>
                  <li>Structured patch and vulnerability management processes</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Access to Client Data is restricted to authorised personnel bound by confidentiality and Non-Disclosure Agreements, and shall only occur where reasonably required for onboarding, support requests, system maintenance, or incident investigation.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">8.6 Sub-Processors</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>alfred ai may engage sub-processors including Stripe (payment processing), Xero (accounting integration), and OpenAI (AI processing).</li>
                  <li>Sub-processors are subject to written contractual obligations providing data protection standards no less protective than these terms.</li>
                  <li>alfred ai remains responsible for the acts and omissions of its sub-processors.</li>
                  <li>alfred ai must notify the Client when engaging any new sub-processor to process identifiable Client Data with at least five (5) Business Days' prior written notice.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.7 Data Breach and Incident Management</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  alfred ai maintains documented incident response procedures. In the event of a confirmed eligible data breach, alfred ai shall:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Notify the Client within one (1) business day of confirmation</li>
                  <li>Provide known details of the nature and scope of the breach</li>
                  <li>Outline remediation steps taken or proposed</li>
                  <li>Cooperate with the Client in meeting regulatory reporting obligations</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.8 Data Retention, Return and Deletion</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Upon termination, alfred ai shall provide a complete export of Client Data in a structured and commonly used format. Following confirmed transfer, production databases and backups containing Client Data shall be securely deleted.</li>
                  <li>Where deletion is requested during the term, alfred ai shall process such deletion within one (1) business day, subject to any legal retention obligations.</li>
                  <li>Residual system logs retained for compliance or security purposes remain protected under these terms.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">8.9 Audit Rights</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Upon reasonable written notice, the Client may request evidence of compliance with these data processing provisions. Evidence may include security policy summaries, certifications, or written compliance confirmations. Any audit shall be conducted in a manner that does not compromise the confidentiality or security of other customers.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">8.10 Survival</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Data processing, confidentiality, and regulatory obligations survive termination of any agreement to the extent necessary.
                </p>
              </section>

              {/* 9. Confidentiality */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Confidentiality</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Both Parties agree to keep confidential any proprietary or confidential information shared during the project, including but not limited to business data, code, training materials, and other sensitive information. This clause survives the termination of any agreement.
                </p>
              </section>

              {/* 10. Warranties & Disclaimers */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Warranties & Disclaimers</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">10.1 Performance Warranty</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  alfred ai warrants that the delivered AI Solution will substantially perform as described under normal conditions.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">10.2 No Guarantee of Outcomes</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Project "Success" metrics will be jointly defined at kickoff. Approximately 6 months post-delivery, the Parties will review performance against those KPIs. If outcomes fall short, alfred ai will continue reasonable efforts within scope and active maintenance to reach the agreed targets.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">10.3 Disclaimer</h3>
                <p className="text-muted-foreground leading-relaxed">
                  alfred ai does not warrant uninterrupted or error-free operation of the AI Solution, especially given reliance on third-party AI/LLM providers. Except as explicitly set forth herein, all express or implied warranties, including the implied warranties of merchantability and fitness for a particular purpose, are disclaimed to the extent allowed by law.
                </p>
              </section>

              {/* 11. Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
                <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                  <li>Neither Party shall be liable for any indirect, special, consequential, or incidental damages arising from the engagement.</li>
                  <li>alfred ai's total liability for any claim or damage shall not exceed the total amount paid by the Client under the applicable agreement.</li>
                  <li>
                    The above limitation shall not apply to limit liability in respect of:
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>A breach of data processing, protection and security obligations</li>
                      <li>Infringement of the Client's intellectual property rights</li>
                      <li>Fraud or wilful misconduct</li>
                      <li>Death or personal injury caused by negligence</li>
                    </ul>
                    <p className="mt-2">In respect of data breaches, alfred ai's total liability shall not exceed the lesser of $50,000 or two times (2×) the total fees paid by the Client.</p>
                  </li>
                </ul>
              </section>

              {/* 12. Indemnification */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Indemnification</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">12.1 Client Indemnification</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">The Client agrees to indemnify and hold harmless alfred ai from any claims, liabilities, or expenses (including reasonable legal fees) arising from:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>Misuse or unauthorized modification of the AI Solution by the Client</li>
                  <li>Third-party claims related to data or content uploaded by the Client</li>
                </ul>
                <h3 className="text-xl font-medium text-foreground mb-3">12.2 Security</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  alfred ai implements commercially reasonable administrative, technical, and physical safeguards to protect the Client's data. The Client remains responsible for maintaining the security of its own systems, login credentials, and user access protocols. alfred ai shall not be liable for any data breach resulting from the Client's failure to uphold its own security obligations.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">12.3 Developer Indemnification</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">alfred ai will indemnify the Client against third-party claims, to the extent directly caused by:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Infringement of a third party's intellectual property rights by the unmodified AI Solution</li>
                  <li>A Personal Data breach caused by alfred ai's material breach, negligence, or wilful misconduct</li>
                  <li>Bodily injury, death, or physical property damage caused by alfred ai's negligence</li>
                </ul>
              </section>

              {/* 13. Termination */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Termination</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">13.1 Termination for Cause</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Either Party may terminate the agreement upon material breach by the other Party if such breach is not remedied within fourteen (14) days after written notice.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">13.2 Effect of Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If terminated, the Client shall pay alfred ai for work completed up to the date of termination. Upon termination, all licenses granted to the Client immediately cease unless otherwise agreed in writing.
                </p>
              </section>

              {/* 14. Maintenance & Ongoing Improvements */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Maintenance & Ongoing Improvements</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">14.1 Initial Testing Period</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  After delivery, the Client has approximately 3–4 months for testing.
                </p>
                <h3 className="text-xl font-medium text-foreground mb-3">14.2 Post-Project Work</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Any enhancements, fine-tuning, or development outside the original scope will be charged at an hourly rate or lump sum, to be agreed upon in writing before work commences. Maintenance services are provided only while an active subscription is in place.
                </p>
              </section>

              {/* 15. Refund & Satisfaction Guarantee Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Refund & Satisfaction Guarantee Policy</h2>
                
                <h3 className="text-xl font-medium text-foreground mb-3">15.1 Subscription Services</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Monthly Subscriptions:</strong> First-month subscriptions are non-refundable once activated. You may cancel anytime to avoid further billing. No partial refunds for unused time.</li>
                  <li><strong>Annual Subscriptions:</strong> May be refunded within 14 days of activation if unused. After this period or upon active usage, no refunds apply, but you can stop auto-renewal at any time.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">15.2 Custom AI Development Projects</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Discovery & Design Phase:</strong> During the first 14 days, clients receive strategy consultation, workflow mapping, and initial prototypes. If unsatisfied during this phase, clients may exit with a 50% refund of the paid Setup Fee, before milestone sign-off and before custom development begins.</li>
                  <li><strong>Development & Delivery Phase:</strong> Once Discovery Phase outcomes are approved, the project moves into Development Phase, after which no refunds apply. alfred ai ensures on-time delivery, adherence to scope, and bug fixes/minor adjustments at no extra cost within scope.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">15.3 Stop Work Flexibility</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  At any point during the Development Phase, you may pause or terminate the project, ceasing future milestone payments. All prior payments remain non-refundable for completed phases. On termination, you retain rights to all completed and paid-for deliverables, but unfinished work will cease immediately with no further financial obligation beyond work completed.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">15.4 Service Downtime</h3>
                <p className="text-muted-foreground leading-relaxed">
                  In case of alfred ai platform-wide outages exceeding 72 hours, you may be eligible for service credit or subscription extension, not cash refunds.
                </p>
              </section>

              {/* 16. Service Levels & Support (SLA) */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">16. Service Levels & Support (SLA)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 italic">
                  This section applies while the Client maintains an active maintenance subscription.
                </p>
                
                <h3 className="text-xl font-medium text-foreground mb-3">16.1 Platform Availability</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The alfred ai platform will be available 99.9% of the time per calendar month after full launch, excluding scheduled maintenance, emergency maintenance, third-party outages, and force majeure events. Planned maintenance will be scheduled outside business hours where reasonably practicable.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">16.2 Support & Incident Response</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">Support is provided via email (support@alfredai.bot) and ticketing system (where applicable).</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Severity 1 – Emergency:</strong> Platform outage or critical failure with no viable workaround. Response Time: within 1 to 12 hours. Immediate prioritisation until service is restored.</li>
                  <li><strong>Severity 2 – High:</strong> Major functionality impaired but workaround exists. Response Time: within 1 business day.</li>
                  <li><strong>Severity 3 – Normal:</strong> Non-critical issue, cosmetic defect, or general inquiry. Response Time: within 2–3 business days.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">16.3 What the Monthly Retainer Includes</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li><strong>Hosting & Operations:</strong> Cloud hosting, monitoring, uptime management, and basic performance optimisation.</li>
                  <li><strong>Support & Maintenance:</strong> Bug fixes, defect remediation, platform updates, security patches, and compatibility updates.</li>
                  <li><strong>Minor Enhancements:</strong> Up to three (3) hours per month of minor enhancements (prompt tuning, small logic refinements, minor template adjustments, dashboard refinements). Unused hours do not roll over.</li>
                  <li><strong>Usage & Performance Reporting:</strong> Usage monitoring, high-level performance insights, and support for KPI tracking.</li>
                  <li><strong>Advisory Support:</strong> Reasonable guidance on best-practice usage and recommendations for optimisation within existing scope.</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">16.4 SLA Exclusions</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">The following are excluded unless agreed in writing:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                  <li>New AI agents or workflows</li>
                  <li>Material scope expansion</li>
                  <li>Large-scale retraining or re-implementation</li>
                  <li>Client-side system failures or credential issues</li>
                  <li>Third-party software licensing or usage fees</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">16.5 Service Credits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If a platform-wide outage exceeds 72 continuous hours, the Client may be eligible for a pro-rata service credit or subscription extension. Service credits are not cash-refundable and must be requested in writing.
                </p>
              </section>

              {/* 17. Dispute Resolution */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">17. Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To raise an issue, contact <a href="mailto:support@alfredai.bot" className="text-primary hover:underline">support@alfredai.bot</a>. We resolve concerns first through service adjustments or credits.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If a dispute arises, the Parties agree to attempt to resolve it through good-faith negotiation. If unresolved, they agree to consider mediation or arbitration before proceeding to litigation.
                </p>
              </section>

              {/* 18. Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">18. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Service are governed by and construed in accordance with the laws of Australia (and specifically the state or territory where the contract is formed, if relevant). The Parties submit to the exclusive jurisdiction of the courts of that state or territory.
                </p>
              </section>

              {/* 19. General */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">19. General</h2>
                <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                  <li><strong>Assignment:</strong> Neither Party may assign without consent (not unreasonably withheld).</li>
                  <li><strong>Force Majeure:</strong> Neither Party is liable for events beyond reasonable control.</li>
                  <li><strong>Severability:</strong> Invalid provisions do not affect the remainder.</li>
                  <li><strong>Notices:</strong> Notices must be in writing to the addresses provided.</li>
                  <li><strong>Entire Agreement:</strong> These terms and any applicable schedules constitute the entire agreement.</li>
                  <li><strong>Counterparts:</strong> Agreements may be executed electronically and in counterparts.</li>
                </ul>
              </section>

              {/* 20. Contact Us */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">20. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                  <p className="text-foreground font-medium">Alfred AI Agent Services Pty Ltd</p>
                  <p className="text-muted-foreground">ABN: 62 864 936 525</p>
                  <p className="text-muted-foreground">Level 35, International Tower One, Barangaroo NSW 2000</p>
                  <p className="text-muted-foreground">Email: <a href="mailto:support@alfredai.bot" className="text-primary hover:underline">support@alfredai.bot</a></p>
                  <p className="text-muted-foreground">Support: <a href="mailto:support@alfredai.bot" className="text-primary hover:underline">support@alfredai.bot</a></p>
                </div>
              </section>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
