import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ENQUIRY_EMAIL, PRODUCTION_DOMAIN } from "@/lib/siteConfig";
import { 
  ArrowLeft, Lightbulb, Cog, Shield, Users, Building, Mail, CheckCircle, 
  Brain, Zap, Database, Globe, Lock, Award, Clock, Target, Layers,
  MessageSquare, FileText, BarChart3, Bot, Workflow, Network, Server,
  ShieldCheck, Key, Eye, FileCheck, Handshake, Code, Plug, HeartHandshake,
  Rocket, Heart, MapPin, Phone, Youtube, Linkedin, Instagram, TrendingUp, Sparkles
} from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import SEO from "@/components/SEO";

import Footer from "@/components/layout/Footer";
import { useState } from "react";
import BookingChatModal from "@/components/BookingChatModal";
import LayeredArchitectureDiagram from "@/components/architecture/LayeredArchitectureDiagram";
import AgenticExecutionLoop from "@/components/diagrams/AgenticExecutionLoop";
import LeadCaptureChoice from "@/components/LeadCaptureChoice";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import { CONTACT_INFO } from "@/lib/contactInfo";

// Import logo images
import oracleLogo from "@/assets/logos/oracle.png";

import xeroLogo from "@/assets/logos/xero.png";
import gohighlevelLogo from "@/assets/logos/gohighlevel.png";
import pleasesignLogo from "@/assets/logos/pleasesign.png";
import vapiLogo from "@/assets/logos/vapi.png";
import accountableLinkLogo from "@/assets/logos/accountable-black.png";
import sitevoiceLogo from "@/assets/logos/sitevoice.png.asset.json";
import windowmakerLogo from "@/assets/logos/windowmaker.png.asset.json";

// SVG logos for major partners
const AWSLogo = () => (
  <svg viewBox="0 0 100 60" className="h-12 w-auto fill-current">
    <path d="M28.5 24.5c0 1.2.1 2.2.4 2.9.2.5.4 1 .8 1.6.1.2.2.3.2.5 0 .2-.1.4-.4.6l-1.3.9c-.2.1-.4.2-.5.2-.2 0-.4-.1-.6-.3-.3-.3-.5-.6-.7-1-.2-.4-.4-.8-.6-1.3-1.6 1.9-3.6 2.8-6 2.8-1.7 0-3.1-.5-4.1-1.5-1-.9-1.5-2.2-1.5-3.8 0-1.7.6-3 1.8-4.1 1.2-1 2.8-1.5 4.8-1.5.7 0 1.4 0 2.1.1.7.1 1.5.2 2.3.4v-1.4c0-1.5-.3-2.6-1-3.2-.6-.6-1.7-.9-3.2-.9-.7 0-1.4.1-2.1.3-.7.2-1.5.4-2.2.8-.3.2-.6.3-.7.3-.2 0-.3-.1-.3-.4v-1c0-.3 0-.5.1-.6.1-.1.3-.3.5-.4.7-.4 1.6-.7 2.6-.9 1-.3 2-.4 3.1-.4 2.4 0 4.1.5 5.2 1.6 1.1 1.1 1.6 2.7 1.6 4.9v6.4zm-8.2 3.1c.7 0 1.4-.1 2.1-.4.8-.3 1.4-.7 2-1.4.4-.4.6-.9.7-1.4.1-.5.2-1.2.2-2v-1c-.6-.1-1.2-.2-1.9-.3-.7-.1-1.4-.1-2-.1-1.3 0-2.3.3-2.9.8-.6.5-.9 1.3-.9 2.3 0 .9.2 1.6.7 2.1.5.5 1.2.7 2 .7v.7zm16.3 2.2c-.3 0-.5 0-.6-.1-.1-.1-.3-.3-.4-.6l-4.5-14.8c-.1-.2-.1-.4-.1-.5 0-.3.1-.4.4-.4h2c.3 0 .5 0 .6.1.1.1.2.3.3.6l3.2 12.6 3-12.6c.1-.3.2-.5.3-.6.1-.1.4-.1.7-.1h1.6c.3 0 .5 0 .7.1.1.1.2.3.3.6l3 12.8 3.3-12.8c.1-.3.2-.5.3-.6.2-.1.4-.1.6-.1h1.9c.3 0 .4.1.4.4 0 .1 0 .2 0 .3 0 .1-.1.3-.1.4l-4.6 14.8c-.1.3-.2.5-.4.6-.1.1-.4.1-.6.1h-1.8c-.3 0-.5 0-.6-.1-.1-.1-.2-.3-.3-.6l-2.9-12.3-2.9 12.3c-.1.3-.2.5-.3.6-.2.1-.4.1-.7.1h-1.8zm26.1.6c-1 0-2.1-.1-3-.4-.9-.3-1.7-.6-2.2-1-.3-.2-.5-.5-.6-.7 0-.1-.1-.3-.1-.4v-1.1c0-.3.1-.5.4-.5.1 0 .2 0 .3 0 .1.1.3.1.5.2.7.3 1.4.6 2.2.7.8.2 1.6.3 2.4.3 1.3 0 2.3-.2 3-.7.7-.5 1-1.1 1-2 0-.6-.2-1.1-.5-1.4-.4-.4-.9-.7-1.8-1l-2.5-.8c-1.3-.4-2.3-1-3-1.8-.6-.8-1-1.7-1-2.8 0-.8.2-1.5.5-2.1.4-.6.8-1.2 1.4-1.6.6-.4 1.2-.8 2-.9.8-.2 1.6-.3 2.4-.3.4 0 .9 0 1.3.1.5 0 .9.1 1.3.2.4.1.8.2 1.2.3.4.1.7.3.9.4.3.2.5.3.6.5.1.2.2.4.2.7v1c0 .3-.1.5-.4.5-.1 0-.4-.1-.6-.2-1-.4-2.1-.6-3.3-.6-1.1 0-2 .2-2.6.6-.6.4-.9.9-.9 1.7 0 .6.2 1 .6 1.4.4.4 1 .7 1.9 1l2.5.8c1.3.4 2.2 1 2.8 1.7.6.7.9 1.6.9 2.6 0 .8-.2 1.6-.5 2.2-.3.7-.8 1.2-1.4 1.7-.6.5-1.3.8-2.1 1-.9.3-1.7.4-2.7.4z"/>
    <path d="M76.8 38.2c-8.5 6.3-20.8 9.6-31.4 9.6-14.9 0-28.3-5.5-38.4-14.6-.8-.7-.1-1.7.9-1.1 10.9 6.4 24.5 10.2 38.4 10.2 9.4 0 19.8-2 29.3-6 1.4-.6 2.6 1 1.2 1.9z" className="fill-[#FF9900]"/>
    <path d="M80.1 34.4c-1.1-1.4-7.3-.7-10.1-.3-.8.1-1-.6-.2-1.1 4.9-3.5 13-2.5 14-.1.9 2.3-.3 7.5-4.9 10.6-.7.5-1.4.2-1.1-.4 1.1-2.7 3.4-8.3 2.3-9.7z" className="fill-[#FF9900]"/>
  </svg>
);

const DropboxLogo = () => (
  <svg viewBox="0 0 43 40" className="h-12 w-auto">
    <path d="M12.6 0L0 8.2l8.6 6.9 12.5-8.2L12.6 0zM0 22l12.6 8.2 8.5-6.9-12.5-8.1L0 22zm21.1 1.3l8.5 6.9L42.2 22l-8.6-6.8-12.5 8.1zM42.2 8.2L29.6 0l-8.5 6.9 12.5 8.2 8.6-6.9zM21.1 24.5L12.6 31l-4-.9v3l12.5 7.5 12.5-7.5v-3l-4 .9-8.5-6.5z" className="fill-[#0061FF]"/>
  </svg>
);

const ElevenLabsLogo = () => (
  <svg viewBox="0 0 60 40" className="h-10 w-auto fill-current">
    <rect x="15" y="5" width="10" height="30" rx="2"/>
    <rect x="35" y="5" width="10" height="30" rx="2"/>
  </svg>
);




// Strategic partner logos
const MicrosoftLogo = () => (
  <svg viewBox="0 0 23 23" className="h-10 w-auto">
    <rect x="1" y="1" width="10" height="10" className="fill-[#F25022]"/>
    <rect x="12" y="1" width="10" height="10" className="fill-[#7FBA00]"/>
    <rect x="1" y="12" width="10" height="10" className="fill-[#00A4EF]"/>
    <rect x="12" y="12" width="10" height="10" className="fill-[#FFB900]"/>
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 54 54" className="h-10 w-auto">
    <path d="M19.7 0C16.5 0 13.9 2.6 13.9 5.8s2.6 5.8 5.8 5.8h5.8V5.8C25.5 2.6 22.9 0 19.7 0z" className="fill-[#E01E5A]"/>
    <path d="M19.7 13.9H5.8C2.6 13.9 0 16.5 0 19.7s2.6 5.8 5.8 5.8h13.9c3.2 0 5.8-2.6 5.8-5.8s-2.6-5.8-5.8-5.8z" className="fill-[#E01E5A]"/>
    <path d="M54 19.7c0-3.2-2.6-5.8-5.8-5.8s-5.8 2.6-5.8 5.8v5.8h5.8c3.2 0 5.8-2.6 5.8-5.8z" className="fill-[#2EB67D]"/>
    <path d="M40.1 19.7V5.8C40.1 2.6 37.5 0 34.3 0s-5.8 2.6-5.8 5.8v13.9c0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8z" className="fill-[#2EB67D]"/>
    <path d="M34.3 54c3.2 0 5.8-2.6 5.8-5.8s-2.6-5.8-5.8-5.8h-5.8v5.8c0 3.2 2.6 5.8 5.8 5.8z" className="fill-[#ECB22E]"/>
    <path d="M34.3 40.1h13.9c3.2 0 5.8-2.6 5.8-5.8s-2.6-5.8-5.8-5.8H34.3c-3.2 0-5.8 2.6-5.8 5.8s2.6 5.8 5.8 5.8z" className="fill-[#ECB22E]"/>
    <path d="M0 34.3c0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8v-5.8H5.8C2.6 28.5 0 31.1 0 34.3z" className="fill-[#36C5F0]"/>
    <path d="M13.9 34.3v13.9c0 3.2 2.6 5.8 5.8 5.8s5.8-2.6 5.8-5.8V34.3c0-3.2-2.6-5.8-5.8-5.8s-5.8 2.6-5.8 5.8z" className="fill-[#36C5F0]"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-auto">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" className="fill-[#FFC107]"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" className="fill-[#FF3D00]"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" className="fill-[#4CAF50]"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" className="fill-[#1976D2]"/>
  </svg>
);

// Partner logos mapping - using imported images where available
const partnerLogos: Record<string, React.ReactNode> = {
  "AWS": <AWSLogo />,
  "Oracle": <img src={oracleLogo} alt="Oracle" className="h-10 w-auto object-contain" />,
  "Dropbox": <DropboxLogo />,
  "Xero": <img src={xeroLogo} alt="Xero" className="h-12 w-auto object-contain" />,
  "ElevenLabs": <ElevenLabsLogo />,
  "Accountable.link": <img src={accountableLinkLogo} alt="Accountable.link" className="h-12 w-auto object-contain" />,
  "GoHighLevel": <img src={gohighlevelLogo} alt="GoHighLevel" className="h-12 w-auto object-contain" />,
  "PleaseSign": <img src={pleasesignLogo} alt="PleaseSign" className="h-12 w-auto object-contain" />,
  "VAPI": <img src={vapiLogo} alt="VAPI" className="h-12 w-auto object-contain" />,
  "SiteVoice": <img src={sitevoiceLogo.url} alt="SiteVoice" className="h-12 w-auto object-contain" />,
  "Windowmaker": <img src={windowmakerLogo.url} alt="Windowmaker" className="h-12 w-auto object-contain" />,
};

// Strategic partner logos for grid items
const strategicPartnerLogos: Record<string, React.ReactNode> = {
  "Microsoft": <MicrosoftLogo />,
  "Oracle": <img src={oracleLogo} alt="Oracle" className="h-10 w-auto object-contain" />,
  "Slack": <SlackLogo />,
  "Google Workspace": <GoogleLogo />,
};

interface TechPartner {
  name: string;
  logo: string;
  url?: string;
  description?: string;
}

interface ContentBlock {
  type: "text" | "grid" | "stats" | "timeline" | "diagram" | "layers" | "techPartners" | "custom";
  title?: string;
  content?: string[];
  component?: string;
  subtitle?: string;
  items?: Array<{
    icon?: React.ElementType;
    title: string;
    description: string;
    stat?: string;
  }>;
  partners?: TechPartner[];
}

interface PageData {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  heroImage?: string;
  features: string[];
  blocks: ContentBlock[];
  /** Optional search-optimised metadata (falls back to title/subtitle) */
  seoTitle?: string;
  seoDescription?: string;
}


const pageContent: Record<string, PageData> = {
  "what-is-alfred": {
    title: "What Is alfred ai",
    seoTitle: "What Is alfred ai? AI Agents for Construction Firms",
    seoDescription: "alfred ai is a done-for-you AI agent service for construction and contracting firms: we train, embed and run AI on your own data, live in about six weeks. See what it does and what it costs.",
    subtitle: "alfred ai is a done-for-you agentic AI service: we build, train and run a custom AI model on your business's own data, then embed it in the systems your team already uses. It is delivered as five layers — Axiom, Omega, Butler, Watch and AOS — that learn your business, remember what matters, do the work, surface what's coming, and keep everything governed.",
    icon: Lightbulb,

    features: [
      "Done-for-you — we train and deliver the model",
      "Live in about six weeks, no rebuild required",
      "Five layers that work as one suite",
      "Connects to your existing tech stack",
      "Governed, auditable, human-in-the-loop",
    ],
    blocks: [
      {
        type: "text",
        title: "The short answer",
        content: [
          "alfred ai is an AI agent service for construction and contracting businesses. Instead of handing you software to configure, our team trains a custom agentic AI model on your projects, processes and decisions, embeds it in the tools you already run, and keeps it improving — typically live in about six weeks.",
          "In practice that means take-offs, tenders, procurement chasing, site reporting, scheduling admin and client comms get handled or drafted by AI agents your people supervise, not replaced by a system nobody trusts.",
        ],
      },
      {
        type: "text",
        title: "One AI suite, built around your business",
        content: [
          "alfred ai is not a DIY tool. Our team trains, configures and delivers a custom agentic AI model for your organisation, then embeds it into the systems your people already use — estimation, tender, procurement, project management, scheduling, accounting, CRM and communications.",
          "The suite is built for construction and contracting businesses with $10M–$300M turnover, and for mid-market operators who want enterprise-grade AI without a Fortune 500 budget or a two-year rebuild.",
        ],
      },

      {
        type: "grid",
        title: "Five layers. Your full AI suite.",
        items: [
          {
            icon: Brain,
            title: "Axiom — Custom AI learning",
            description: "Machine-learning deep tech trained on your data, your processes and your decisions. Axiom turns your institutional knowledge into models that get sharper the more your business runs.",
          },
          {
            icon: Database,
            title: "Omega — Living intelligence",
            description: "The organisation's living memory. Omega holds every workflow, lesson and decision the company has ever produced and generates the right SOP or playbook for the job at hand — always with human approval.",
          },
          {
            icon: Bot,
            title: "Butler — AI agents that do the work",
            description: "Agentic AI that works alongside your people — handling the repetitive, coordinating the complex, and freeing teams to focus on the work that moves the business forward.",
          },
          {
            icon: Eye,
            title: "Watch — Mission Control",
            description: "Forward-looking signals, risks and opportunities surfaced for owners and operators, so leadership can act early instead of reacting late.",
          },
          {
            icon: Layers,
            title: "AOS — The Agentic Operating System",
            description: "Connects your team, tools and daily work into one place. Links the software you already use, automates routine tasks and tracks who owns what — with governance and audit built in.",
          },
          {
            icon: Shield,
            title: "EVA — Boundary layer",
            description: "A two-way AI security guard that lets employees use personal AI without leaking enterprise data, and stops private memory bleeding into company workflows.",
          },
        ],
      },
      {
        type: "stats",
        title: "What clients see",
        items: [
          { title: "70%", description: "Reduction in admin time", stat: "average across clients" },
          { title: "40%", description: "Faster decisions", stat: "with AI-surfaced insights" },
          { title: "3x", description: "Operational scale", stat: "without proportional hiring" },
          { title: "5", description: "Layers, one suite", stat: "adopt one, grow into all" },
        ],
      },
      {
        type: "text",
        title: "Built for the real business",
        content: [
          "alfred ai is trained on the messy reality of operations — legacy systems, incomplete data, cross-team approvals and site conditions that change by the hour. Each layer stands on its own, and together they become the operating system for how your business learns, acts and stays accountable.",
          "You start where the pain is loudest — usually Butler agents on a specific workflow, or Watch for owner visibility — then expand across the suite as adoption compounds.",
        ],
      },
    ],
  },
  "how-it-works": {
    title: "How alfred ai Works",
    seoTitle: "How alfred ai Works: Done-For-You AI in 6 Weeks",
    seoDescription: "See how we train AI on your business, embed it in your existing systems, and hand back a governed AI operating system in about six weeks — no DIY build, no rip-and-replace.",
    subtitle: "A done-for-you delivery model. We train the model on your business, embed the five layers into your existing stack, and hand you a governed AI operating system in weeks — not months.",

    icon: Cog,
    features: [
      "Done-for-you delivery, not DIY",
      "No mandatory system replacement",
      "Human-in-the-loop by default",
      "Continuous learning after go-live",
    ],
    blocks: [
      {
        type: "text",
        title: "We do the building. You get the outcome.",
        content: [
          "alfred ai is delivered as a service. Our team connects to your existing tech stack — estimation, tender, procurement, project management, scheduling, accounting and communications — and trains a custom Axiom model on your data, processes and decisions.",
          "You keep the tools you already use. Butler agents, Watch dashboards and Omega's living memory sit on top, orchestrated by AOS, so every action is traceable back to a workflow, a policy and a human approval.",
        ],
      },
      {
        type: "timeline",
        title: "From first conversation to live suite",
        items: [
          {
            icon: Target,
            title: "Week 1–2: Discovery & mapping",
            description: "We map your highest-value workflows, connect your systems, and pick the first Butler agents and Watch signals to ship. No technical lift required from your team.",
          },
          {
            icon: Database,
            title: "Week 3–4: Axiom training & Omega seeding",
            description: "Axiom is trained on your data, playbooks and past decisions. Omega ingests your SOPs, project history and institutional knowledge so it can generate the right playbook on demand.",
          },
          {
            icon: Zap,
            title: "Week 5–6: Butler pilot",
            description: "The first Butler agents go live on a focused workflow. Your team reviews every action, gives feedback, and we tune the guardrails and approval gates.",
          },
          {
            icon: Rocket,
            title: "Week 7+: Watch, AOS & expansion",
            description: "Watch surfaces owner-level signals, AOS ties ownership and accountability across teams, and additional layers roll out as adoption compounds.",
          },
        ],
      },
      {
        type: "grid",
        title: "How the layers work together",
        items: [
          {
            icon: Brain,
            title: "Axiom learns",
            description: "Custom ML trained on your data and decisions. Gets sharper every time your business runs a workflow.",
          },
          {
            icon: Database,
            title: "Omega remembers",
            description: "Hybrid retrieval and two-stage reranking over your living memory. Generates the exact SOP or playbook Butler needs to act.",
          },
          {
            icon: Bot,
            title: "Butler does",
            description: "Agentic execution across your tools — email, docs, CRM, ERP, project management — with human-in-the-loop approvals.",
          },
          {
            icon: Eye,
            title: "Watch sees",
            description: "Forward-looking risk, opportunity and progress signals for owners and operators, before problems escalate.",
          },
        ],
      },
      {
        type: "text",
        title: "Human-in-the-loop by design",
        content: [
          "Every layer runs behind configurable approval gates, confidence thresholds and escalation paths. Butler never sends, spends or signs without the rule you set. Omega never publishes a playbook that hasn't been approved.",
          "Your team stays in control. AOS records every action, every input and every approver — so you have a full audit trail from first prompt to final outcome.",
        ],
      },
      {
        type: "custom",
        component: "agentic-loop",
      },
    ],
  },
  "architecture": {
    title: "Platform Architecture",
    subtitle: "A layered, agentic architecture — Axiom, Omega, Butler, Watch and AOS — running on cloud-native infrastructure with governance, auditability and data residency built in.",
    icon: Building,
    features: [
      "Five-layer agentic architecture",
      "Cloud-native, horizontally scalable",
      "MCP-native agent orchestration",
      "AU / US / EU / UK data residency",
    ],
    blocks: [
      {
        type: "text",
        title: "One suite. Five layers. Governed by AOS.",
        content: [
          "alfred ai's architecture is a stack of five specialised layers that stand alone and compose into a single operating system. Axiom trains custom models, Omega holds the living memory, Butler runs agentic execution, Watch surfaces forward-looking signals, and AOS wraps it all in governance and accountability.",
          "Each layer can be adopted independently, so you start where the pain is loudest and grow into the full suite without re-architecture.",
        ],
      },
      {
        type: "layers",
        title: "Interactive system architecture",
      },
      {
        type: "stats",
        title: "Platform metrics",
        items: [
          { title: "<100ms", description: "Median orchestration latency", stat: "for most agent hops" },
          { title: "99.9%", description: "Uptime target", stat: "SLA-backed" },
          { title: "5", description: "Composable layers", stat: "one governed suite" },
          { title: "AU/US/EU/UK", description: "Data residency", stat: "regional deployment" },
        ],
      },
      {
        type: "grid",
        title: "Technical capabilities",
        items: [
          {
            icon: Network,
            title: "MCP-native orchestration",
            description: "Butler and AOS speak the Model Context Protocol natively. Extend the suite with your own tools, agents and connectors without lock-in.",
          },
          {
            icon: Server,
            title: "Auto-scaling infrastructure",
            description: "Cloud-native services scale horizontally with demand. Handle project peaks and month-end spikes without manual intervention.",
          },
          {
            icon: Globe,
            title: "Multi-region deployment",
            description: "Deploy in your preferred region for data residency. AU, US, EU and UK data centres supported.",
          },
          {
            icon: Lock,
            title: "Governed by AOS",
            description: "Every agent action, retrieval and approval is logged. Full audit trail from prompt to outcome, with role-based access and policy enforcement.",
          },
        ],
      },
    ],
  },
  "security": {
    title: "Security & Compliance",
    subtitle: "Enterprise-grade protection for your data – SOC 2 certified, GDPR compliant, and built with security-first principles",
    icon: Shield,
    features: [
      "SOC 2 Type II certified",
      "GDPR and CCPA compliant",
      "AES-256 encryption",
      "Regular security audits",
    ],
    blocks: [
      {
        type: "text",
        title: "Security-First Architecture",
        content: [
          "Security is foundational to alfred ai, not an afterthought. We maintain SOC 2 Type II certification and are compliant with GDPR, CCPA, HIPAA (Certifiable), and industry-specific regulations including those for financial services and healthcare.",
          "All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. We never train our general models on customer data – your information remains private and isolated within your dedicated environment.",
        ],
      },
      {
        type: "grid",
        title: "Compliance & Certifications",
        items: [
          {
            icon: Award,
            title: "SOC 2 Type II",
            description: "Annual audits verify our security controls for availability, confidentiality, and data integrity.",
          },
          {
            icon: ShieldCheck,
            title: "GDPR Compliant",
            description: "Full compliance with EU data protection regulations. Data processing agreements available.",
          },
          {
            icon: FileCheck,
            title: "HIPAA Ready (Certifiable)",
            description: "Healthcare organisations can trust us with protected health information. BAA available.",
          },
          {
            icon: Lock,
            title: "ISO 27001",
            description: "Information security management system certification. Enterprise security standards.",
          },
        ],
      },
      {
        type: "grid",
        title: "Security Controls",
        items: [
          {
            icon: Key,
            title: "Access Management",
            description: "Role-based access control, SSO integration, and multi-factor authentication. Fine-grained permissions.",
          },
          {
            icon: Eye,
            title: "Audit Logging",
            description: "Comprehensive audit trails for all actions. Meet regulatory requirements and investigate incidents.",
          },
          {
            icon: Database,
            title: "Data Isolation",
            description: "Dedicated customer environments. Your data is never mixed with other organisations.",
          },
          {
            icon: Shield,
            title: "Threat Protection",
            description: "Real-time threat detection, DDoS protection, and automated incident response.",
          },
        ],
      },
      {
        type: "text",
        title: "Privacy by Design",
        content: [
          "We've built privacy into every aspect of alfred ai. Customer data is used only to provide our services – never for advertising, never sold to third parties, and never used to train models that benefit other customers.",
          "Our security team conducts regular penetration testing and vulnerability assessments, with findings addressed within strict SLAs. We maintain a responsible disclosure program and engage with the security research community.",
        ],
      },
      {
        type: "stats",
        title: "Security Metrics",
        items: [
          { title: "0", description: "Data breaches", stat: "in company history" },
          { title: "24/7", description: "Security monitoring", stat: "by dedicated team" },
          { title: "<24h", description: "Critical patch deployment", stat: "SLA commitment" },
          { title: "Annual", description: "Third-party audits", stat: "by leading firms" },
        ],
      },
    ],
  },
  "techpartners": {
    title: "Technology Partners",
    subtitle: "Integrations that power your workflow – connecting alfred ai to the tools you already use",
    icon: Users,
    features: [
      "Microsoft 365 integration",
      "Oracle partnership",
      "Slack & Teams native apps",
      "Custom API access",
    ],
    blocks: [
      {
        type: "techPartners",
        title: "Our Technology Partners",
        partners: [
          { name: "AWS", logo: "AWS", description: "Cloud infrastructure and hosting backbone for alfred ai's scalable, secure services." },
          { name: "Oracle", logo: "Oracle", description: "Enterprise database and ERP integrations for large organisations." },
          { name: "Dropbox", logo: "Dropbox", description: "Secure document storage and file sharing for workflow attachments." },
          { name: "Accountable.link", logo: "Accountable.link", description: "The alfred ai operating system and accountability layer for project control." },
          { name: "GoHighLevel", logo: "GoHighLevel", description: "CRM and marketing automation integration for lead and customer management." },
          { name: "VAPI", logo: "VAPI", description: "Voice AI infrastructure powering natural, human-like phone conversations." },
          { name: "ElevenLabs", logo: "ElevenLabs", description: "Lifelike text-to-speech voices for AI-powered voice interactions." },
          { name: "SiteVoice", logo: "SiteVoice", url: "https://sitevoice.ai/", description: "Conversational AI and site-based voice assistance for operations." },
          { name: "Windowmaker", logo: "Windowmaker", url: "https://windowmaker.com/", description: "Window and door manufacturing ERP integration for fabricators." },
          { name: "PleaseSign", logo: "PleaseSign", description: "Digital signature engine embedded into the ERP module." },
          { name: "Xero", logo: "Xero", description: "Accounting and bookkeeping integration for financial workflows." },
        ],
      },
      {
        type: "text",
        title: "Seamless Integration Ecosystem",
        content: [
          "alfred ai partners with leading technology providers to ensure seamless integration with your existing tech stack. Our partnership ecosystem includes CRM platforms, project management tools, communication systems, and industry-specific software.",
          "We continuously expand our integration library based on customer needs and emerging technologies. If you use it, we likely integrate with it – and if we don't yet, our team can build custom connectors.",
        ],
      },
      {
        type: "grid",
        title: "Strategic Partnerships",
        items: [
          {
            icon: Building,
            title: "Microsoft",
            description: "Deep integration with Microsoft 365, Teams, SharePoint, and Dynamics. Azure cloud infrastructure partner.",
          },
          {
            icon: BarChart3,
            title: "Oracle",
            description: "Enterprise integration with Oracle Cloud, NetSuite, and Oracle ERP. Deep financial and operations connectivity.",
          },
          {
            icon: MessageSquare,
            title: "Slack",
            description: "Built-in Slack app for conversational AI. Workflow automations within Slack.",
          },
          {
            icon: Globe,
            title: "Google Workspace",
            description: "Integration with Gmail, Drive, Calendar, and Docs. Works alongside your Google ecosystem.",
          },
        ],
      },
      {
        type: "grid",
        title: "Integration Categories",
        items: [
          {
            icon: Handshake,
            title: "CRM & Sales",
            description: "Salesforce, HubSpot, Pipedrive, Zoho CRM. Sync contacts, track opportunities, automate follow-ups.",
          },
          {
            icon: Workflow,
            title: "Project Management",
            description: "Asana, Monday.com, Jira, Trello. Create tasks, update statuses, coordinate across teams.",
          },
          {
            icon: FileText,
            title: "Document Management",
            description: "SharePoint, Google Drive, Dropbox, Box. Access, process, and organise documents with AI.",
          },
          {
            icon: Database,
            title: "Data & Analytics",
            description: "Tableau, Power BI, Snowflake. Feed insights into dashboards and data warehouses.",
          },
        ],
      },
      {
        type: "text",
        title: "Custom Integrations",
        content: [
          "Beyond our pre-built connectors, alfred ai offers comprehensive APIs for custom integrations. Our developer documentation covers REST endpoints, webhooks, and event subscriptions.",
          "For enterprise customers, our solutions engineering team provides custom integration development, ensuring alfred ai works seamlessly with your unique systems and workflows.",
        ],
      },
    ],
  },
  "about": {
    title: "Our Story",
    subtitle: "Our journey from idea to global AI operations platform",
    icon: Users,
    features: [
      "Ideated in 2023",
      "60+ Devs serving projects globally",
      "1000+ Integrations ready",
      "Headquartered in Sydney",
    ],
    blocks: [
      {
        type: "text",
        title: "Our Mission",
        content: [
          "alfred ai was founded with a simple mission: make enterprise AI accessible to every organisation, regardless of size or technical expertise. We believe that AI should amplify human potential, not replace it.",
          "We're building the operational layer that sits between your team and the complexity of daily business – handling administrative work so people can focus on what matters most.",
        ],
      },
      {
        type: "timeline",
        title: "Our Journey",
        items: [
          {
            icon: Lightbulb,
            title: "December 2023 – Ideated",
            description: "The alfred ai concept was born in Sydney, Australia – a vision to transform how businesses operate through intelligent automation.",
          },
          {
            icon: Rocket,
            title: "January 2024 – PoC and MVP",
            description: "Proof of concept validated. First minimum viable product developed, demonstrating core AI operations capabilities.",
          },
          {
            icon: Zap,
            title: "March 2025 – First Product Launch",
            description: "Official launch of our first product, bringing AI-powered operations to early adopter organisations.",
          },
          {
            icon: Globe,
            title: "June 2025 – app.Accountable.link",
            description: "Launch of the Accountable.link platform, expanding our product ecosystem.",
          },
          {
            icon: Target,
            title: "January 2026 – 5-Layer AI Suite",
            description: "Full activation of the five-layer alfred ai suite — Axiom, Butler, Watch and AOS — serving organisations globally.",
          },
          {
            icon: Sparkles,
            title: "July 2026 – Omega Launch",
            description: "Omega goes live as the living intelligence layer — turning every workflow, lesson and decision into on-demand SOPs and playbooks for Butler agents and teams.",
          },
          {
            icon: TrendingUp,
            title: "2026 to 2030 – Scale & Globalisation",
            description: "Strategic expansion phase — scaling operations and globalising the alfred ai suite to serve enterprises worldwide.",
          },

        ],
      },
      {
        type: "stats",
        title: "alfred ai at a Glance",
        items: [
          { title: "2023", description: "Ideated", stat: "in Sydney, Australia" },
          { title: "60+", description: "Devs", stat: "serving projects globally" },
          { title: "1000+", description: "Integrations", stat: "ready to deploy" },
          { title: "Sydney", description: "Headquarters", stat: "Australia" },
        ],
      },
      {
        type: "grid",
        title: "Our Values",
        items: [
          {
            icon: Heart,
            title: "Customer Obsession",
            description: "Every decision starts with the customer. We measure success by the impact we create for the organisations we serve.",
          },
          {
            icon: Target,
            title: "Pragmatic Innovation",
            description: "We build technology that works in the real world – not just demos. Battle-tested, not theoretical.",
          },
          {
            icon: HeartHandshake,
            title: "Radical Transparency",
            description: "Honest communication with customers, partners, and each other. No hidden agendas, no surprise fees.",
          },
          {
            icon: Rocket,
            title: "Bias for Action",
            description: "We ship fast, learn faster. Progress over perfection, with a commitment to continuous improvement.",
          },
        ],
      },
      {
        type: "text",
        title: "Our Team",
        content: [
          "Our team combines decades of experience in enterprise software, artificial intelligence, and business operations. We've built products at companies like Google, Microsoft, Atlassian, and Canva.",
          "But what truly defines us is our shared vision of freeing knowledge workers from repetitive tasks. We're building the solution we wish existed when we were operators ourselves.",
        ],
      },
      {
        type: "text",
        title: "Backed by the Seasoned",
        content: [
          "We're backed by an industry-respected advisory board and seasoned investors who share our vision of transforming how businesses operate through intelligent automation.",
          "With strong advisory support and a growing team, we're positioned to be the defining AI operations platform for the next decade of business.",
        ],
      },
    ],
  },
  "contact": {
    title: "Contact Us",
    subtitle: "Get in touch with our team – we're here to help you transform your operations",
    icon: Mail,
    features: [
      "Book an Impact Conversation",
      `Email: ${ENQUIRY_EMAIL}`,
      "Phone: +61 02 5759 8881",
      "Barangaroo, Sydney",
    ],
    blocks: [
      {
        type: "text",
        title: "Let's Talk",
        content: [
          "Ready to learn more about alfred ai? Our team is here to help you understand how AI can transform your operations. Whether you're exploring AI for the first time or looking to expand your existing automation, we'd love to hear from you.",
          "Book a conversation with our team – we typically respond within one business day. No sales pressure, just an honest discussion about whether alfred ai is right for your organisation.",
        ],
      },
      {
        type: "text",
        title: "For Enterprises",
        content: [
          "If you're exploring alfred ai for a larger organisation (500+ employees), our enterprise team provides dedicated support throughout your evaluation. We offer custom pilots, security reviews, and executive briefings.",
          `Contact ${ENQUIRY_EMAIL} or mention 'enterprise' when booking your demo to connect with our enterprise solutions team.`,
        ],
      },
      {
        type: "text",
        title: "Careers at alfred ai",
        content: [
          `Interested in joining our team? We're always looking for talented people who are passionate about building AI that makes a real difference. Check out our careers page or email careers@${PRODUCTION_DOMAIN}.`,
        ],
      },
      {
        type: "text",
        title: "Where We Serve",
        content: [
          "alfred ai delivers AI-powered operations across key global markets: United Kingdom, Saudi Arabia, Australia, Dubai (UAE), Singapore, Indonesia, and Malaysia. Our regional presence ensures localised support and compliance with local regulations.",
        ],
      },
    ],
  },
};

const ContentBlockRenderer = ({ block, index, onPleaseSignClick }: { block: ContentBlock; index: number; onPleaseSignClick?: () => void }) => {
  if (block.type === "text") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16"
      >
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
            {block.title}
          </h2>
        )}
        <div className="space-y-5">
          {block.content?.map((paragraph, pIndex) => (
            <p key={pIndex} className="text-lg text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>
    );
  }

  if (block.type === "techPartners" && block.partners) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16"
      >
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
            {block.title}
          </h2>
        )}
        <TooltipProvider delayDuration={150}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {block.partners.map((partner, pIndex) => {
              const hasSvgLogo = partnerLogos[partner.name];
              return (
                <Tooltip key={partner.name}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ delay: (index * 0.1) + (pIndex * 0.05), duration: 0.3 }}
                      className="relative bg-card rounded-xl border border-border p-4 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[150px] cursor-pointer text-left"
                      onClick={() => {
                        if (partner.name === "PleaseSign") onPleaseSignClick?.();
                        if (partner.url) window.open(partner.url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      {hasSvgLogo ? (
                        <>
                          <div className="relative z-10 text-muted-foreground mb-1 flex items-center justify-center">
                            {partnerLogos[partner.name]}
                          </div>
                          <span className="relative z-10 text-xs text-muted-foreground/70 font-medium mb-1">
                            {partner.name}
                          </span>
                          {partner.description && (
                            <span className="md:hidden relative z-10 text-[10px] text-muted-foreground/70 text-center leading-tight line-clamp-2 px-1">
                              {partner.description}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="relative z-10 text-base font-bold text-muted-foreground tracking-wide text-center">
                            {partner.logo}
                          </span>
                          {partner.description && (
                            <span className="md:hidden relative z-10 text-[10px] text-muted-foreground/70 text-center leading-tight line-clamp-2 px-1 mt-1">
                              {partner.description}
                            </span>
                          )}
                        </>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  {partner.description && (
                    <TooltipContent side="bottom" sideOffset={8} className="max-w-[16rem] text-center p-3">
                      <p className="text-sm leading-relaxed">{partner.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </motion.div>
    );
  }

  if (block.type === "layers") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16"
      >
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
            {block.title}
          </h2>
        )}
        <LayeredArchitectureDiagram />
      </motion.div>
    );
  }

  if (block.type === "custom") {
    if (block.component === "agentic-loop") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="mb-16"
        >
          <AgenticExecutionLoop variant="full" />
        </motion.div>
      );
    }
    return null;
  }

  if (block.type === "grid" || block.type === "diagram") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16"
      >
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
            {block.title}
          </h2>
        )}
        <div className={`grid gap-6 ${block.type === "diagram" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"}`}>
          {block.items?.map((item, iIndex) => {
            const Icon = item.icon;
            const hasStrategicLogo = strategicPartnerLogos[item.title];
            return (
              <motion.div
                key={iIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ delay: (index * 0.1) + (iIndex * 0.08), duration: 0.4 }}
                className="relative bg-card rounded-2xl border border-border p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  {hasStrategicLogo ? (
                    <div className="mb-5">
                      {strategicPartnerLogos[item.title]}
                    </div>
                  ) : Icon && (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (block.type === "stats") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl" />
        <div className="relative bg-card/50 backdrop-blur-sm rounded-3xl border border-primary/10 p-8 md:p-10">
          {block.title && (
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">{block.title}</h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {block.items?.map((item, iIndex) => (
              <motion.div
                key={iIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.1) + (iIndex * 0.1), duration: 0.4 }}
                className="text-center flex flex-col items-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 whitespace-nowrap">
                  {item.title}
                </div>
                <div className="text-xs sm:text-sm font-medium text-foreground mb-0.5 leading-tight">
                  {item.description}
                </div>
                {item.stat && (
                  <div className="text-xs text-muted-foreground leading-tight">{item.stat}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (block.type === "timeline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="mb-16"
      >
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 relative">
            <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
            {block.title}
          </h2>
        )}
        <div className="relative">
          {/* Timeline line - positioned consistently on the right for desktop */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 md:left-auto md:right-8" />
          
          <div className="space-y-8">
            {block.items?.map((item, iIndex) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={iIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index * 0.1) + (iIndex * 0.15), duration: 0.5 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Mobile icon */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25 md:hidden">
                    {Icon && <Icon className="w-5 h-5 text-primary-foreground" />}
                  </div>
                  
                  {/* Card content */}
                  <div className="flex-1 md:mr-20">
                    <div className="group bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Desktop icon - positioned on the right, vertically centered with card */}
                  <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                    {Icon && <Icon className="w-5 h-5 text-primary-foreground" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

// Contact page special content with quick form options
const ContactPageContent = ({ setShowCalendly }: { setShowCalendly: (show: boolean) => void }) => {
  const [selectedType, setSelectedType] = useState<{ type: "demo" | "contact"; mode: "chat" | "form" } | null>(null);

  const quickOptions = [
    { id: "demo" as const, mode: "chat" as const, label: "Book an Impact Conversation", icon: MessageSquare, description: "Chat with our AI assistant" },
    { id: "contact" as const, mode: "form" as const, label: "Send a Message", icon: Mail, description: "Fill out a quick form" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-16"
    >
      <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6 relative">
        <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
        Get Started
      </h2>

      {!selectedType ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {quickOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedType({ type: option.id, mode: option.mode })}
              className="group p-6 rounded-xl border border-border hover:border-primary/50 bg-background hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <option.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{option.label}</h3>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <button
            onClick={() => setSelectedType(null)}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
          >
            ← Back to options
          </button>
          <LeadCaptureChoice type={selectedType.type} initialMode={selectedType.mode} />
        </div>
      )}

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.a
          href={`mailto:${CONTACT_INFO.email.general}`}
          whileHover={{ scale: 1.02, y: -2 }}
          className="group flex items-start gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Email</p>
            <p className="text-primary text-sm">{CONTACT_INFO.email.general}</p>
          </div>
        </motion.a>

        <motion.a
          href={CONTACT_INFO.phoneHref}
          whileHover={{ scale: 1.02, y: -2 }}
          className="group flex items-start gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Call Us</p>
            <p className="text-primary text-sm">{CONTACT_INFO.phone}</p>
            <p className="text-xs text-muted-foreground">{CONTACT_INFO.phoneNote}</p>
          </div>
        </motion.a>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="group flex items-start gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Visit Us</p>
            <p className="text-muted-foreground text-sm">{CONTACT_INFO.location.street}</p>
            <p className="text-muted-foreground text-sm">{CONTACT_INFO.location.city}</p>
            <p className="text-xs text-primary font-medium mt-1">{CONTACT_INFO.location.note}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 p-4 rounded-xl bg-background border border-border"
        >
          <p className="text-sm font-medium text-foreground">Socials</p>
          <div className="flex gap-3">
            <motion.a
              href={CONTACT_INFO.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
            >
              <Linkedin className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">LinkedIn</span>
            </motion.a>
            <motion.a
              href={CONTACT_INFO.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
            >
              <Youtube className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">YouTube</span>
            </motion.a>
            <motion.a
              href={CONTACT_INFO.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
            >
              <Instagram className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Instagram</span>
            </motion.a>
            <motion.a
              href={CONTACT_INFO.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
            >
              <TikTokIcon className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">TikTok</span>
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Service Regions */}
      <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-foreground text-sm">Where We Serve</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTACT_INFO.serviceRegions.map((region) => (
            <motion.span
              key={region.code}
              whileHover={{ scale: 1.05 }}
              className="px-2.5 py-1 bg-background text-primary rounded-full text-xs font-medium border border-primary/20"
            >
              {region.name}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ExplainedDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? pageContent[slug] : null;
  const [showCalendly, setShowCalendly] = useState(false);
  const [showPleaseSignDialog, setShowPleaseSignDialog] = useState(false);

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Page not found" path={`/explained/${slug ?? ""}`} noindex />
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-wide text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Page not found</h1>
            <Link to="/explained" className="text-primary hover:underline">
              Back to alfred ai Explained
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = page.icon;
  const pagePath = `/explained/${slug}`;
  const metaDescription = (page.seoDescription ?? page.subtitle).slice(0, 158);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={page.seoTitle ?? page.title}
        description={metaDescription}
        path={pagePath}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "alfred ai Explained", url: "/explained" },
          { name: page.title, url: pagePath },
        ]}
      />
      <Header />

      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-background relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="container-wide relative z-10">
            <Link
              to="/explained"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to alfred ai Explained
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-8"
              >
                <Icon className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                {page.title}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                {page.subtitle}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 md:py-20 bg-background-alt">
          <div className="container-wide">
            <div className="grid lg:grid-cols-4 gap-12 lg:gap-16 overflow-visible">
              {/* Main Content */}
              <div className="lg:col-span-3 pl-4">
                {/* Contact Page Special Content */}
                {slug === "contact" && (
                  <ContactPageContent setShowCalendly={setShowCalendly} />
                )}
                
                {page.blocks.map((block, index) => (
                  <ContentBlockRenderer key={index} block={block} index={index} onPleaseSignClick={() => setShowPleaseSignDialog(true)} />
                ))}
              </div>
              
              {/* Sidebar - sticky on desktop */}
              <div className="lg:col-span-1">
                {/* Sticky wrapper - NO transforms, overflow, or self-start for sticky to work */}
                <div className="lg:sticky lg:top-24 space-y-6 pb-8">
                  {slug !== "contact" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          Key Highlights
                        </h3>
                        <ul className="space-y-4">
                          {page.features.map((feature, index) => (
                            <motion.li 
                              key={index} 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + (index * 0.1) }}
                              className="flex items-start gap-3"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                  
                  {slug !== "contact" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <div className="relative overflow-hidden rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                        <div className="relative p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to get started?</h3>
                          <p className="text-sm text-muted-foreground mb-5">
                            Book a conversation with our team to see alfred ai in action.
                          </p>
                          <Button 
                            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20 whitespace-normal h-auto py-3 text-sm"
                            onClick={() => setShowCalendly(true)}
                          >
                            Book an Impact Conversation
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Ready to transform your operations?"
          description="Join 200+ organisations already using alfred ai to reduce admin, scale operations, and deliver better outcomes."
          buttonText="Book an Impact Conversation"
          onButtonClick={() => setShowCalendly(true)}
          variant="light"
        />
      </main>

      <Footer />
      
      <Dialog open={showPleaseSignDialog} onOpenChange={setShowPleaseSignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PleaseSign</DialogTitle>
            <DialogDescription>
              Digital signature engine powering alfred ai workflows
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-relaxed text-foreground">
              PleaseSign is fully embedded and plugged into alfred ai&apos;s ERP module — <strong>app.Accountable.link</strong> — as the digital signature engine, allowing documents to be sent for signing and automatically push the signed outcome back into workflows, records, and accountability tracking.
            </p>
            <a 
              href="https://pleasesign.com.au/partner" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Visit PleaseSign Partner Page →
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <BookingChatModal 
        isOpen={showCalendly} 
        onClose={() => setShowCalendly(false)} 
      />
    </div>
  );
};

export default ExplainedDetail;
