import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Comprehensive knowledge base for Implementation Partners
const IMPLEMENTATION_PARTNER_KNOWLEDGE_BASE = `
# IMPLEMENTATION PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. PROGRAM OVERVIEW

| Topic | Information |
|-------|-------------|
| What It Is | Help clients implement, customize, and optimize AlfredAI solutions |
| Role | Technical delivery, training, and ongoing support for client projects |
| Target Partners | System integrators, IT consultants, AI agencies, MSPs |
| Relationship | Technical extension of the AlfredAI team |

## 2. REVENUE MODEL & EARNINGS

| Topic | Information |
|-------|-------------|
| Implementation Fees | Bill clients directly for implementation services (you set rates) |
| Typical Hourly Rate | $150 - $350/hour depending on complexity and region |
| Project-Based Fees | Common for fixed-scope implementations ($5,000 - $50,000+) |
| Managed Services | Ongoing support retainers ($1,000 - $10,000+/month) |
| Referral Commission | 10% on license revenue for clients you bring |
| Training Revenue | Bill for end-user training sessions |
| Margin Control | You control your pricing and margins |

## 3. CERTIFICATION REQUIREMENTS

| Level | Requirements |
|-------|-------------|
| Certified Partner | Complete online training (8-10 hours), pass assessment (80%+) |
| Advanced Partner | 3+ implementations, advanced training, client references |
| Premier Partner | 10+ implementations, dedicated solutions architect, co-sell status |
| Renewal | Annual recertification (simplified for active partners) |
| Cost | Free to join and certify |

## 4. TECHNICAL TRAINING & RESOURCES

| Resource | Description |
|----------|-------------|
| Implementation Academy | Self-paced online training covering all modules |
| Technical Documentation | Full API docs, integration guides, architecture references |
| Sandbox Environment | Free development environment for testing |
| Solution Templates | Pre-built templates for common implementations |
| Code Samples | GitHub repository with integration examples |
| Partner Slack | Direct line to AlfredAI engineering team |
| Office Hours | Weekly technical Q&A sessions |

## 5. SUPPORT PROVIDED

| Support Type | Details |
|--------------|---------|
| Dedicated Partner Manager | Assigned after certification |
| Technical Support Tier | Priority queue for partner support tickets |
| Escalation Path | Direct access to engineering for complex issues |
| Pre-Sales Support | Solution architecture help for proposals |
| Implementation Reviews | Optional architecture review before go-live |
| Response Time | Same business day for urgent matters |

## 6. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| System Integrators | Strong technical delivery capabilities |
| IT Consulting Firms | Trusted advisors to enterprise clients |
| AI/Automation Agencies | Expertise in AI implementation |
| Managed Service Providers | Ongoing relationship with clients |
| Digital Transformation Consultants | Strategic + technical capabilities |
| Industry-Specific Consultants | Deep vertical expertise |

## 7. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Apply via Partners page (5 minutes) |
| Step 2 | Discovery call with Partner Manager (30 min) |
| Step 3 | Complete certification training (8-10 hours, self-paced) |
| Step 4 | Pass certification assessment (80%+ required) |
| Step 5 | Access Partner Portal, sandbox, and resources |
| Step 6 | First project kickoff support |

Timeline: Most partners complete certification within 2-3 weeks.

## 8. PARTNER PORTAL FEATURES

| Feature | Description |
|---------|-------------|
| Dashboard | Project pipeline, certifications, resources |
| Technical Docs | Full documentation library |
| Deal Registration | Register and track opportunities |
| Training Center | Certification courses and advanced modules |
| Support Portal | Submit and track support tickets |
| Resource Library | Templates, guides, and marketing materials |

## 9. CO-MARKETING SUPPORT

| Resource | Availability |
|----------|--------------|
| Partner Directory Listing | Featured after first implementation |
| Case Study Development | Joint case studies for significant projects |
| Certification Badges | Use AlfredAI Certified Partner branding |
| Event Participation | Invitation to partner events and webinars |
| Joint Marketing | Co-sponsored campaigns (Premier Partners) |

## 10. HOW IT WORKS (Project Flow)

1. IDENTIFY opportunity (client needing implementation)
2. REGISTER the deal in Partner Portal
3. SCOPE the project (with AlfredAI support if needed)
4. IMPLEMENT using our frameworks and templates
5. TRAIN end users on the solution
6. SUPPORT ongoing optimization and enhancements

Your Role: Full technical delivery and client relationship
AlfredAI Role: Platform, training, and escalation support

## 11. FREQUENTLY ASKED QUESTIONS

Q: Do I need to be technical?
A: Yes! Implementation Partners handle technical delivery. This program is for IT professionals and technical consultants.

Q: How long does certification take?
A: The training is 8-10 hours self-paced. Most partners complete it within 1-2 weeks.

Q: Can I be both a Referral and Implementation Partner?
A: Yes! Many partners start with referrals and add implementation capabilities over time.

Q: What if I need help on a complex project?
A: We offer architecture reviews, office hours, and escalation support for all certified partners.

Q: Is there a minimum project commitment?
A: No minimums. Complete one project per year to maintain active status.

## 12. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Enterprise or government implementations
- Custom integration requirements
- White-label delivery
- Volume discounts
- Partnership tier upgrades
- Legal or compliance requirements
- Multi-region deployments

Suggest booking a call with the partnerships team.

## 13. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | "Apply Now" buttons on the Partners page |
| Where to Find | Scroll to the bottom of /company/partners or click "Become a Partner" |
| Application Process | Complete form with name, email, company, expertise areas |
| Time to Complete | About 2-3 minutes |
| Response Time | Discovery call scheduled within 48 hours |
| Cost | Free - no fees to join or certify |
`;

// Comprehensive knowledge base for Referral Partners
const REFERRAL_PARTNER_KNOWLEDGE_BASE = `
# REFERRAL PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. COMMISSION & EARNINGS

| Topic | Information |
|-------|-------------|
| Base Commission Rate | 20% of first-year contract value |
| Maximum Commission | Up to 50% for high-volume partners |
| Average Partner Commission | 27% across all referral partners |
| Minimum Deal Size | $5,000 annual contract value |
| Typical Deal Range | $12,000 - $120,000 annual contract value |
| Commission Calculation | Based on first-year contract value (setup fees excluded) |
| Payment Terms | Net 30 days after client's first invoice payment clears |
| Payment Method | ACH/Bank transfer (US), Wire transfer (International) |
| Monthly Minimum Payout | $100 (smaller amounts roll to next month) |
| Commission on Renewals | 10% on Year 2+ renewals (for qualified partners) |
| Performance Bonuses | Quarterly bonuses for 5+ deals: $1,000-$5,000 |

## 2. DEAL REGISTRATION & PROTECTION

| Topic | Information |
|-------|-------------|
| Protection Period | 90 days from registration date |
| Registration Method | Online via Partner Portal (instant confirmation) |
| Required Information | Company name, contact name, email, estimated deal size |
| First-Come-First-Served | Yes, based on timestamp of registration |
| Conflict Resolution | Dedicated Partner Success Manager mediates disputes |
| Deal Updates | Partners can update deal stage and notes anytime |
| Expiration Handling | 14-day reminder before expiration; 30-day extension available |
| Multi-Partner Leads | First to register gets 100% protection; no split commissions |
| Self-Service Portal | Real-time deal tracking, status updates, commission visibility |

## 3. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Complete online application (5 minutes) |
| Step 2 | Application review by partnerships team (24-48 hours) |
| Step 3 | Approval notification via email |
| Step 4 | Welcome call with Partner Success Manager (30 min) |
| Step 5 | Access Partner Portal and marketing materials |
| Step 6 | Complete optional certification (earns higher commission tier) |

Timeline: Most partners are fully onboarded within 1 week.

## 4. PARTNER PORTAL FEATURES

| Feature | Description |
|---------|-------------|
| Dashboard | Overview of deals, commissions, performance metrics |
| Deal Registration | Register and track deals in real-time |
| Marketing Library | Download co-branded materials, case studies, one-pagers |
| Commission Statements | View pending and paid commissions |
| Training Center | On-demand videos, certification courses |
| Lead Tracker | Monitor lead-to-close conversion rates |
| Support Tickets | Direct line to Partner Success team |
| Partner Directory | (Optional) Get listed as certified AlfredAI partner |

## 5. CO-MARKETING SUPPORT

| Resource | Availability |
|----------|--------------|
| Co-Branded Collateral | Available to all partners - customizable templates |
| Partner Logo on Website | Featured in Partner Directory after first closed deal |
| Joint Case Studies | Available after 2+ successful implementations |
| Social Media Amplification | We reshare partner success stories |
| Newsletter Features | Quarterly partner spotlight opportunities |
| Webinar Speaking | Invitation to present at AlfredAI monthly webinars |
| Event Sponsorship | Co-sponsorship opportunities at industry events |
| Press Release Support | For significant partnerships (10+ deals/year) |

## 6. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| Business Consultants | Advising clients on digital transformation, efficiency |
| IT Advisors & MSPs | Recommending technology solutions to SMB/enterprise |
| Industry Influencers | Engaged audience interested in AI and automation |
| Professional Network Connectors | Active in business communities, BNI, chambers |
| Fractional Executives | CIOs, COOs advising multiple companies |
| Management Consultants | Process improvement and strategy advisors |
| Accountants & Bookkeepers | Trusted financial advisors to business owners |

Industries We Serve: Construction, Legal, Healthcare, Real Estate, Financial Services, Manufacturing, Logistics, Hospitality, Retail, Professional Services

## 7. QUALIFICATION CRITERIA

| Requirement | Details |
|-------------|---------|
| Minimum Requirements | Active business or professional practice, ability to identify leads |
| No Upfront Cost | Free to join, no fees ever |
| Geographic Coverage | Worldwide - we support partners globally |
| Existing Network | Helpful but not required - we provide lead generation training |
| Technical Knowledge | Not required - we handle all demos and technical discussions |
| Exclusivity | Non-exclusive - partner with us alongside other vendors |

## 8. HOW IT WORKS (Lead-to-Commission Flow)

1. IDENTIFY a lead (business needing AI/automation)
2. REGISTER the lead in Partner Portal
3. INTRODUCE via warm email (we provide templates)
4. HANDOFF to AlfredAI sales team
5. RELAX while we handle demos, proposals, closing
6. GET PAID when client pays their first invoice

Your Effort: Identify and introduce
Our Effort: Demo, propose, close, implement, support

## 9. SUPPORT & COMMUNICATION

| Support Type | Details |
|--------------|---------|
| Dedicated Partner Success Manager | Assigned within 48 hours of approval |
| Response Time | Same business day for email; immediate for urgent matters |
| Partner Slack Channel | Real-time communication with AlfredAI team |
| Monthly Partner Webinars | Product updates, sales tips, success stories |
| Quarterly Business Reviews | Performance review and goal setting (optional) |
| Partner Advisory Board | Top partners invited to shape product roadmap |

## 10. FREQUENTLY ASKED QUESTIONS

Q: Do I need to be technical?
A: No! We handle all technical demos, proposals, and implementations. You just make introductions.

Q: What if my lead doesn't close?
A: No problem - you only earn commission on closed deals. No penalties for leads that don't convert.

Q: Can I refer myself or my own company?
A: No, the referral program is for third-party introductions only.

Q: Is there a minimum number of referrals required?
A: No minimums. Refer one deal or one hundred - it's entirely up to you.

Q: How do I know if a lead is qualified?
A: If they have 5+ employees, operational pain points, and are considering automation - they're likely qualified. When in doubt, register them!

Q: What happens after I make an introduction?
A: We take over completely - scheduling, demos, proposals, closing. You'll receive status updates in the Partner Portal.

Q: Can I lose my partner status?
A: Only for policy violations (misrepresentation, spam, etc.). Inactive partners remain in good standing.

Q: Do you provide sales training?
A: Yes! We offer optional certification that includes identifying qualified leads, making effective introductions, and industry-specific positioning.

## 11. SUCCESS STORIES & BENCHMARKS

| Metric | Value |
|--------|-------|
| Average Time to First Deal | 45 days |
| Average Partner Earnings (Year 1) | $12,000 - $35,000 |
| Top Partner Earnings (Year 1) | $150,000+ |
| Average Deal Close Rate | 35% of registered leads |
| Lead-to-Introduction Time | 3-5 days recommended |
| Partner Retention Rate | 89% year-over-year |

## 12. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Custom commission structures
- Enterprise or government deals
- White-label or reseller arrangements
- Multi-partner conflict resolution
- Custom co-marketing campaigns
- International payment arrangements
- NDA or legal agreements
- Specific client requirements
- Bulk/volume deal structures
- Partnership tier upgrades

Suggest booking a call with the partnerships team.

## 13. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | The "Apply Now" and "Become a Partner" buttons are on the Partners page |
| Where to Find | Scroll to the bottom of the Partners page, or click "Become a Partner" in the hero section |
| Application Process | Clicking the button opens a form where you provide name, email, company, partnership type, industry, and client base size |
| Time to Complete | Takes about 2-3 minutes |
| Direct Link | Visit the Partners page at /company/partners and click "Apply Now" |
| Response Time | Our partnerships team responds within 48 hours |
| No Cost | Free to apply - no fees or obligations |
`;

// Comprehensive knowledge base for Sales Partners
const SALES_PARTNER_KNOWLEDGE_BASE = `
# SALES PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. COMMISSION & EARNINGS

| Topic | Information |
|-------|-------------|
| Base Commission | 10% on setup/implementation revenue |
| High-Volume Bonus | Extra 2% when monthly sales reach $100,000+ |
| Effective Rate at $100K+ | 12% total commission |
| Payment Terms | Net 30 days after client invoice paid |
| Payment Method | ACH/Bank transfer (US), Wire (International) |
| Minimum Payout | $100 (smaller amounts roll to next month) |

**IMPORTANT:** The extra 2% bonus applies to ALL your revenue that month once you hit the $100K threshold - not just the amount above $100K.

## 2. EARNINGS CALCULATION EXAMPLES

| Scenario | Monthly Setup Revenue | Base (10%) | Bonus (2%) | Total Earnings |
|----------|----------------------|------------|------------|----------------|
| 2 small deals | $25,000 | $2,500 | — | **$2,500/month** |
| 4 medium deals | $60,000 | $6,000 | — | **$6,000/month** |
| Hitting $100K threshold | $100,000 | $10,000 | +$2,000 | **$12,000/month** |
| High performer | $150,000 | $15,000 | +$3,000 | **$18,000/month** |
| Top performer | $200,000 | $20,000 | +$4,000 | **$24,000/month** |

**Annual Earning Potential:**
- Conservative (avg $50K/mo): $60,000/year
- Target ($100K/mo): $144,000/year
- High performer ($200K/mo): $288,000/year

## 3. TERRITORY EXCLUSIVITY

| Topic | Information |
|-------|-------------|
| Regional Protection | Available for qualified partners |
| Allocation | First-come-first-served in approved regions |
| Requirements | Minimum monthly sales targets to maintain exclusivity |
| Multi-Territory | Top performers can earn additional territories |
| Territory Types | Geographic (city/state/country) or vertical (industry) |

## 4. SALES ENABLEMENT RESOURCES

| Resource | Description |
|----------|-------------|
| Sales Playbook | Comprehensive guide with scripts, objection handling |
| Demo Environment | Full product access for client demonstrations |
| Pitch Deck | Customizable presentation materials |
| ROI Calculator | Tool to show clients potential savings |
| Case Studies | Industry-specific success stories |
| Competitive Analysis | Battle cards vs major competitors |
| Proposal Templates | Professional quote and proposal docs |

## 5. TRAINING & CERTIFICATION

| Level | Requirements |
|-------|-------------|
| Certified Sales Partner | Complete sales training (6 hours), pass assessment |
| Advanced Sales Partner | $250K+ lifetime sales, advanced product training |
| Elite Sales Partner | $1M+ lifetime sales, strategic account access |
| Renewal | Annual recertification (simplified for active partners) |

## 6. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| B2B Sales Professionals | Existing enterprise sales experience |
| Industry Specialists | Deep vertical expertise and networks |
| Former Software Sales Reps | SaaS sales experience |
| Business Development Consultants | Strong prospecting skills |
| Regional Sales Organizations | Local market knowledge |

## 7. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Apply via Partners page (5 minutes) |
| Step 2 | Discovery call with Partner Manager (30 min) |
| Step 3 | Complete sales training (6 hours, self-paced) |
| Step 4 | Shadow AlfredAI sales calls (2-3 sessions) |
| Step 5 | First solo sales call with support |
| Step 6 | Full autonomy after 3 closed deals |

Timeline: Most partners are selling independently within 2-3 weeks.

## 8. SUPPORT PROVIDED

| Support Type | Details |
|--------------|---------|
| Dedicated Sales Manager | Assigned after certification |
| Deal Desk Support | Help with complex pricing and proposals |
| Technical Pre-Sales | Engineers available for technical discussions |
| Marketing Support | Lead generation and campaign assistance |
| Weekly Sales Meetings | Strategy sessions and pipeline reviews |

## 9. HOW IT WORKS (Sales Flow)

1. PROSPECT for opportunities in your territory
2. QUALIFY leads using our criteria
3. DEMO AlfredAI using your sales environment
4. PROPOSE using our templates and pricing
5. CLOSE the deal with support as needed
6. HANDOFF to implementation team
7. GET PAID when client pays

Your Role: Full sales cycle ownership
AlfredAI Role: Support, implementation, and customer success

## 10. FREQUENTLY ASKED QUESTIONS

Q: Do I need prior software sales experience?
A: Helpful but not required. B2B sales experience is more important than software-specific background.

Q: How do I get leads?
A: You prospect in your territory. We provide marketing support and some qualified leads to top performers.

Q: What's the average deal size?
A: Setup fees range from $5,000 - $100,000+ depending on client size and complexity.

Q: Can I sell remotely?
A: Yes! Most sales are done via video call. Some enterprise deals may require in-person meetings.

Q: What if I lose my territory exclusivity?
A: You'll receive a warning and support plan before any changes. We want you to succeed.

## 11. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Custom territory arrangements
- Enterprise or government deals
- Volume discount structures
- White-label or reseller arrangements
- Partnership tier upgrades
- Legal or compliance requirements
- International expansion

Suggest booking a call with the partnerships team.

## 12. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | "Apply Now" buttons on the Partners page |
| Where to Find | Scroll to the bottom of /company/partners or click "Become a Partner" |
| Application Process | Complete form with name, email, company, sales experience |
| Time to Complete | About 2-3 minutes |
| Response Time | Discovery call scheduled within 48 hours |
| Cost | Free - no fees to join or certify |
`;

// Comprehensive knowledge base for Technology Partners
const TECHNOLOGY_PARTNER_KNOWLEDGE_BASE = `
# TECHNOLOGY PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. PROGRAM OVERVIEW

| Topic | Information |
|-------|-------------|
| What It Is | Build integrations between your product and AlfredAI |
| Goal | Create enhanced joint solutions for mutual customers |
| Target Partners | SaaS companies, platform providers, tool vendors |
| Relationship | Technical partnership with shared go-to-market |

## 2. INTEGRATION BENEFITS

| Benefit | Description |
|---------|-------------|
| Full REST API Access | Complete API documentation and endpoints |
| Sandbox Environment | Free development environment for testing |
| Technical Documentation | SDKs, code samples, architecture guides |
| Dedicated Integration Engineer | Assigned support during development |
| Webhook Support | Real-time event notifications |
| OAuth Integration | Seamless authentication for users |
| Rate Limits | Generous limits for certified partners |

## 3. REVENUE MODEL

| Topic | Information |
|-------|-------------|
| Revenue Share | Up to 20% on customers acquired through integration |
| Marketplace Listing | Featured placement drives customer acquisition |
| Co-Sell Opportunities | Joint sales with AlfredAI sales team |
| Lead Sharing | Mutual lead referrals |
| Launch Partner Benefits | Waived marketplace fees for first 12 months |

## 4. GO-TO-MARKET SUPPORT

| Resource | Availability |
|----------|--------------|
| Joint Solution Briefs | Co-branded documentation |
| Case Study Development | Joint customer success stories |
| Marketplace Listing | Featured in AlfredAI marketplace |
| Co-Marketing Campaigns | Joint webinars, content, events |
| Press Releases | For significant partnerships |
| Sales Training | Train AlfredAI sales on your product |

## 5. TECHNICAL REQUIREMENTS

| Requirement | Details |
|-------------|---------|
| API Integration | REST or GraphQL endpoints |
| Authentication | OAuth 2.0 support |
| Documentation | User-facing integration guide |
| Testing | Sandbox validation before launch |
| Support | Customer support for integration issues |
| SLA | 99.9% uptime for production integrations |

## 6. CERTIFICATION LEVELS

| Level | Requirements |
|-------|-------------|
| Integrated Partner | Basic integration completed, marketplace listing |
| Certified Partner | Deep integration, co-sell enabled, training complete |
| Premier Partner | Strategic partnership, joint product development |

## 7. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Apply via Partners page (5 minutes) |
| Step 2 | Technical discovery call (45 min) |
| Step 3 | Receive API credentials and documentation |
| Step 4 | Build integration (timeline varies) |
| Step 5 | Complete certification testing |
| Step 6 | Launch in marketplace |

Timeline: Simple integrations in 2-4 weeks; complex integrations 2-3 months.

## 8. SUPPORT PROVIDED

| Support Type | Details |
|--------------|---------|
| Dedicated Integration Engineer | Assigned during development |
| Technical Office Hours | Weekly Q&A sessions |
| Slack Channel | Real-time communication with engineering |
| Documentation Updates | Early access to API changes |
| Beta Access | Test new features before release |

## 9. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| CRM Platforms | Customer data synchronization |
| Communication Tools | Messaging and notification integration |
| Analytics Platforms | Data and reporting enhancement |
| Productivity Suites | Workflow and task management |
| Industry Software | Vertical-specific solutions |
| Data Platforms | ETL and data processing |

## 10. FREQUENTLY ASKED QUESTIONS

Q: How long does integration take?
A: Simple integrations: 2-4 weeks. Complex integrations: 2-3 months. We support your timeline.

Q: Do you charge for API access?
A: No! API access is free for all certified technology partners.

Q: Can we white-label the integration?
A: Yes, for Premier Partners. Discuss specifics with our partnerships team.

Q: What if we need a custom API endpoint?
A: We're open to building custom endpoints for strategic partnerships.

Q: How do we handle customer support?
A: You support integration-specific issues; we support AlfredAI platform issues.

## 11. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Custom API requirements
- White-label or OEM arrangements
- Enterprise SLA requirements
- Joint product development
- Revenue share negotiations
- Strategic partnership discussions

Suggest booking a call with the partnerships team.

## 12. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | "Apply Now" buttons on the Partners page |
| Where to Find | Scroll to the bottom of /company/partners or click "Become a Partner" |
| Application Process | Complete form with product details and integration goals |
| Time to Complete | About 5 minutes |
| Response Time | Technical discovery call within 1 week |
| Cost | Free - no fees for API access |
`;

// Comprehensive knowledge base for Consulting Partners
const CONSULTING_PARTNER_KNOWLEDGE_BASE = `
# CONSULTING PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. PROGRAM OVERVIEW

| Topic | Information |
|-------|-------------|
| What It Is | Advise clients on digital transformation with AlfredAI |
| Role | Strategic advisory, solution design, change management |
| Target Partners | Management consultants, strategy firms, advisors |
| Relationship | Strategic extension of AlfredAI's advisory capabilities |

## 2. PARTNERSHIP MODEL

| Benefit | Description |
|---------|-------------|
| White-Glove Resources | Executive briefings, strategy frameworks |
| Custom Solution Design | Work with our architects on client solutions |
| Change Management Support | Training and adoption resources |
| Digital Transformation Toolkit | Comprehensive advisory materials |
| Executive Briefing Access | Arrange C-level briefings for your clients |

## 3. REVENUE OPPORTUNITIES

| Revenue Stream | Details |
|----------------|---------|
| Consulting Services | Bill clients at your rates (you keep 100%) |
| Referral Commission | 10% on AlfredAI license revenue |
| Implementation Oversight | Advisory fees during implementation |
| Strategic Retainers | Ongoing advisory relationships |
| Training Programs | Client training and workshop fees |

**Example Earnings:**
- Strategy engagement: $20,000 - $100,000+
- Referral commission: 10% of license (avg $5,000 - $15,000)
- Implementation advisory: $150 - $400/hour

## 4. RESOURCES PROVIDED

| Resource | Description |
|----------|-------------|
| Industry Playbooks | Vertical-specific transformation guides |
| ROI Calculator | Executive-ready business case tools |
| Executive Presentations | Board-ready slide templates |
| Best Practice Guides | Implementation and adoption frameworks |
| Product Roadmap Access | Early insight into upcoming features |
| Case Studies | Client success stories for your proposals |
| Benchmark Data | Industry performance metrics |

## 5. SUPPORT PROVIDED

| Support Type | Details |
|--------------|---------|
| Partner Success Manager | Strategic relationship management |
| Executive Sponsor | Senior AlfredAI contact for key deals |
| Solution Architects | Technical design support |
| Pre-Sales Support | Joint client presentations |
| Quarterly Business Reviews | Strategy and pipeline discussions |

## 6. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| Management Consultants | Strategic advisory to enterprises |
| Digital Transformation Firms | End-to-end transformation services |
| Strategy Consultancies | C-level advisory relationships |
| Industry Specialists | Deep vertical expertise |
| Fractional CXOs | Executive advisory services |
| Change Management Firms | Adoption and training expertise |

## 7. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Apply via Partners page (5 minutes) |
| Step 2 | Strategy call with Partner Manager (45 min) |
| Step 3 | Access resource library and toolkit |
| Step 4 | Product deep-dive training (4 hours) |
| Step 5 | Joint opportunity identification |

Timeline: Most partners are active within 2 weeks.

## 8. CERTIFICATION LEVELS

| Level | Requirements |
|-------|-------------|
| Consulting Partner | Complete training, access to resources |
| Strategic Partner | 3+ client engagements, advanced training |
| Premier Consulting Partner | 10+ engagements, executive sponsor access |

## 9. HOW IT WORKS (Engagement Flow)

1. IDENTIFY client digital transformation needs
2. ASSESS current state and opportunities
3. DESIGN solution with AlfredAI support
4. PROPOSE to client (your engagement + AlfredAI license)
5. DELIVER advisory and change management
6. OVERSEE implementation (done by Implementation Partners)
7. MEASURE success and expand engagement

Your Role: Strategy, advisory, change management
AlfredAI Role: Platform, implementation support, success metrics

## 10. FREQUENTLY ASKED QUESTIONS

Q: Do I need to be technical?
A: No! Consulting Partners focus on strategy and advisory. Technical work is handled by Implementation Partners.

Q: Can I also implement?
A: Yes! You can become both a Consulting and Implementation Partner.

Q: What's the minimum engagement size?
A: No minimums. We support engagements of all sizes.

Q: How do I access executive briefings?
A: Request through your Partner Success Manager. Available for qualified opportunities.

Q: Do you provide industry-specific resources?
A: Yes! We have playbooks for 15+ industry verticals.

## 11. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Enterprise or government engagements
- Custom resource development
- White-label advisory services
- Strategic partnership arrangements
- Executive sponsor assignments
- Joint go-to-market campaigns

Suggest booking a call with the partnerships team.

## 12. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | "Apply Now" buttons on the Partners page |
| Where to Find | Scroll to the bottom of /company/partners or click "Become a Partner" |
| Application Process | Complete form with consulting focus areas |
| Time to Complete | About 2-3 minutes |
| Response Time | Strategy call scheduled within 48 hours |
| Cost | Free - no fees to join |
`;

// Comprehensive knowledge base for Training Partners
const TRAINING_PARTNER_KNOWLEDGE_BASE = `
# TRAINING PARTNER PROGRAM - COMPLETE KNOWLEDGE BASE

## 1. PROGRAM OVERVIEW

| Topic | Information |
|-------|-------------|
| What It Is | Deliver official AlfredAI training and certification programs |
| Role | Train enterprise clients and end users on AlfredAI |
| Target Partners | Training companies, educators, learning consultants |
| Relationship | Authorized training delivery partner |

## 2. CERTIFICATION REQUIREMENTS

| Requirement | Details |
|-------------|---------|
| Train-the-Trainer Program | 16 hours of instructor training |
| Assessment Score | Pass with 85%+ on certification exam |
| Practical Evaluation | Deliver practice session with feedback |
| Annual Recertification | Simplified renewal for active trainers |
| Prerequisites | Training/teaching experience preferred |

## 3. REVENUE MODEL

| Revenue Stream | Details |
|----------------|---------|
| Per-Student Revenue Share | $50 - $150 per student trained |
| Enterprise Training Contracts | Bill clients directly (you set rates) |
| Certification Exam Fees | $50 per exam administered |
| Custom Program Development | Fees for specialized training creation |
| Train-the-Trainer Programs | Deliver TTT to client's internal teams |

**Example Earnings:**
- 50 students @ $100/student = $5,000
- Enterprise contract (20 sessions): $15,000 - $50,000
- Annual certified trainer earnings: $50,000 - $200,000+

## 4. RESOURCES PROVIDED

| Resource | Description |
|----------|-------------|
| Full Curriculum Materials | Slides, instructor guides, exercises |
| Student Workbooks | Participant materials and handouts |
| Learning Management System | LMS access for course delivery |
| Certification Portal | Issue and track certifications |
| Video Library | Supplemental training videos |
| Assessment Tools | Quizzes, exams, and evaluations |
| Co-Branded Materials | Your logo on training materials |
| Quarterly Updates | New content and curriculum refreshes |

## 5. TRAINING PROGRAMS AVAILABLE

| Program | Duration | Audience |
|---------|----------|----------|
| AlfredAI Fundamentals | 1 day | End users |
| Advanced User Training | 2 days | Power users |
| Admin Certification | 2 days | System administrators |
| Developer Workshop | 3 days | Technical teams |
| Executive Overview | Half day | Leadership |
| Industry-Specific | 1-2 days | Vertical training |

## 6. SUPPORT PROVIDED

| Support Type | Details |
|--------------|---------|
| Curriculum Updates | Quarterly content refreshes |
| Training Support | Help with difficult topics |
| LMS Administration | Platform management assistance |
| Marketing Materials | Promote your training services |
| Certification Support | Issue and verify certifications |
| Community Access | Trainer community and forums |

## 7. IDEAL PARTNER PROFILE

| Best Fit | Why |
|----------|-----|
| Corporate Training Companies | Enterprise training delivery |
| Technical Training Providers | IT and software training expertise |
| Learning Consultancies | Custom learning solutions |
| Adult Education Providers | Continuing education programs |
| Industry Associations | Member training programs |
| University Extensions | Professional development courses |

## 8. ONBOARDING PROCESS

| Step | Details |
|------|---------|
| Step 1 | Apply via Partners page (5 minutes) |
| Step 2 | Discovery call with Partner Manager (30 min) |
| Step 3 | Complete Train-the-Trainer program (16 hours) |
| Step 4 | Pass certification assessment (85%+) |
| Step 5 | Deliver practice session with feedback |
| Step 6 | Receive certified trainer status |
| Step 7 | Access LMS and begin delivery |

Timeline: Most trainers are certified within 3-4 weeks.

## 9. QUALITY ASSURANCE

| Requirement | Details |
|-------------|---------|
| Student Evaluations | Minimum 4.0/5.0 average rating |
| Certification Pass Rate | Track student success metrics |
| Annual Recertification | Stay current with product updates |
| Curriculum Adherence | Deliver approved content |
| Branding Guidelines | Follow co-branding requirements |

## 10. FREQUENTLY ASKED QUESTIONS

Q: Do I need prior training experience?
A: Preferred but not required. Strong presentation skills and product knowledge are essential.

Q: Can I customize the curriculum?
A: Within guidelines, yes. Major changes require approval.

Q: How do I get clients?
A: We provide leads and marketing support. You can also use your own network.

Q: What languages are supported?
A: Currently English. Other languages available with translation support.

Q: Can I train remotely?
A: Yes! Virtual instructor-led training is fully supported.

Q: How often does curriculum update?
A: Major updates quarterly; minor updates monthly.

## 11. ESCALATION TOPICS (Questions requiring a call)

For questions about:
- Enterprise training contracts
- Custom curriculum development
- Multi-language training
- Train-the-Trainer for clients
- Volume discount structures
- Exclusive territory arrangements
- White-label training programs

Suggest booking a call with the partnerships team.

## 12. HOW TO APPLY

| Topic | Information |
|-------|-------------|
| Application Location | "Apply Now" buttons on the Partners page |
| Where to Find | Scroll to the bottom of /company/partners or click "Become a Partner" |
| Application Process | Complete form with training experience and focus areas |
| Time to Complete | About 2-3 minutes |
| Response Time | Discovery call scheduled within 48 hours |
| Cost | Free to apply; Train-the-Trainer program included |
`;

interface KnowledgeBaseConfig {
  kb: string;
  name: string;
  safeTopics: string;
}

const getSystemPrompt = (partnerType: string) => {
  const knowledgeBases: Record<string, KnowledgeBaseConfig> = {
    referral: {
      kb: REFERRAL_PARTNER_KNOWLEDGE_BASE,
      name: 'Referral Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Commission rates" → Full details in Section 1
- "How to apply" → Full details in Section 13
- "Payment terms" → Full details in Section 1
- "Deal protection" → Full details in Section 2
- "Onboarding steps" → Full details in Section 3
- "Portal features" → Full details in Section 4
- "Partner support" → Full details in Section 9
- "Get started" → Covered in Sections 3, 7, 13
- "Success stories" → Full details in Section 11
- "How it works" → Full details in Section 8
- "Ideal partners" → Full details in Section 6`
    },
    implementation: {
      kb: IMPLEMENTATION_PARTNER_KNOWLEDGE_BASE,
      name: 'Implementation Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Certification process" → Full details in Section 3
- "How to apply" → Full details in Section 13
- "Revenue model" → Full details in Section 2
- "Technical training" → Full details in Section 4
- "Onboarding steps" → Full details in Section 7
- "Portal features" → Full details in Section 8
- "Partner support" → Full details in Section 5
- "Get started" → Covered in Sections 7, 13
- "How it works" → Full details in Section 10
- "Ideal partners" → Full details in Section 6`
    },
    sales: {
      kb: SALES_PARTNER_KNOWLEDGE_BASE,
      name: 'Sales Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Commission rates" → Full details in Section 1
- "Earnings examples" → Full details in Section 2
- "Territory options" → Full details in Section 3
- "Sales resources" → Full details in Section 4
- "Training levels" → Full details in Section 5
- "Onboarding steps" → Full details in Section 7
- "Partner support" → Full details in Section 8
- "Get started" → Covered in Section 12
- "How it works" → Full details in Section 9
- "Ideal partners" → Full details in Section 6`
    },
    technology: {
      kb: TECHNOLOGY_PARTNER_KNOWLEDGE_BASE,
      name: 'Technology Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Integration process" → Full details in Section 7
- "API access" → Full details in Section 2
- "Revenue model" → Full details in Section 3
- "Go-to-market" → Full details in Section 4
- "Requirements" → Full details in Section 5
- "Certification" → Full details in Section 6
- "Partner support" → Full details in Section 8
- "Get started" → Covered in Section 12
- "Ideal partners" → Full details in Section 9`
    },
    consulting: {
      kb: CONSULTING_PARTNER_KNOWLEDGE_BASE,
      name: 'Consulting Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Partnership model" → Full details in Section 2
- "Revenue model" → Full details in Section 3
- "Resources" → Full details in Section 4
- "Partner support" → Full details in Section 5
- "Onboarding steps" → Full details in Section 7
- "Certification" → Full details in Section 8
- "Get started" → Covered in Section 12
- "How it works" → Full details in Section 9
- "Ideal partners" → Full details in Section 6`
    },
    training: {
      kb: TRAINING_PARTNER_KNOWLEDGE_BASE,
      name: 'Training Partner',
      safeTopics: `SAFE quick reply topics (you HAVE answers for these):
- "Certification" → Full details in Section 2
- "Revenue share" → Full details in Section 3
- "Training materials" → Full details in Section 4
- "Programs available" → Full details in Section 5
- "Partner support" → Full details in Section 6
- "Onboarding steps" → Full details in Section 8
- "Get started" → Covered in Section 12
- "Ideal partners" → Full details in Section 7`
    },
  };

  const config = knowledgeBases[partnerType] || knowledgeBases.referral;

  return `You are a friendly and knowledgeable ${config.name} Program expert for AlfredAI. Your role is to answer questions about the ${config.name.toLowerCase()} program using the knowledge base provided.

IMPORTANT GUIDELINES:
1. Be warm, professional, and helpful
2. Answer questions accurately using ONLY the information from the knowledge base
3. Keep responses concise but complete (2-4 sentences for simple questions, more for complex ones)
4. USE MARKDOWN FORMATTING:
   - Use bullet points (•) for lists
   - Use **bold** for emphasis on key terms
   - Use tables for structured data when helpful
5. If asked about topics in the ESCALATION section (enterprise deals, legal, etc.), suggest booking a partnership call
6. If you don't know something, be honest and suggest booking a call to discuss specifics

CRITICAL - QUICK REPLY BUTTONS:
After EVERY response, you MUST include exactly 3 concise quick reply suggestions (2-4 words each) that the user can click as buttons.

**NEVER suggest a quick reply for a topic you cannot fully answer from the knowledge base.**

Format them EXACTLY like this:

**Quick replies:**
• [2-4 word button label]
• [2-4 word button label]
• [2-4 word button label]

${config.safeTopics}

NEVER suggest quick replies for:
- Specific external links/URLs
- Custom scenarios requiring human discussion
- Topics in the ESCALATION section (enterprise deals, legal, etc.)

When suggesting to book a call, say something like:
"That's a great question! For [topic], I'd recommend booking a quick call with our partnerships team - they can discuss your specific situation and tailor a solution. Would you like me to help you schedule that?"

KNOWLEDGE BASE:
${config.kb}

Remember: You're helping prospective partners understand the program and get excited about joining!`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, sessionId, message, messages, leadInfo, partnerType, deviceType } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Action: Create new session
    if (action === 'create_session') {
      console.log('[partner-chat] Creating new session for:', leadInfo?.email);
      
      const ipHash = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      
      const { data: session, error } = await supabase
        .from('partner_chat_sessions')
        .insert({
          partner_type: partnerType || 'referral',
          lead_email: leadInfo.email,
          lead_name: leadInfo.name,
          lead_company: leadInfo.company || null,
          device_type: deviceType || 'desktop',
          ip_hash: ipHash,
        })
        .select()
        .single();

      if (error) {
        console.error('[partner-chat] Session creation error:', error);
        throw new Error('Failed to create chat session');
      }

      console.log('[partner-chat] Session created:', session.id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        sessionId: session.id,
        sessionToken: session.session_token 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Send message and get AI response
    if (action === 'send_message') {
      if (!sessionId || !message) {
        throw new Error('Session ID and message are required');
      }

      console.log('[partner-chat] Processing message for session:', sessionId);

      // Fetch session to get partner type
      const { data: sessionData, error: sessionError } = await supabase
        .from('partner_chat_sessions')
        .select('partner_type')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('[partner-chat] Error fetching session:', sessionError);
      }

      const sessionPartnerType = sessionData?.partner_type || 'referral';

      // Save user message
      const { error: userMsgError } = await supabase
        .from('partner_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        });

      if (userMsgError) {
        console.error('[partner-chat] Error saving user message:', userMsgError);
      }

      // Update session last_message_at
      await supabase
        .from('partner_chat_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', sessionId);

      // Build conversation history for context
      const conversationHistory = messages?.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })) || [];

      // Add current message
      conversationHistory.push({ role: 'user', content: message });

      // Call Lovable AI Gateway
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableApiKey) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: getSystemPrompt(sessionPartnerType) },
            ...conversationHistory,
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('[partner-chat] AI Gateway error:', errorText);
        throw new Error('AI service unavailable');
      }

      const aiData = await aiResponse.json();
      const assistantMessage = aiData.choices?.[0]?.message?.content || 
        "I apologize, but I'm having trouble responding right now. Please try again or book a call with our partnerships team.";

      console.log('[partner-chat] AI response received, length:', assistantMessage.length);

      // Save assistant message
      const { error: assistantMsgError } = await supabase
        .from('partner_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantMessage,
        });

      if (assistantMsgError) {
        console.error('[partner-chat] Error saving assistant message:', assistantMsgError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: assistantMessage 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Get session history (for returning users)
    if (action === 'get_history') {
      if (!sessionId) {
        throw new Error('Session ID required');
      }

      const { data: messages, error } = await supabase
        .from('partner_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Failed to fetch history');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        messages: messages || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: unknown) {
    console.error('[partner-chat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
