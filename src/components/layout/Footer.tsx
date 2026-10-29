import { forwardRef, memo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Youtube, Instagram } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import alfredLogo from "@/assets/alfred-ai-white-mid.png";
import { CONTACT_INFO } from "@/lib/contactInfo";
import { CursorGlow } from "@/components/effects/CursorGlow";

const FooterInner = () => {
  const footerLinks = {
    explore: [
      { label: "Products", href: "/products" },
      { label: "Solutions", href: "/solutions" },
      // { label: "Impact Studies", href: "/impact-studies" }, // temporarily hidden
      { label: "Resources", href: "/resources" },
      { label: "Pricing", href: "/pricing" },
      { label: "DIY Quote", href: "/explained/pricing/diy-quote" },
    ],
    compare: {
      featured: [
        { label: "How We're Different", href: "/compare" },
      ],
      groups: [
        {
          title: "Construction",
          items: [
            { label: "vs Procore", href: "/compare/vs-procore" },
            { label: "vs ProcurePro", href: "/compare/vs-procurepro" },
            { label: "vs Trimble & Aconex", href: "/compare/vs-construction-enterprise" },
            { label: "vs BuildTools", href: "/compare/vs-construction-builders" },
            { label: "vs Buildpass", href: "/compare/vs-buildpass" },
            { label: "vs Jobber", href: "/compare/vs-jobber" },
          ],
        },
        {
          title: "Productivity",
          items: [
            { label: "vs Monday", href: "/compare/vs-monday" },
            { label: "vs Notion", href: "/compare/vs-notion" },
            { label: "vs Asana", href: "/compare/vs-asana" },
            { label: "vs ClickUp", href: "/compare/vs-clickup" },
          ],
        },
        {
          title: "Automation",
          items: [
            { label: "vs Zapier", href: "/compare/vs-zapier" },
            { label: "vs Make", href: "/compare/vs-make" },
            { label: "vs n8n", href: "/compare/vs-n8n" },
          ],
        },
        {
          title: "CRM & Marketing",
          items: [
            { label: "vs Pipedrive", href: "/compare/vs-pipedrive" },
            { label: "vs GoHighLevel", href: "/compare/vs-gohighlevel" },
          ],
        },
        {
          title: "AI Assistants",
          items: [
            { label: "vs ChatGPT", href: "/compare/vs-chatgpt" },
            { label: "vs Claude", href: "/compare/vs-claude" },
          ],
        },
        {
          title: "Development",
          items: [
            
          ],
        },
      ],
    },
    company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partners", href: "/partners" },
      { label: "Investors", href: "/investors" },
    ],
    help: [
      { label: "Get Started", href: "/signup" },
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Book an Impact Conversation", href: "https://new.alfredai.bot/book" },
      { label: "FAQ", href: "/faq" },
    ],
    legal: [
      { label: "Trust Center", href: "/trust" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Unsubscribe", href: "/unsubscribe" },
    ],
  };

  return (
    <CursorGlow as="footer" className="relative z-50 bg-[hsl(220,25%,8%)] text-white overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[200px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[150px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="container-wide py-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center mb-3">
              <img 
                src={alfredLogo} 
                alt="alfred ai" 
                className="h-7 w-auto flex-shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-3">
              The AI operating layer for mid-market firms. Execution, accountability, and scale — without adding headcount.
            </p>
            {/* Contact Info */}
            <div className="space-y-1.5 text-xs text-white/50 border-t border-white/10 pt-3">
              <a href={`mailto:${CONTACT_INFO.email.general}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-3 h-3" />
                {CONTACT_INFO.email.general}
              </a>
              <a href={CONTACT_INFO.phoneHref} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3 h-3" />
                {CONTACT_INFO.phone}
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{CONTACT_INFO.location.short}</span>
              </div>
              <a href={CONTACT_INFO.social.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </a>
              <a href={CONTACT_INFO.social.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <Youtube className="w-3 h-3" />
                YouTube
              </a>
              <a href={CONTACT_INFO.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <Instagram className="w-3 h-3" />
                Instagram
              </a>
              <a href={CONTACT_INFO.social.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <TikTokIcon className="w-3 h-3" />
                TikTok
              </a>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-white/40">Explore</h4>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Compare Links - Grouped */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-white/40">Compare</h4>
            
            {/* Featured link */}
            <ul className="space-y-2 mb-3">
              {footerLinks.compare.featured.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Grouped categories */}
            <div className="space-y-3">
              {footerLinks.compare.groups.map((group) => (
                <div key={group.title}>
                  <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
                    {group.title}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {group.items.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-white/40">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help & Legal Links */}
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-white/40">Help</h4>
            <ul className="space-y-2">
              {footerLinks.help.map((link) => (
                <li key={link.href}><Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
            <h4 className="font-semibold mb-3 mt-5 text-xs uppercase tracking-wider text-white/40">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  {'external' in link && link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} alfred ai. All rights reserved.
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-white/40">Serving</span>
            {CONTACT_INFO.serviceRegions.map((region, index) => (
              <span key={region.code} className="text-xs text-white/40">
                {region.name}{index < CONTACT_INFO.serviceRegions.length - 1 ? " •" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CursorGlow>
  );
};

const Footer = memo(forwardRef<HTMLElement, Record<string, never>>((props, ref) => {
  const footerRef = useRef<HTMLDivElement>(null);

  // Set CSS variable for footer height so overlays can stop above it
  useEffect(() => {
    let rafId: number;
    const updateFooterHeight = () => {
      rafId = requestAnimationFrame(() => {
        if (footerRef.current) {
          const height = footerRef.current.offsetHeight;
          document.documentElement.style.setProperty('--footer-height', `${height}px`);
        }
      });
    };
    
    updateFooterHeight();
    window.addEventListener('resize', updateFooterHeight);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateFooterHeight);
    };
  }, []);

  return (
    <div ref={footerRef}>
      <FooterInner />
    </div>
  );
}));

Footer.displayName = 'Footer';

export default Footer;
