import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 30, windowMs: 60 * 60 * 1000 }; // 30 requests per hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Comprehensive mock company knowledge base for AI context
const companyKnowledgeBase = `
# ACME Corporation Knowledge Base
## Company Overview
ACME Corporation is a B2B SaaS company founded in 2018, headquartered in Singapore with offices in Sydney, Tokyo, London, and San Francisco. We provide enterprise workflow automation and AI-powered business intelligence solutions. Current ARR: $48M, 850+ enterprise customers, 420 employees globally.

## Financial Information (Q3 2024)
- **Total Revenue**: $14.2M (23% YoY growth)
- **APAC Revenue**: $5.8M (31% YoY growth, exceeding target by 15%)
- **EMEA Revenue**: $4.1M (18% YoY growth)
- **Americas Revenue**: $4.3M (19% YoY growth)
- **MRR**: $4.2M
- **Gross Margin**: 78%
- **Net Revenue Retention**: 118%
- **Customer Churn**: 2.1% (down from 3.4% in Q2)
- **ARR by segment**: Enterprise (65%), Mid-market (28%), SMB (7%)

## Q4 2024 Targets
- Revenue target: $16.5M
- New logo target: 85 accounts
- Expansion revenue: 25% of new bookings
- APAC focus: Singapore, Australia, Japan
- Product launches: AI Copilot v2, Advanced Analytics Dashboard

## Products & Pricing
### Core Platform Tiers
1. **Starter** ($299/month): Up to 10 users, 5 workflows, basic integrations
2. **Professional** ($799/month): Up to 50 users, unlimited workflows, advanced integrations, API access
3. **Enterprise** ($2,499/month): Unlimited users, custom integrations, dedicated support, SLA, SSO/SAML
4. **Enterprise Plus** (Custom pricing): All Enterprise features + on-premise deployment, custom AI models

### Add-ons
- AI Copilot: +$99/user/month
- Advanced Analytics: +$199/month
- Premium Support: +$499/month
- Custom Integrations: Starting $5,000

## HR Policies & Information
### Employee Benefits
- Health insurance (medical, dental, vision) - 100% covered for employees, 75% for dependents
- 401(k) matching up to 4%
- Unlimited PTO policy (minimum 15 days required annually)
- Remote work flexibility (hybrid or fully remote options)
- Learning & Development budget: $2,000/year per employee
- Home office stipend: $500 one-time for new remote employees
- Wellness allowance: $100/month

### Leave Policies
- Parental leave: 16 weeks paid (birth parent), 8 weeks (non-birth parent)
- Sick leave: Unlimited with doctor's note after 3 consecutive days
- Bereavement leave: 5 days for immediate family
- Jury duty: Fully paid

### Performance Reviews
- Annual reviews in December with 360 feedback
- Mid-year check-ins in June
- Quarterly OKR reviews
- Promotion cycles: Q1 and Q3

## Onboarding Process (New Employees)
**Week 1**:
- Day 1: IT setup, security training, company overview
- Day 2-3: Department introduction, manager 1:1
- Day 4-5: Product training, shadow sessions

**Week 2-4**:
- Buddy program pairing
- Role-specific training modules
- First project assignment
- 30-day check-in with HR

**Day 90**: Performance checkpoint and probation review

## Compliance & Security
### Certifications
- SOC 2 Type II (renewed annually, last audit: August 2024)
- ISO 27001 certified
- GDPR compliant
- HIPAA (Certifiable) compliant (for healthcare customers)
- PCI DSS Level 1 (for payment processing)

### Security Policies
- Multi-factor authentication required for all employees
- Password rotation: Every 90 days
- VPN required for remote access to internal systems
- Security awareness training: Quarterly
- Penetration testing: Bi-annually
- Data encryption: AES-256 at rest, TLS 1.3 in transit

## Sales Information
### Sales Targets Q4 2024
- New business: $8.5M
- Expansion: $4.2M
- Total pipeline: $42M (5x coverage)
- Average deal size: $85K ACV
- Sales cycle: 45-60 days (mid-market), 90-120 days (enterprise)

### Competitive Positioning
**vs. Competitor A (Workflow Pro)**: We have stronger AI capabilities, better enterprise integrations, 40% faster implementation
**vs. Competitor B (AutoFlow)**: We offer better value at enterprise tier, superior customer support (NPS 72 vs their 58)
**vs. Competitor C (ProcessMate)**: We have modern UI/UX, real-time collaboration, native mobile apps

### Sales Playbook Highlights
- Discovery call framework: MEDDIC methodology
- Demo best practices: Focus on 3 key pain points, limit to 45 minutes
- Objection handling: Common objections document in SharePoint
- Closing techniques: Create urgency with quarterly promotions

## Customer Success
### Key Metrics
- NPS: 72 (industry average: 45)
- CSAT: 4.6/5
- First response time: <2 hours (target: <4 hours)
- Resolution time: <24 hours for P1, <72 hours for P2
- Onboarding completion rate: 94%
- Time to value: 14 days average

### Health Score Methodology
- Product usage (30%): Daily active users, feature adoption
- Engagement (25%): Support tickets, community participation
- Growth (20%): Expansion potential, license utilization
- Relationship (15%): Executive sponsor engagement, QBR attendance
- Sentiment (10%): NPS, feedback scores

### Escalation Procedures
- P1 (Critical): Immediate page to on-call engineer, 1-hour response SLA
- P2 (High): 4-hour response, escalate to team lead if unresolved in 24 hours
- P3 (Medium): 24-hour response, resolved within 5 business days
- P4 (Low): 48-hour response, best effort resolution

## Product Roadmap 2024-2025
### Q4 2024
- AI Copilot v2 with natural language workflow creation
- Advanced analytics dashboard with predictive insights
- Microsoft Teams native integration
- Mobile app 2.0 with offline support

### Q1 2025
- Multi-language support (Spanish, French, German, Japanese)
- Custom AI model training for enterprise customers
- Enhanced audit logging and compliance reporting
- API v3 with GraphQL support

### Q2 2025
- Industry-specific templates (Healthcare, Financial Services, Manufacturing)
- Real-time collaboration features
- Advanced data visualization toolkit
- On-premise deployment option for Enterprise Plus

## Engineering Guidelines
### Tech Stack
- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Node.js, PostgreSQL, Redis
- Infrastructure: AWS (primary), GCP (disaster recovery)
- CI/CD: GitHub Actions, ArgoCD
- Monitoring: Datadog, PagerDuty

### Development Practices
- Code review required for all PRs (minimum 2 approvals)
- Feature flags for all new features
- 80% test coverage requirement
- Documentation updates required with code changes
- Security review for any authentication/authorization changes

## Office Locations & Contact
### Singapore (HQ)
Address: 10 Collyer Quay, #40-01, Ocean Financial Centre, Singapore 049315
Phone: +65 6123 4567

### Sydney
Address: 100 Miller Street, Level 25, North Sydney NSW 2060
Phone: +61 2 8123 4567

### Tokyo
Address: 〒100-0005 Tokyo, Chiyoda City, Marunouchi, 1-8-3
Phone: +81 3-1234-5678

### London
Address: 30 St Mary Axe, London EC3A 8BF, United Kingdom
Phone: +44 20 7123 4567

### San Francisco
Address: 535 Mission Street, 14th Floor, San Francisco, CA 94105
Phone: +1 415-123-4567

## Recent Announcements
- October 2024: Closed Series C funding round of $75M led by Sequoia
- September 2024: Won "Best Workflow Automation Platform" at SaaS Awards 2024
- August 2024: Launched strategic partnership with Salesforce
- July 2024: Opened Tokyo office to support APAC expansion
- June 2024: Released AI Copilot beta to 200+ enterprise customers

## Frequently Asked Questions
**Q: What is our refund policy?**
A: 30-day money-back guarantee for monthly plans, pro-rated refunds for annual plans within first 60 days.

**Q: How do I request time off?**
A: Submit PTO requests through Workday at least 2 weeks in advance for planned leave. Manager approval required.

**Q: What's our work from home policy?**
A: Employees can work remotely up to 3 days per week. Fully remote arrangements require VP approval.

**Q: How do I submit expense reports?**
A: Use Expensify for all expense reports. Submit within 30 days of expense. Manager approval required for expenses over $500.

**Q: What's our discount approval process?**
A: Up to 10% - Sales rep discretion. 10-20% - Manager approval. 20-30% - VP approval. Above 30% - CRO approval.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    console.log(`Rate limit exceeded for IP: ${ip.substring(0, 8)}...`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { query, department } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI knowledge assistant for ACME Corporation. Your role is to help employees find information quickly and accurately from the company's knowledge base.

IMPORTANT GUIDELINES:
1. Answer questions directly and concisely based on the knowledge base provided
2. Use markdown formatting for readability (bold for key figures, bullet points for lists)
3. Always cite which documents/sections your information comes from
4. If asked about something not in the knowledge base, say you couldn't find that information
5. For financial figures, always include the specific numbers and percentages
6. Be helpful and professional, like a knowledgeable colleague

${department && department !== 'All' ? `Focus on information relevant to the ${department} department when applicable.` : ''}

COMPANY KNOWLEDGE BASE:
${companyKnowledgeBase}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please contact administrator.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error('No response from AI');
    }

    // Generate contextual insights based on the query
    const insights = generateInsights(query);
    
    // Generate related documents based on query keywords
    const relatedDocs = generateRelatedDocs(query, department);

    return new Response(
      JSON.stringify({ 
        answer,
        insights,
        relatedDocs,
        sources: extractSources(answer)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Knowledge search error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateInsights(query: string): string[] {
  const q = query.toLowerCase();
  const insights: string[] = [];
  
  if (q.includes('revenue') || q.includes('financial') || q.includes('q3') || q.includes('q4')) {
    insights.push('APAC region is outperforming other regions by 8%');
    insights.push('Net revenue retention at 118% indicates strong expansion');
    insights.push('Q4 targets are 16% higher than Q3 actuals');
  }
  if (q.includes('hr') || q.includes('onboarding') || q.includes('employee') || q.includes('benefits')) {
    insights.push('New employee satisfaction score: 4.8/5');
    insights.push('30-day check-in completion rate: 96%');
    insights.push('Average time-to-productivity: 21 days');
  }
  if (q.includes('sales') || q.includes('pipeline') || q.includes('deal')) {
    insights.push('Current pipeline coverage: 5x target');
    insights.push('Enterprise deals closing 12% faster this quarter');
    insights.push('MEDDIC adoption improved win rates by 18%');
  }
  if (q.includes('product') || q.includes('roadmap') || q.includes('feature')) {
    insights.push('AI Copilot beta has 92% positive feedback');
    insights.push('Most requested feature: Multi-language support');
    insights.push('Mobile app 2.0 launch on track for Q4');
  }
  if (q.includes('compliance') || q.includes('security') || q.includes('soc') || q.includes('iso')) {
    insights.push('Last SOC 2 audit: Zero critical findings');
    insights.push('Security training completion: 98%');
    insights.push('No data breaches in company history');
  }
  if (q.includes('customer') || q.includes('support') || q.includes('success')) {
    insights.push('NPS improved 8 points since Q1');
    insights.push('P1 ticket resolution improved by 23%');
    insights.push('Top customer request: Better reporting');
  }
  
  // Default insights if none matched
  if (insights.length === 0) {
    insights.push('18K+ documents indexed across 5 sources');
    insights.push('Knowledge base last updated: 2 hours ago');
    insights.push('Try narrowing your search with department filters');
  }
  
  return insights.slice(0, 3);
}

function generateRelatedDocs(query: string, department?: string): any[] {
  const q = query.toLowerCase();
  const allDocs = [
    { title: 'Q3 2024 Revenue Report - APAC Region', source: 'SharePoint', type: 'Excel', department: 'Finance', author: 'Sarah Chen', date: '2 days ago', relevance: 98, accessLevel: 'team', tags: ['Q3', 'Revenue', 'APAC'] },
    { title: 'Q4 2024 Financial Targets & Forecast', source: 'SharePoint', type: 'Excel', department: 'Finance', author: 'James Liu', date: '1 week ago', relevance: 95, accessLevel: 'restricted', tags: ['Q4', 'Forecast', 'Targets'] },
    { title: 'APAC Sales Strategy & Expansion Plan', source: 'Google Drive', type: 'PDF', department: 'Sales', author: 'Michael Wong', date: '1 week ago', relevance: 94, accessLevel: 'team', tags: ['Strategy', 'APAC', 'Sales'] },
    { title: 'Enterprise Sales Playbook v4.1', source: 'Confluence', type: 'Doc', department: 'Sales', author: 'Jessica Park', date: '3 weeks ago', relevance: 91, accessLevel: 'public', tags: ['Playbook', 'Enterprise', 'Sales'] },
    { title: 'Employee Onboarding Guide 2024', source: 'Notion', type: 'Doc', department: 'HR', author: 'Emily Zhang', date: '1 month ago', relevance: 96, accessLevel: 'public', tags: ['Onboarding', 'HR', 'New Hire'] },
    { title: 'Benefits & Compensation Overview', source: 'SharePoint', type: 'PDF', department: 'HR', author: 'HR Team', date: '2 weeks ago', relevance: 93, accessLevel: 'public', tags: ['Benefits', 'Compensation', 'HR'] },
    { title: 'Product Roadmap Q4 2024 - Q2 2025', source: 'Notion', type: 'Doc', department: 'Product', author: 'David Kim', date: '5 days ago', relevance: 97, accessLevel: 'team', tags: ['Roadmap', 'Product', 'Features'] },
    { title: 'AI Copilot Technical Specification', source: 'Confluence', type: 'Doc', department: 'Engineering', author: 'Tech Team', date: '1 week ago', relevance: 88, accessLevel: 'team', tags: ['AI', 'Technical', 'Spec'] },
    { title: 'Customer Success Playbook v3.2', source: 'Confluence', type: 'Doc', department: 'CS', author: 'Lisa Park', date: '3 weeks ago', relevance: 87, accessLevel: 'public', tags: ['Playbook', 'CS', 'Retention'] },
    { title: 'SOC 2 Compliance Documentation', source: 'SharePoint', type: 'PDF', department: 'Legal', author: 'Compliance Team', date: '2 months ago', relevance: 92, accessLevel: 'restricted', tags: ['SOC 2', 'Compliance', 'Security'] },
    { title: 'ISO 27001 Audit Report 2024', source: 'SharePoint', type: 'PDF', department: 'Legal', author: 'Security Team', date: '1 month ago', relevance: 90, accessLevel: 'restricted', tags: ['ISO', 'Audit', 'Security'] },
    { title: 'Board Presentation - Q3 Review', source: 'SharePoint', type: 'PPT', department: 'Executive', author: 'David Liu', date: '5 days ago', relevance: 82, accessLevel: 'restricted', tags: ['Board', 'Q3', 'Executive'] },
  ];

  // Score and filter documents based on query keywords
  const scoredDocs = allDocs.map(doc => {
    let score = doc.relevance;
    const docText = `${doc.title} ${doc.tags.join(' ')} ${doc.department}`.toLowerCase();
    
    const queryWords = q.split(' ').filter(w => w.length > 2);
    queryWords.forEach(word => {
      if (docText.includes(word)) score += 5;
    });
    
    if (department && department !== 'All' && doc.department.toLowerCase() === department.toLowerCase()) {
      score += 10;
    }
    
    return { ...doc, relevance: Math.min(score, 99) };
  });

  // Sort by relevance and return top 4
  return scoredDocs
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4);
}

function extractSources(answer: string): string[] {
  const sources: string[] = [];
  
  if (answer.includes('Revenue Report') || answer.includes('Q3')) sources.push('Q3 2024 Revenue Report');
  if (answer.includes('Sales Strategy') || answer.includes('APAC')) sources.push('APAC Sales Strategy');
  if (answer.includes('Playbook')) sources.push('Enterprise Playbook');
  if (answer.includes('Board') || answer.includes('Presentation')) sources.push('Board Presentation');
  if (answer.includes('Onboarding') || answer.includes('HR')) sources.push('Employee Handbook');
  if (answer.includes('SOC 2') || answer.includes('Compliance')) sources.push('Compliance Documentation');
  if (answer.includes('Roadmap') || answer.includes('Product')) sources.push('Product Roadmap');
  
  return sources.length > 0 ? sources : ['Company Knowledge Base'];
}
