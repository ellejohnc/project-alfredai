/** The Forge pillars, as data. */

import { Bot, Radar, LayoutGrid, ArrowRight, Check, Handshake } from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";
import { OmegaIcon } from "@/components/icons/OmegaIcon";
import accountableLinkLogo from "@/assets/logos/accountable-link-icon.png";
import accountableOsScreenshot from "@/assets/products/accountable-os-screenshot.png.asset.json";
import butlerScreenshot from "@/assets/products/butler-screenshot.webp";
import evaIcon from "@/assets/eva-icon.png.asset.json";
import forgeScreenshot from "@/assets/products/forge-screenshot.png";
import reoScreenshot from "@/assets/products/omega-screenshot.png.asset.json";
import watchScreenshot from "@/assets/products/watch-screenshot.webp";
import { type Pillar } from './ForgeCard';

export const pillars: Pillar[] = [
  {
    id: "axiom",
    number: "01",
    name: "Axiom",
    tagline: "Custom AI learning for your business",
    description:
      "Machine learning deep tech trained on your data, your processes, and your decisions. Axiom turns your institutional knowledge into models that get sharper the more your business runs.",
    highlights: ["Bespoke model training", "Learns from your data", "Continuously improving"],
    icon: Engine6,
    screenshot: forgeScreenshot,
  },
  {
    id: "omega",
    number: "02",
    name: "Omega",
    tagline: "Your organisation's living intelligence",
    description:
      "The living intelligence layer. Omega holds every workflow, lesson, project insight and decision the company has ever produced — and keeps it alive. It generates the right SOP or playbook for the job at hand, so your team and Butler agents have exactly what they need to act, always with your approval.",
    highlights: ["Generates SOPs & playbooks", "Makes knowledge usable", "Human approval gates"],
    icon: OmegaIcon,
    accent: true,
    screenshot: reoScreenshot.url,
  },
  {
    id: "butler",
    number: "03",
    name: "Butler",
    tagline: "AI agents that serve your teams",
    description:
      "Agentic AI that works alongside your people — handling the repetitive, coordinating the complex, and freeing your teams to focus on the work that moves the business forward.",
    highlights: ["Always-on agents", "Embedded in workflows", "Scales without headcount"],
    icon: Bot,
    screenshot: butlerScreenshot,
  },
  {
    id: "watch",
    number: "04",
    name: "Watch",
    tagline: "Mission Control for owners and operators",
    description:
      "See what's coming before it lands. Watch surfaces forward-looking signals, risks, and opportunities so leadership can act early instead of reacting late.",
    highlights: ["Predictive signals", "Owner-level visibility", "Early-warning insights"],
    icon: Radar,
    screenshot: watchScreenshot,
  },

  {
    id: "aos",
    number: "05",
    name: "AOS",
    tagline: "The Agentic Operating System for your business",
    description:
      "AOS connects your team, tools, and daily work into one place. It links the software you already use, automates routine tasks, tracks who owns what, and gives your business clearer visibility and control.",
    highlights: ["Connects your tools & teams", "Automates routine work", "Tracks ownership & accountability"],
    icon: LayoutGrid,
    accent: true,
    logo: accountableLinkLogo,
    screenshot: accountableOsScreenshot.url,
  },
  {
    id: "eva",
    number: "",
    name: "EVA",
    tagline: "Secure personal AI inside enterprise work",
    description:
      "An AI security guard that lets employees and contractors use personal AI without leaking enterprise data or injecting private personal memory into company workflows.",
    highlights: ["Two-way guard", "DLP & redaction", "Human approval"],
    icon: Handshake,
    logo: evaIcon.url,
  },
];


// A clickable spin fidget with real momentum & friction physics
