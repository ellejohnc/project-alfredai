import { 
  Bot, Brain, Sparkles, Cpu,
  Users, Target, Rocket, Search,
  Video, Phone,
  Mail, Send, AtSign,
  Megaphone, Zap, TrendingUp,
  Building2, Boxes, Server, Globe,
  ShoppingCart,
  Github, GitBranch, Layout, ListTodo, Workflow, Wand2, MousePointer,
  Calculator, Receipt, DollarSign,
  PenTool,
  Calendar, Clock,
  Plug, Settings
} from "lucide-react";
import { Integration, SetupStep } from "./types";

// Common setup steps templates
const oauthAuthStep: SetupStep = {
  id: "auth",
  title: "Connect Account",
  description: "Authorize access to your account",
  type: "auth",
  duration: 2000,
  fields: [{ name: "oauth", label: "Connect", type: "oauth", required: true }]
};

const apiKeyAuthStep: SetupStep = {
  id: "auth",
  title: "API Authentication",
  description: "Enter your API credentials",
  type: "auth",
  duration: 1500,
  fields: [
    { name: "apiKey", label: "API Key", type: "password", placeholder: "sk-••••••••••••••", required: true },
    { name: "orgId", label: "Organization ID", type: "text", placeholder: "org-xxxx" }
  ]
};

const configStep: SetupStep = {
  id: "config",
  title: "Configuration",
  description: "Set up your preferences",
  type: "config",
  duration: 1000,
  fields: [
    { name: "autoSync", label: "Enable Auto-Sync", type: "toggle", defaultValue: true },
    { name: "notifications", label: "Send Notifications", type: "toggle", defaultValue: true }
  ]
};

const mappingStep: SetupStep = {
  id: "mapping",
  title: "Field Mapping",
  description: "Map your data fields",
  type: "mapping",
  duration: 1500,
  fields: [{ name: "fieldMap", label: "Field Mapping", type: "drag-drop" }]
};

const syncStep: SetupStep = {
  id: "sync",
  title: "Sync Settings",
  description: "Configure sync frequency and direction",
  type: "sync",
  duration: 1000,
  fields: [
    { name: "frequency", label: "Sync Frequency", type: "select", options: ["Real-time", "Every 15 min", "Hourly", "Daily"] },
    { name: "direction", label: "Sync Direction", type: "select", options: ["Import only", "Export only", "Bidirectional"] }
  ]
};

const testStep: SetupStep = {
  id: "test",
  title: "Test & Activate",
  description: "Test connection and activate integration",
  type: "test",
  duration: 3000
};

// AI Model specific config step
const aiModelConfigStep: SetupStep = {
  id: "config",
  title: "Model Configuration",
  description: "Configure AI model settings",
  type: "config",
  duration: 1000,
  fields: [
    { name: "model", label: "Model Version", type: "select", options: ["GPT-4o", "GPT-4", "GPT-3.5 Turbo"] },
    { name: "temperature", label: "Temperature", type: "select", options: ["0.0 - Precise", "0.5 - Balanced", "1.0 - Creative"] },
    { name: "maxTokens", label: "Max Tokens", type: "select", options: ["1024", "2048", "4096", "8192"] }
  ]
};

// CRM specific steps
const crmConfigStep: SetupStep = {
  id: "config",
  title: "CRM Configuration",
  description: "Configure CRM sync settings",
  type: "config",
  duration: 1000,
  fields: [
    { name: "pipeline", label: "Default Pipeline", type: "select", options: ["Sales Pipeline", "Enterprise", "SMB"] },
    { name: "leadOwner", label: "Lead Owner", type: "select", options: ["Auto-assign", "Round Robin", "Manual"] },
    { name: "duplicateDetection", label: "Duplicate Detection", type: "toggle", defaultValue: true }
  ]
};

// Accounting specific steps
const accountingConfigStep: SetupStep = {
  id: "config",
  title: "Accounting Setup",
  description: "Configure accounting preferences",
  type: "config",
  duration: 1000,
  fields: [
    { name: "fiscalYear", label: "Fiscal Year Start", type: "select", options: ["January", "April", "July", "October"] },
    { name: "currency", label: "Default Currency", type: "select", options: ["USD", "EUR", "GBP", "AUD"] },
    { name: "taxCodes", label: "Enable Tax Codes", type: "toggle", defaultValue: true }
  ]
};

export const integrations: Integration[] = [
  // AI Models
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "AI Models",
    icon: Bot,
    rating: 4.9,
    installs: "75K+",
    description: "OpenAI's powerful language model",
    longDescription: "Integrate ChatGPT to power intelligent conversations, content generation, and complex reasoning tasks in your workflows.",
    color: "from-green-500/20 to-emerald-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Text generation", "Code assistance", "Analysis", "Summarization"],
    popular: true,
    supportsAgentProtocol: true,
    setupSteps: [apiKeyAuthStep, { ...aiModelConfigStep, fields: [
      { name: "model", label: "Model Version", type: "select", options: ["GPT-4o", "GPT-4 Turbo", "GPT-4", "GPT-3.5 Turbo"] },
      { name: "temperature", label: "Temperature", type: "select", options: ["0.0 - Precise", "0.5 - Balanced", "1.0 - Creative"] },
      { name: "maxTokens", label: "Max Tokens", type: "select", options: ["1024", "2048", "4096", "8192"] }
    ]}, mappingStep, syncStep, testStep]
  },
  {
    id: "claude",
    name: "Claude",
    category: "AI Models",
    icon: Brain,
    rating: 4.9,
    installs: "45K+",
    description: "Anthropic's helpful AI assistant",
    longDescription: "Claude excels at thoughtful dialogue, content creation, and nuanced analysis with strong safety features.",
    color: "from-orange-500/20 to-amber-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Long-form content", "Code review", "Research", "Summarization"],
    popular: true,
    new: true,
    supportsAgentProtocol: true,
    setupSteps: [apiKeyAuthStep, { ...aiModelConfigStep, fields: [
      { name: "model", label: "Model Version", type: "select", options: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"] },
      { name: "temperature", label: "Temperature", type: "select", options: ["0.0 - Precise", "0.5 - Balanced", "1.0 - Creative"] },
      { name: "maxTokens", label: "Max Tokens", type: "select", options: ["2048", "4096", "8192", "100K"] }
    ]}, mappingStep, syncStep, testStep]
  },
  {
    id: "gemini",
    name: "Gemini",
    category: "AI Models",
    icon: Sparkles,
    rating: 4.8,
    installs: "35K+",
    description: "Google's multimodal AI model",
    longDescription: "Gemini brings powerful multimodal capabilities, understanding text, images, and code with seamless integration.",
    color: "from-blue-500/20 to-cyan-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Multimodal", "Image analysis", "Code generation", "Translation"],
    new: true,
    supportsAgentProtocol: true,
    setupSteps: [apiKeyAuthStep, { ...aiModelConfigStep, fields: [
      { name: "model", label: "Model Version", type: "select", options: ["Gemini 1.5 Pro", "Gemini 1.5 Flash", "Gemini 1.0 Pro"] },
      { name: "temperature", label: "Temperature", type: "select", options: ["0.0 - Precise", "0.5 - Balanced", "1.0 - Creative"] },
      { name: "maxTokens", label: "Max Tokens", type: "select", options: ["2048", "4096", "8192", "32K"] }
    ]}, mappingStep, syncStep, testStep]
  },
  {
    id: "slms",
    name: "SLMs",
    category: "AI Models",
    icon: Cpu,
    rating: 4.6,
    installs: "15K+",
    description: "Small Language Models for edge computing",
    longDescription: "Deploy lightweight AI models locally for faster response times and enhanced privacy in your workflows.",
    color: "from-violet-500/20 to-purple-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Local deployment", "Low latency", "Privacy-first", "Edge computing"],
    supportsAgentProtocol: true,
    setupSteps: [apiKeyAuthStep, { ...aiModelConfigStep, fields: [
      { name: "model", label: "Model", type: "select", options: ["Phi-3", "Mistral 7B", "LLaMA 3", "Gemma 2"] },
      { name: "deployment", label: "Deployment", type: "select", options: ["Cloud", "On-premise", "Edge"] },
      { name: "quantization", label: "Quantization", type: "select", options: ["FP16", "INT8", "INT4"] }
    ]}, mappingStep, syncStep, testStep]
  },

  // CRM
  {
    id: "accountable-crm",
    name: "Accountable.link",
    category: "CRM",
    icon: Target,
    rating: 4.8,
    installs: "20K+",
    description: "All-in-one business management platform",
    longDescription: "Accountable.link provides comprehensive CRM, project management, and invoicing in a unified platform.",
    color: "from-primary/20 to-primary/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Contact management", "Project tracking", "Invoicing", "Reports"],
    popular: true,
    setupSteps: [oauthAuthStep, crmConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "gohighlevel",
    name: "GoHighLevel",
    category: "CRM",
    icon: Rocket,
    rating: 4.7,
    installs: "28K+",
    description: "All-in-one marketing platform",
    longDescription: "GoHighLevel combines CRM, marketing automation, funnels, and more for agencies and marketers.",
    color: "from-blue-500/20 to-indigo-500/10",
    setupTime: "15 min",
    complexity: "medium",
    features: ["Funnels", "Email marketing", "SMS", "Automation"],
    popular: true,
    setupSteps: [oauthAuthStep, crmConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM",
    icon: Users,
    rating: 4.8,
    installs: "55K+",
    description: "Inbound marketing and sales platform",
    longDescription: "HubSpot offers a complete CRM platform with marketing, sales, and service tools for growing businesses.",
    color: "from-orange-500/20 to-red-500/10",
    setupTime: "15 min",
    complexity: "medium",
    features: ["Contact management", "Marketing hub", "Sales hub", "Service hub"],
    popular: true,
    setupSteps: [oauthAuthStep, crmConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "apollo",
    name: "Apollo",
    category: "CRM",
    icon: Search,
    rating: 4.6,
    installs: "22K+",
    description: "Sales intelligence and engagement",
    longDescription: "Apollo provides B2B data, sales engagement, and workflow automation for revenue teams.",
    color: "from-indigo-500/20 to-blue-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Lead database", "Email sequences", "Dialer", "Analytics"],
    setupSteps: [oauthAuthStep, crmConfigStep, mappingStep, syncStep, testStep]
  },

  // Communication
  {
    id: "zoom",
    name: "Zoom",
    category: "Communication",
    icon: Video,
    rating: 4.8,
    installs: "65K+",
    description: "Video conferencing platform",
    longDescription: "Zoom enables virtual meetings, webinars, and team collaboration with HD video and audio.",
    color: "from-blue-500/20 to-sky-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Video calls", "Screen sharing", "Recordings", "Breakout rooms"],
    popular: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "google-meet",
    name: "Google Meet",
    category: "Communication",
    icon: Phone,
    rating: 4.7,
    installs: "58K+",
    description: "Google's video meeting solution",
    longDescription: "Google Meet provides secure, reliable video meetings integrated with Google Workspace.",
    color: "from-green-500/20 to-teal-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Video calls", "Calendar integration", "Live captions", "Recording"],
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },

  // Marketing
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    icon: Megaphone,
    rating: 4.7,
    installs: "48K+",
    description: "Email marketing and automation",
    longDescription: "Mailchimp helps you design, send, and analyze email campaigns with powerful automation tools.",
    color: "from-yellow-500/20 to-amber-500/10",
    setupTime: "10 min",
    complexity: "easy",
    features: ["Email campaigns", "Automation", "Landing pages", "Analytics"],
    popular: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    category: "Marketing",
    icon: Zap,
    rating: 4.8,
    installs: "32K+",
    description: "Customer experience automation",
    longDescription: "ActiveCampaign combines email marketing, automation, and CRM for personalized customer journeys.",
    color: "from-blue-500/20 to-indigo-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Email marketing", "Marketing automation", "CRM", "Sales automation"],
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    category: "Marketing",
    icon: TrendingUp,
    rating: 4.7,
    installs: "28K+",
    description: "E-commerce marketing platform",
    longDescription: "Klaviyo powers smarter digital relationships with email and SMS marketing for e-commerce brands.",
    color: "from-green-500/20 to-emerald-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Email marketing", "SMS marketing", "Segmentation", "Analytics"],
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },

  // Email
  {
    id: "gmail-api",
    name: "Gmail API",
    category: "Email",
    icon: Mail,
    rating: 4.9,
    installs: "72K+",
    description: "Google's email API",
    longDescription: "Access Gmail programmatically to read, send, and manage emails within your workflows.",
    color: "from-red-500/20 to-rose-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Send emails", "Read inbox", "Labels", "Attachments"],
    popular: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "outlook",
    name: "Outlook",
    category: "Email",
    icon: AtSign,
    rating: 4.7,
    installs: "55K+",
    description: "Microsoft's email service",
    longDescription: "Integrate with Outlook to manage emails, calendar events, and contacts in Microsoft 365.",
    color: "from-blue-500/20 to-cyan-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Email management", "Calendar sync", "Contacts", "Tasks"],
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "mailgun",
    name: "Mailgun",
    category: "Email",
    icon: Send,
    rating: 4.6,
    installs: "25K+",
    description: "Transactional email API",
    longDescription: "Mailgun provides powerful APIs for sending, receiving, and tracking transactional emails.",
    color: "from-red-500/20 to-orange-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Transactional email", "Email tracking", "Validation", "Analytics"],
    setupSteps: [apiKeyAuthStep, configStep, mappingStep, syncStep, testStep]
  },

  // ERP
  {
    id: "accountable-erp",
    name: "Accountable.link ERP",
    category: "ERP",
    icon: Building2,
    rating: 4.8,
    installs: "18K+",
    description: "Business resource planning",
    longDescription: "Comprehensive ERP solution for managing finances, inventory, HR, and operations in one platform.",
    color: "from-primary/20 to-primary/10",
    setupTime: "20 min",
    complexity: "advanced",
    features: ["Inventory", "HR management", "Financials", "Reporting"],
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "netsuite",
    name: "NetSuite",
    category: "ERP",
    icon: Boxes,
    rating: 4.7,
    installs: "32K+",
    description: "Oracle's cloud ERP solution",
    longDescription: "NetSuite provides a complete cloud ERP, CRM, and e-commerce platform for enterprises.",
    color: "from-orange-500/20 to-amber-500/10",
    setupTime: "30 min",
    complexity: "advanced",
    features: ["Financial management", "CRM", "E-commerce", "Inventory"],
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "sap",
    name: "SAP",
    category: "ERP",
    icon: Server,
    rating: 4.6,
    installs: "28K+",
    description: "Enterprise resource planning",
    longDescription: "SAP delivers intelligent ERP solutions for digital transformation and business process optimization.",
    color: "from-blue-500/20 to-indigo-500/10",
    setupTime: "45 min",
    complexity: "advanced",
    features: ["Finance", "Supply chain", "Procurement", "HR"],
    setupSteps: [apiKeyAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "dynamics365",
    name: "Dynamics 365",
    category: "ERP",
    icon: Globe,
    rating: 4.7,
    installs: "35K+",
    description: "Microsoft's business apps",
    longDescription: "Dynamics 365 combines CRM and ERP capabilities with AI-driven insights for modern enterprises.",
    color: "from-purple-500/20 to-violet-500/10",
    setupTime: "30 min",
    complexity: "advanced",
    features: ["Sales", "Finance", "Operations", "Customer service"],
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },

  // E-commerce
  {
    id: "shopify",
    name: "Shopify",
    category: "E-commerce",
    icon: ShoppingCart,
    rating: 4.9,
    installs: "68K+",
    description: "E-commerce platform",
    longDescription: "Shopify powers millions of online stores with complete e-commerce, payments, and shipping solutions.",
    color: "from-green-500/20 to-emerald-500/10",
    setupTime: "10 min",
    complexity: "easy",
    features: ["Product sync", "Order management", "Inventory", "Analytics"],
    popular: true,
    setupSteps: [oauthAuthStep, { ...configStep, fields: [
      { name: "store", label: "Select Store", type: "select", options: ["My Store", "Store 2", "Store 3"] },
      { name: "inventorySync", label: "Sync Inventory", type: "toggle", defaultValue: true },
      { name: "orderSync", label: "Sync Orders", type: "toggle", defaultValue: true }
    ]}, mappingStep, syncStep, testStep]
  },

  // Developer Tools
  {
    id: "github",
    name: "GitHub",
    category: "Developer Tools",
    icon: Github,
    rating: 4.9,
    installs: "82K+",
    description: "Code hosting and collaboration",
    longDescription: "GitHub is the world's leading platform for version control, collaboration, and code hosting.",
    color: "from-gray-500/20 to-slate-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Repositories", "Issues", "Pull requests", "Actions"],
    popular: true,
    setupSteps: [oauthAuthStep, { ...configStep, fields: [
      { name: "repo", label: "Repository", type: "select", options: ["All repositories", "Select specific"] },
      { name: "events", label: "Trigger Events", type: "select", options: ["Push", "Pull Request", "Issues", "All"] }
    ]}, mappingStep, syncStep, testStep]
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "Developer Tools",
    icon: GitBranch,
    rating: 4.7,
    installs: "38K+",
    description: "DevOps lifecycle platform",
    longDescription: "GitLab provides a complete DevOps platform for source code management, CI/CD, and security.",
    color: "from-orange-500/20 to-red-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Git hosting", "CI/CD", "Security scanning", "Project management"],
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "jira",
    name: "Jira",
    category: "Developer Tools",
    icon: Layout,
    rating: 4.6,
    installs: "52K+",
    description: "Project and issue tracking",
    longDescription: "Jira is the leading project management tool for agile teams to plan, track, and release software.",
    color: "from-blue-500/20 to-indigo-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Issue tracking", "Sprints", "Roadmaps", "Reporting"],
    popular: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "linear",
    name: "Linear",
    category: "Developer Tools",
    icon: ListTodo,
    rating: 4.8,
    installs: "25K+",
    description: "Modern project management",
    longDescription: "Linear is the issue tracking tool built for modern software teams with a focus on speed.",
    color: "from-indigo-500/20 to-violet-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Issue tracking", "Cycles", "Roadmaps", "Integrations"],
    new: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Developer Tools",
    icon: Workflow,
    rating: 4.7,
    installs: "28K+",
    description: "Workflow automation platform",
    longDescription: "n8n is a fair-code workflow automation platform that connects apps and automates workflows.",
    color: "from-pink-500/20 to-rose-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Visual workflows", "200+ integrations", "Self-hostable", "Custom nodes"],
    supportsAgentProtocol: true,
    setupSteps: [apiKeyAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Developer Tools",
    icon: Zap,
    rating: 4.8,
    installs: "75K+",
    description: "Connect your apps",
    longDescription: "Zapier automates workflows by connecting 5,000+ apps without code. Build Zaps that work for you.",
    color: "from-orange-500/20 to-amber-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["5000+ apps", "Multi-step Zaps", "Filters", "Formatters"],
    popular: true,
    supportsAgentProtocol: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "make",
    name: "Make.com",
    category: "Developer Tools",
    icon: Wand2,
    rating: 4.7,
    installs: "42K+",
    description: "Visual automation platform",
    longDescription: "Make (formerly Integromat) lets you design, build, and automate complex workflows visually.",
    color: "from-purple-500/20 to-violet-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Visual builder", "Advanced logic", "Scheduling", "Data mapping"],
    supportsAgentProtocol: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },

  // Accounting
  {
    id: "xero",
    name: "Xero",
    category: "Accounting",
    icon: Calculator,
    rating: 4.8,
    installs: "45K+",
    description: "Cloud accounting software",
    longDescription: "Xero provides cloud-based accounting software with invoicing, bank reconciliation, and reporting.",
    color: "from-cyan-500/20 to-blue-500/10",
    setupTime: "15 min",
    complexity: "medium",
    features: ["Invoicing", "Bank feeds", "Payroll", "Reporting"],
    popular: true,
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    icon: Receipt,
    rating: 4.7,
    installs: "58K+",
    description: "Small business accounting",
    longDescription: "QuickBooks helps small businesses manage invoices, expenses, and taxes in one place.",
    color: "from-green-500/20 to-emerald-500/10",
    setupTime: "15 min",
    complexity: "medium",
    features: ["Invoicing", "Expense tracking", "Tax prep", "Reports"],
    popular: true,
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },
  {
    id: "myob",
    name: "MYOB",
    category: "Accounting",
    icon: DollarSign,
    rating: 4.5,
    installs: "22K+",
    description: "Business management platform",
    longDescription: "MYOB provides accounting, payroll, and payments solutions for Australian and NZ businesses.",
    color: "from-purple-500/20 to-indigo-500/10",
    setupTime: "15 min",
    complexity: "medium",
    features: ["Accounting", "Payroll", "Banking", "Tax"],
    setupSteps: [oauthAuthStep, accountingConfigStep, mappingStep, syncStep, testStep]
  },

  // E-Sign
  {
    id: "pleasesign",
    name: "PleaseSign",
    category: "E-Sign",
    icon: PenTool,
    rating: 4.8,
    installs: "18K+",
    description: "Digital signature solution",
    longDescription: "PleaseSign provides legally binding e-signatures with document templates and audit trails.",
    color: "from-blue-500/20 to-cyan-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["E-signatures", "Templates", "Audit trail", "Reminders"],
    setupSteps: [oauthAuthStep, { ...configStep, fields: [
      { name: "template", label: "Default Template", type: "select", options: ["Contract", "NDA", "Agreement", "Custom"] },
      { name: "reminders", label: "Send Reminders", type: "toggle", defaultValue: true },
      { name: "auditTrail", label: "Enable Audit Trail", type: "toggle", defaultValue: true }
    ]}, mappingStep, syncStep, testStep]
  },

  // Scheduling
  {
    id: "cal",
    name: "Cal.com",
    category: "Scheduling",
    icon: Calendar,
    rating: 4.8,
    installs: "28K+",
    description: "Open-source scheduling",
    longDescription: "Cal.com is the open-source alternative to Calendly for scheduling meetings without conflicts.",
    color: "from-gray-500/20 to-slate-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Calendar sync", "Team scheduling", "Custom booking", "Workflows"],
    new: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Scheduling",
    icon: Clock,
    rating: 4.8,
    installs: "52K+",
    description: "Meeting scheduling tool",
    longDescription: "Calendly eliminates back-and-forth emails for scheduling with automated meeting booking.",
    color: "from-blue-500/20 to-indigo-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Smart scheduling", "Team pages", "Reminders", "Integrations"],
    popular: true,
    setupSteps: [oauthAuthStep, configStep, mappingStep, syncStep, testStep]
  },

  // API/Protocol
  {
    id: "generic-api",
    name: "Generic API",
    category: "API/Protocol",
    icon: Plug,
    rating: 4.6,
    installs: "35K+",
    description: "Connect any REST API",
    longDescription: "Connect to any REST API endpoint with custom authentication, headers, and data mapping.",
    color: "from-gray-500/20 to-slate-500/10",
    setupTime: "15 min",
    complexity: "advanced",
    features: ["REST API", "Custom auth", "Headers", "Data mapping"],
    supportsAgentProtocol: true,
    setupSteps: [{ ...apiKeyAuthStep, fields: [
      { name: "endpoint", label: "API Endpoint", type: "text", placeholder: "https://api.example.com/v1", required: true },
      { name: "authType", label: "Auth Type", type: "select", options: ["API Key", "Bearer Token", "Basic Auth", "OAuth 2.0"] },
      { name: "apiKey", label: "API Key / Token", type: "password", placeholder: "Enter your API key" }
    ]}, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "agent-protocol",
    name: "Agent Protocol",
    category: "API/Protocol",
    icon: MousePointer,
    rating: 4.7,
    installs: "12K+",
    description: "AI agent communication standard",
    longDescription: "Connect AI agents using the standardized Agent Protocol for interoperability and orchestration.",
    color: "from-violet-500/20 to-purple-500/10",
    setupTime: "10 min",
    complexity: "medium",
    features: ["Agent-to-agent", "Task delegation", "State sync", "Event streaming"],
    new: true,
    supportsAgentProtocol: true,
    setupSteps: [{ ...apiKeyAuthStep, fields: [
      { name: "agentUrl", label: "Agent URL", type: "text", placeholder: "https://agent.example.com", required: true },
      { name: "apiKey", label: "API Key", type: "password", placeholder: "Enter agent API key" },
      { name: "protocol", label: "Protocol Version", type: "select", options: ["v1.0", "v1.1", "v2.0-beta"] }
    ]}, configStep, mappingStep, syncStep, testStep]
  },
  {
    id: "webhook",
    name: "Webhooks",
    category: "API/Protocol",
    icon: Settings,
    rating: 4.5,
    installs: "42K+",
    description: "Receive real-time events",
    longDescription: "Set up webhook endpoints to receive real-time notifications from any service.",
    color: "from-emerald-500/20 to-green-500/10",
    setupTime: "5 min",
    complexity: "easy",
    features: ["Real-time events", "Custom endpoints", "Payload mapping", "Retry logic"],
    supportsAgentProtocol: true,
    setupSteps: [{ ...apiKeyAuthStep, fields: [
      { name: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "Your webhook endpoint will be generated" },
      { name: "secret", label: "Webhook Secret", type: "password", placeholder: "Auto-generated for verification" },
      { name: "events", label: "Event Types", type: "select", options: ["All events", "Create only", "Update only", "Delete only"] }
    ]}, configStep, mappingStep, syncStep, testStep]
  }
];

export const categories = [
  { id: "all", name: "All", icon: Plug },
  { id: "ai-models", name: "AI Models", icon: Brain },
  { id: "crm", name: "CRM", icon: Users },
  { id: "communication", name: "Communication", icon: Video },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "email", name: "Email", icon: Mail },
  { id: "erp", name: "ERP", icon: Building2 },
  { id: "e-commerce", name: "E-commerce", icon: ShoppingCart },
  { id: "developer-tools", name: "Developer Tools", icon: Github },
  { id: "accounting", name: "Accounting", icon: Calculator },
  { id: "e-sign", name: "E-Sign", icon: PenTool },
  { id: "scheduling", name: "Scheduling", icon: Calendar },
  { id: "api-protocol", name: "API/Protocol", icon: Settings }
];
