import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import LazyImage from "@/components/ui/lazy-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileSignature, ArrowRight } from "lucide-react";

// Import logo images
import oracleLogo from "@/assets/logos/oracle.png";
import xeroLogo from "@/assets/logos/xero.png";
import gohighlevelLogo from "@/assets/logos/gohighlevel.png";
import pleasesignLogo from "@/assets/logos/pleasesign.png";
import vapiLogo from "@/assets/logos/vapi.png";
import accountableLinkLogo from "@/assets/logos/accountable-black.png";
import sitevoiceLogo from "@/assets/logos/sitevoice.png.asset.json";
import windowmakerLogo from "@/assets/logos/windowmaker.png.asset.json";


// SVG logos for partners without image files
const AWSLogo = () => (
  <svg viewBox="0 0 100 60" className="h-8 w-auto fill-current">
    <path d="M28.5 24.5c0 1.2.1 2.2.4 2.9.2.5.4 1 .8 1.6.1.2.2.3.2.5 0 .2-.1.4-.4.6l-1.3.9c-.2.1-.4.2-.5.2-.2 0-.4-.1-.6-.3-.3-.3-.5-.6-.7-1-.2-.4-.4-.8-.6-1.3-1.6 1.9-3.6 2.8-6 2.8-1.7 0-3.1-.5-4.1-1.5-1-.9-1.5-2.2-1.5-3.8 0-1.7.6-3 1.8-4.1 1.2-1 2.8-1.5 4.8-1.5.7 0 1.4 0 2.1.1.7.1 1.5.2 2.3.4v-1.4c0-1.5-.3-2.6-1-3.2-.6-.6-1.7-.9-3.2-.9-.7 0-1.4.1-2.1.3-.7.2-1.5.4-2.2.8-.3.2-.6.3-.7.3-.2 0-.3-.1-.3-.4v-1c0-.3 0-.5.1-.6.1-.1.3-.3.5-.4.7-.4 1.6-.7 2.6-.9 1-.3 2-.4 3.1-.4 2.4 0 4.1.5 5.2 1.6 1.1 1.1 1.6 2.7 1.6 4.9v6.4zm-8.2 3.1c.7 0 1.4-.1 2.1-.4.8-.3 1.4-.7 2-1.4.4-.4.6-.9.7-1.4.1-.5.2-1.2.2-2v-1c-.6-.1-1.2-.2-1.9-.3-.7-.1-1.4-.1-2-.1-1.3 0-2.3.3-2.9.8-.6.5-.9 1.3-.9 2.3 0 .9.2 1.6.7 2.1.5.5 1.2.7 2 .7v.7zm16.3 2.2c-.3 0-.5 0-.6-.1-.1-.1-.3-.3-.4-.6l-4.5-14.8c-.1-.2-.1-.4-.1-.5 0-.3.1-.4.4-.4h2c.3 0 .5 0 .6.1.1.1.2.3.3.6l3.2 12.6 3-12.6c.1-.3.2-.5.3-.6.1-.1.4-.1.7-.1h1.6c.3 0 .5 0 .7.1.1.1.2.3.3.6l3 12.8 3.3-12.8c.1-.3.2-.5.3-.6.2-.1.4-.1.6-.1h1.9c.3 0 .4.1.4.4 0 .1 0 .2 0 .3 0 .1-.1.3-.1.4l-4.6 14.8c-.1.3-.2.5-.4.6-.1.1-.4.1-.6.1h-1.8c-.3 0-.5 0-.6-.1-.1-.1-.2-.3-.3-.6l-2.9-12.3-2.9 12.3c-.1.3-.2.5-.3.6-.2.1-.4.1-.7.1h-1.8zm26.1.6c-1 0-2.1-.1-3-.4-.9-.3-1.7-.6-2.2-1-.3-.2-.5-.5-.6-.7 0-.1-.1-.3-.1-.4v-1.1c0-.3.1-.5.4-.5.1 0 .2 0 .3 0 .1.1.3.1.5.2.7.3 1.4.6 2.2.7.8.2 1.6.3 2.4.3 1.3 0 2.3-.2 3-.7.7-.5 1-1.1 1-2 0-.6-.2-1.1-.5-1.4-.4-.4-.9-.7-1.8-1l-2.5-.8c-1.3-.4-2.3-1-3-1.8-.6-.8-1-1.7-1-2.8 0-.8.2-1.5.5-2.1.4-.6.8-1.2 1.4-1.6.6-.4 1.2-.8 2-.9.8-.2 1.6-.3 2.4-.3.4 0 .9 0 1.3.1.5 0 .9.1 1.3.2.4.1.8.2 1.2.3.4.1.7.3.9.4.3.2.5.3.6.5.1.2.2.4.2.7v1c0 .3-.1.5-.4.5-.1 0-.4-.1-.6-.2-1-.4-2.1-.6-3.3-.6-1.1 0-2 .2-2.6.6-.6.4-.9.9-.9 1.7 0 .6.2 1 .6 1.4.4.4 1 .7 1.9 1l2.5.8c1.3.4 2.2 1 2.8 1.7.6.7.9 1.6.9 2.6 0 .8-.2 1.6-.5 2.2-.3.7-.8 1.2-1.4 1.7-.6.5-1.3.8-2.1 1-.9.3-1.7.4-2.7.4z"/>
    <path d="M76.8 38.2c-8.5 6.3-20.8 9.6-31.4 9.6-14.9 0-28.3-5.5-38.4-14.6-.8-.7-.1-1.7.9-1.1 10.9 6.4 24.5 10.2 38.4 10.2 9.4 0 19.8-2 29.3-6 1.4-.6 2.6 1 1.2 1.9z" className="fill-[#FF9900]"/>
    <path d="M80.1 34.4c-1.1-1.4-7.3-.7-10.1-.3-.8.1-1-.6-.2-1.1 4.9-3.5 13-2.5 14-.1.9 2.3-.3 7.5-4.9 10.6-.7.5-1.4.2-1.1-.4 1.1-2.7 3.4-8.3 2.3-9.7z" className="fill-[#FF9900]"/>
  </svg>
);

const DropboxLogo = () => (
  <svg viewBox="0 0 43 40" className="h-8 w-auto">
    <path d="M12.6 0L0 8.2l8.6 6.9 12.5-8.2L12.6 0zM0 22l12.6 8.2 8.5-6.9-12.5-8.1L0 22zm21.1 1.3l8.5 6.9L42.2 22l-8.6-6.8-12.5 8.1zM42.2 8.2L29.6 0l-8.5 6.9 12.5 8.2 8.6-6.9zM21.1 24.5L12.6 31l-4-.9v3l12.5 7.5 12.5-7.5v-3l-4 .9-8.5-6.5z" className="fill-[#0061FF]"/>
  </svg>
);

const ElevenLabsLogo = () => (
  <svg viewBox="0 0 60 40" className="h-7 w-auto fill-current">
    <rect x="15" y="5" width="10" height="30" rx="2"/>
    <rect x="35" y="5" width="10" height="30" rx="2"/>
  </svg>
);



type Partner = {
  name: string;
  displayName: string;
  logo: React.ReactNode | string;
  description: string;
  isImage?: boolean;
  isText?: boolean;
  small?: boolean;
};

const partners: Partner[] = [
  { name: "AWS", displayName: "AWS", logo: <AWSLogo />, description: "Cloud infrastructure and hosting backbone for alfred ai's scalable, secure services." },
  { name: "Oracle", displayName: "Oracle", logo: oracleLogo, isImage: true, small: true, description: "Enterprise database and ERP integrations for large organisations." },
  { name: "Dropbox", displayName: "Dropbox", logo: <DropboxLogo />, description: "Secure document storage and file sharing for workflow attachments." },
  { name: "Xero", displayName: "Xero", logo: xeroLogo, isImage: true, description: "Accounting and bookkeeping integration for financial workflows." },
  { name: "ElevenLabs", displayName: "ElevenLabs", logo: <ElevenLabsLogo />, description: "Lifelike text-to-speech voices for AI-powered voice interactions." },
  { name: "SiteVoice", displayName: "SiteVoice", logo: sitevoiceLogo.url, isImage: true, description: "Conversational AI and site-based voice assistance for operations." },
  { name: "Windowmaker", displayName: "Windowmaker", logo: windowmakerLogo.url, isImage: true, description: "Window and door manufacturing ERP integration for fabricators." },
  { name: "Accountable.link", displayName: "Accountable.link", logo: accountableLinkLogo, isImage: true, description: "The alfred ai operating system and accountability layer for project control." },
  { name: "GoHighLevel", displayName: "GoHighLevel", logo: gohighlevelLogo, isImage: true, description: "CRM and marketing automation integration for lead and customer management." },
  { name: "VAPI", displayName: "VAPI", logo: vapiLogo, isImage: true, description: "Voice AI infrastructure powering natural, human-like phone conversations." },
  { name: "PleaseSign", displayName: "PleaseSign", logo: pleasesignLogo, isImage: true, description: "Digital signature engine embedded into the ERP module." },
];

const TechPartnersSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [showPleaseSign, setShowPleaseSign] = useState(false);

  

  return (
    <section ref={ref} className="py-16 bg-background overflow-hidden">
      <div className="container-wide">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-8"
        >
          Powered by world-class technology
        </motion.p>

        {/* Infinite scrolling logo strip */}
        <div className="relative overflow-hidden group/scroll">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          <TooltipProvider delayDuration={150}>
            <div
              className="flex gap-8 animate-scroll-x group-hover/scroll:[animation-play-state:paused]"
              style={{ width: 'max-content' }}
            >
              {/* Double the logos for seamless loop */}
              {[...partners, ...partners].map((partner, index) => (
                <Tooltip key={`${partner.name}-${index}`}>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 h-20 px-4 flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:opacity-70"
                      onClick={() => partner.name === 'PleaseSign' && setShowPleaseSign(true)}
                    >
                      {partner.isText ? (
                        <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap tracking-wide">
                          {partner.logo as string}
                        </span>
                      ) : partner.isImage ? (
                        <LazyImage 
                          src={partner.logo as string} 
                          alt={partner.displayName} 
                          className={`${partner.small ? 'h-5' : 'h-8'} w-auto object-contain`}
                          wrapperClassName={`${partner.small ? 'h-5' : 'h-8'} ${partner.small ? 'w-14' : 'w-20'}`}
                        />
                      ) : (
                        <div className="text-muted-foreground flex items-center justify-center">
                          {partner.logo}
                        </div>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="max-w-[16rem] text-center p-3">
                    <p className="text-sm leading-relaxed">{partner.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* PleaseSign Dialog */}
      <Dialog open={showPleaseSign} onOpenChange={setShowPleaseSign}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              PleaseSign
            </DialogTitle>
            <DialogDescription>
              Digital signature engine powering alfred ai
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-foreground leading-relaxed">
              PleaseSign is fully embedded and plugged into alfred ai's ERP module — <strong>app.Accountable.link</strong> — as the digital signature engine, allowing documents to be sent for signing and automatically push the signed outcome back into workflows, records, and accountability tracking.
            </p>
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 border border-border/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Send documents for digital signature</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Auto-push signed outcomes into workflows</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Integrated accountability tracking</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TechPartnersSection;
