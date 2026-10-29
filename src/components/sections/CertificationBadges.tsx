const CREDENTIALS = [
  { name: "ISO 27001:2022", detail: "Audited & Certified by GCC" },
  { name: "SOC 2 Type II", detail: "Audited by GCC, Monitored by Vanta" },
  { name: "GDPR", detail: "Audited by GCC, Monitored by Vanta" },
  { name: "PDPA", detail: "Supported Compliance" },
  { name: "Australian Privacy Act", detail: "Supported Compliance" },
];

/**
 * Compliance / certification trust strip. Sits under the hero CTAs.
 * Temporarily rendered as text chips instead of badge images while final
 * badge assets are being prepared.
 */
const CertificationBadges = () => (
  <div className="mt-6 px-4 sm:px-0">
    <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/40 text-center lg:text-left">
      Certified &amp; compliant
    </p>
    <ul className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
      {CREDENTIALS.map((cred) => (
        <li key={cred.name} className="shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:px-3.5 sm:py-2">
            <span className="text-xs font-medium text-white/90">{cred.name}</span>
            <span className="text-[10px] text-white/50 hidden sm:inline">{cred.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default CertificationBadges;
