import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  Users,
  Cookie,
  Clock,
  UserCheck,
  AlertTriangle,
  Bug,
  Globe,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const SECURITY_EMAIL = "security@alfredai.bot";
const PRIVACY_EMAIL = "privacy@alfredai.bot";
const SUPPORT_EMAIL = "support@alfredai.bot";

const credentials = [
  {
    name: "ISO 27001:2022",
    subtitle: "Audited & Certified by GCC",
    description:
      "alfred ai is ISO 27001:2022 certified, independently audited and issued by Global Compliance Certification (GCC) — confirming a formally maintained Information Security Management System (ISMS) that meets the highest international standard for information security governance.",
  },
  {
    name: "SOC 2 Type II",
    subtitle: "Audited by GCC, Monitored by Vanta",
    description:
      "alfred ai has achieved SOC 2 Type II attestation, independently audited by Global Compliance Certification (GCC) and continuously monitored by Vanta — verifying that our security, availability, and confidentiality controls operate effectively over a sustained period, not just at a point in time.",
  },
  {
    name: "GDPR",
    subtitle: "Audited by GCC, Monitored by Vanta",
    description:
      "alfred ai is GDPR compliant, independently audited by Global Compliance Certification (GCC) and continuously monitored by Vanta — with privacy-by-design architecture governing the collection, storage, and processing of personal data in accordance with EU Regulation 2016/679.",
  },
  {
    name: "PDPA",
    subtitle: "Supported Compliance",
    description:
      "alfred ai supports compliance with the Singapore Personal Data Protection Act (PDPA), with documented controls governing the collection, use, and disclosure of personal data in accordance with obligations set out by the Personal Data Protection Commission (PDPC).",
  },
  {
    name: "Australian Privacy Act",
    subtitle: "Supported Compliance",
    description:
      "alfred ai supports compliance with the Australian Privacy Act 1988 and the Australian Privacy Principles, ensuring data handling across all Australian operations meets the standards set by the Office of the Australian Information Commissioner (OAIC).",
  },
];

interface Section {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  body: React.ReactNode;
}

const TrustCenterPage = () => {
  const sections: Section[] = [
    {
      id: "access",
      icon: Lock,
      title: "Access & authentication",
      body: (
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Administrative access is protected by authenticated accounts with role-based permissions.</li>
          <li>Access to client systems is granted on a least-privilege basis and reviewed regularly.</li>
          <li>Activity within our admin tools is logged for accountability.</li>
        </ul>
      ),
    },
    {
      id: "hosting",
      icon: Server,
      title: "Platform & hosting",
      body: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            alfred ai builds customised AI and software solutions for the construction industry. Our
            applications and backend run on managed cloud infrastructure with encryption in transit
            (HTTPS/TLS) and encryption at rest provided by the underlying platform.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Globe className="h-4 w-4 text-primary" /> Hosting region:
            </span>{" "}
            Production data is hosted in Australia by default. Where a client requires a specific data
            residency arrangement, we confirm the region as part of the project scope.
          </p>
        </>
      ),
    },
    {
      id: "data",
      icon: Database,
      title: "Data collection & use",
      body: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We collect only the information needed to deliver and support your solution — contact
            details you provide, usage data from our applications, and the project data you choose to
            process with us. We do not sell personal information.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            How your data is used in a delivered solution is defined with you during the project and
            documented in your agreement.
          </p>
        </>
      ),
    },
    {
      id: "subprocessors",
      icon: Users,
      title: "Subprocessors & integrations",
      body: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            We rely on a small number of trusted subprocessors to operate our services — including
            managed cloud hosting and backend infrastructure, email delivery, and analytics. Each is
            bound by confidentiality and data-protection obligations.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            A current list of subprocessors relevant to your solution is available on request at{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary hover:underline">
              {PRIVACY_EMAIL}
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      icon: Cookie,
      title: "Cookies & analytics",
      body: (
        <p className="text-muted-foreground leading-relaxed">
          Our website uses cookies and analytics to understand how visitors use the site and to
          improve it. You can control cookies through your browser settings. See our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          for detail on what we collect.
        </p>
      ),
    },
    {
      id: "retention",
      icon: Clock,
      title: "Retention & deletion",
      body: (
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Sales and enquiry records are retained for up to 24 months from last contact, unless a longer period is required by law.</li>
          <li>Client project data is retained for the duration of the engagement and a defined wind-down period agreed in your contract.</li>
          <li>On request, and subject to legal obligations, we delete or return personal data after a project ends.</li>
        </ul>
      ),
    },
    {
      id: "privacy-requests",
      icon: UserCheck,
      title: "Privacy requests",
      body: (
        <p className="text-muted-foreground leading-relaxed">
          You can request access to, correction of, or deletion of your personal information, or
          object to certain processing. Email{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary hover:underline">
            {PRIVACY_EMAIL}
          </a>{" "}
          and we will respond within the timeframes required by applicable law. A Data Processing
          Agreement (DPA) is available for clients on request.
        </p>
      ),
    },
    {
      id: "incident",
      icon: AlertTriangle,
      title: "Security & incident contact",
      body: (
        <p className="text-muted-foreground leading-relaxed">
          For security questions or to report a suspected incident, contact our security team at{" "}
          <a href={`mailto:${SECURITY_EMAIL}`} className="text-primary hover:underline">
            {SECURITY_EMAIL}
          </a>
          . We investigate reports promptly and notify affected clients in line with our contractual
          and legal obligations.
        </p>
      ),
    },
    {
      id: "vulnerability",
      icon: Bug,
      title: "Vulnerability reporting",
      body: (
        <p className="text-muted-foreground leading-relaxed">
          If you believe you have found a security vulnerability, please report it responsibly to{" "}
          <a href={`mailto:${SECURITY_EMAIL}`} className="text-primary hover:underline">
            {SECURITY_EMAIL}
          </a>
          . Include the steps to reproduce and any relevant detail. Please give us a reasonable
          opportunity to resolve the issue before any public disclosure.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trust Center"
        description="How alfred ai protects your data — security, privacy, hosting, subprocessors, retention and compliance for our customised AI and software solutions."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Trust Center", url: "/trust" },
        ]}
      />
      <Header />
      <main className="pt-24 pb-16 relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        <section className="container-wide py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="h-4 w-4" /> Trust Center
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Security, privacy & trust
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-3xl">
              This page is maintained by alfred ai to answer common security and privacy questions
              about how we build and run customised AI and software solutions for the construction
              industry.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-12">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <a
              href="https://trust.alfredai.bot/"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-card/80 transition-colors mb-12"
            >
              <ExternalLink className="h-4 w-4 text-primary" />
              View the verified alfred ai Trust Center
            </a>


            {/* Certifications & compliance */}
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 mb-12">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Certifications & compliance</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                alfred ai's security and privacy credentials are independently audited by{" "}
                <strong className="text-foreground">Global Compliance Certification (GCC)</strong>,
                covering <strong className="text-foreground">ISO 27001:2022</strong>,{" "}
                <strong className="text-foreground">SOC 2 Type II</strong>, and{" "}
                <strong className="text-foreground">GDPR</strong> — with continuous compliance
                monitoring powered by <strong className="text-foreground">Vanta</strong>. alfred ai
                also supports compliance with the{" "}
                <strong className="text-foreground">Singapore Personal Data Protection Act (PDPA)</strong>{" "}
                and the <strong className="text-foreground">Australian Privacy Act 1988</strong>,
                ensuring multi-jurisdictional data privacy governance across all client environments.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {credentials.map((cred) => (
                  <div
                    key={cred.name}
                    className="rounded-xl border border-border bg-background/60 p-5"
                  >
                    <div className="mb-2">
                      <span className="font-semibold text-foreground">{cred.name}</span>
                    </div>
                    <p className="text-xs font-medium text-primary mb-3">{cred.subtitle}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{cred.description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-5 mb-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-foreground mb-4">Capability summary</h3>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 pr-4 font-semibold text-foreground">Credential</th>
                        <th className="text-left py-3 pr-4 font-semibold text-foreground">Audited By</th>
                        <th className="text-left py-3 pr-4 font-semibold text-foreground">Monitored By</th>
                        <th className="text-left py-3 font-semibold text-foreground">Scope</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium text-foreground">ISO 27001:2022</td>
                        <td className="py-3 pr-4">GCC (Global Compliance Certification)</td>
                        <td className="py-3 pr-4">Vanta</td>
                        <td className="py-3">Information Security Management System</td>
                      </tr>
                      <tr className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium text-foreground">SOC 2 Type II</td>
                        <td className="py-3 pr-4">GCC (Global Compliance Certification)</td>
                        <td className="py-3 pr-4">Vanta</td>
                        <td className="py-3">Security, availability, and confidentiality controls</td>
                      </tr>
                      <tr className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium text-foreground">GDPR</td>
                        <td className="py-3 pr-4">GCC (Global Compliance Certification)</td>
                        <td className="py-3 pr-4">Vanta</td>
                        <td className="py-3">EU personal data processing and privacy-by-design</td>
                      </tr>
                      <tr className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium text-foreground">PDPA</td>
                        <td className="py-3 pr-4">Supported compliance</td>
                        <td className="py-3 pr-4">—</td>
                        <td className="py-3">Singapore personal data protection obligations</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-medium text-foreground">Australian Privacy Act</td>
                        <td className="py-3 pr-4">Supported compliance</td>
                        <td className="py-3 pr-4">—</td>
                        <td className="py-3">Australian Privacy Principles</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/70">
                This page is app-owned content maintained by alfred ai. ISO 27001:2022, SOC 2 Type II
                and GDPR are independently audited by GCC and continuously monitored by Vanta. PDPA
                and the Australian Privacy Act are supported compliance — governed by documented
                internal controls rather than an external audit.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(index * 0.04, 0.2) }}
                    className="rounded-2xl border border-border bg-card/50 p-6 md:p-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    {section.body}
                  </motion.section>
                );
              })}
            </div>

            {/* Shared responsibility */}
            <div className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 mt-12">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
                Shared responsibility
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Security is a shared responsibility. alfred ai is responsible for building and
                operating your solution securely and for the controls described on this page. Clients
                are responsible for managing their own user accounts and access, and for the data they
                choose to process. Specific responsibilities are set out in your agreement.
              </p>
            </div>

            {/* Contact */}
            <div className="text-center mt-12">
              <p className="text-muted-foreground">
                Questions about security, privacy or compliance? Email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                or visit our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contact page
                </a>
                .
              </p>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrustCenterPage;
