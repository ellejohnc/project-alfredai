# GoHighLevel (GHL) Tagging Reference Guide

This document provides a comprehensive reference for all tags applied to contacts in GoHighLevel from the AlfredAI website. Tags are automatically generated and applied when leads are captured through various channels.

---

## Tag Categories Overview

| Category | Purpose | Example |
|----------|---------|---------|
| **Source Medium** | Identifies how the lead was captured | `Chatbot Lead`, `Header CTA` |
| **Campaign** | Identifies the specific campaign/form | `Demo Request`, `Contact Inquiry` |
| **Demo Access** | Tracks demo interactions | `Demo Lead`, `Demo: Decision Support` |
| **Page Attribution** | Tracks which page generated the lead | `page:homepage`, `page:resources-demos-voice-agent` |
| **Qualification** | Captures lead qualification data | `Role: CEO`, `Industry: Healthcare` |
| **Source Identifier** | High-level source category | `Source: Form`, `Source: Demo Share` |

---

## Source Medium Tags

Applied based on `source_medium` value:

| Source Medium | Tags Applied | Description |
|---------------|--------------|-------------|
| `header_cta` | `Header CTA`, `Impact Conversation Booking` | Lead clicked the main CTA button in the navigation header |
| `signup_page` | `Get Started Page`, `Interactive Qualification` | Lead completed the /signup qualification flow |
| `page_cta` | `Page CTA`, `Page: {pageName}` | Lead clicked a CTA button on a specific page |
| `lead_chatbot` / `chatbot` | `Chatbot Lead`, `Chatbot - {pageName}` | Lead captured via the AI chatbot widget |
| `booking_modal` | `Impact Conversation Booking` | Lead captured via the booking modal |
| `personalization_flow` | `Hero CTA`, `Interactive Qualification` | Lead completed the hero personalization flow |
| `lead_form` / `form` | `Contact Form Lead` | Lead submitted a standard contact form |
| `demo_share_link` | `Demo Lead`, `Demo Share Access` | Lead accessed a demo via a shared link |

---

## Campaign Tags

Applied based on `source_campaign` value:

| Source Campaign | Tag Applied | Description |
|-----------------|-------------|-------------|
| `demo_request` | `Demo Request` | Lead requested a demo |
| `contact_inquiry` / `contact_form` | `Contact Inquiry` | General contact form submission |
| `support_request` | `Support Request` | Support-related inquiry |
| `newsletter` | `Newsletter Subscriber` | Newsletter signup |
| `partnership_inquiry` | `Partnership Inquiry` | Partnership inquiry from /partners page |
| `signup_qualification` | `Get Started Qualification` | Completed the Get Started qualification flow |
| `personalized_results` | `Personalized Results` | Viewed personalized results page |
| `demo_{demo-id}` | `Demo Access`, `Demo: {Demo Name}` | Accessed a specific demo (name is auto-formatted) |

### Demo Campaign Tag Examples

| Campaign Value | Tags Generated |
|----------------|----------------|
| `demo_decision-support` | `Demo Access`, `Demo: Decision Support` |
| `demo_voice-agent` | `Demo Access`, `Demo: Voice Agent` |
| `demo_workflow-automation` | `Demo Access`, `Demo: Workflow Automation` |

---

## Page Attribution Tags

Format: `page:{path}` where path is derived from the source URL.

| Page | Tag |
|------|-----|
| Homepage (`/`) | `page:homepage` |
| `/signup` | `page:signup` |
| `/resources/demos/voice-agent` | `page:resources-demos-voice-agent` |
| `/partners` | `page:partners` |
| `/contact` | `page:contact` |

---

## Qualification Tags

Applied when qualification data is captured (from interactive flows):

| Field | Tag Format | Examples |
|-------|------------|----------|
| Role | `Role: {value}` | `Role: CEO`, `Role: Operations Manager` |
| Industry | `Industry: {value}` | `Industry: Healthcare`, `Industry: Real Estate` |
| Team Size | `Team Size: {value}` | `Team Size: 10-50`, `Team Size: 50-200` |
| Timeline | `Timeline: {value}` | `Timeline: ASAP`, `Timeline: 3-6 months` |
| Challenge | `Challenge: {value}` | `Challenge: Manual processes`, `Challenge: Scaling operations` |

---

## Source Identifier Tags

Applied to identify the high-level source category:

| Lead Source | Tag Applied |
|-------------|-------------|
| `form` | `Source: Form` |
| `chatbot` | `Source: Chatbot` |
| `demo_share` | `Source: Demo Share` |
| `personalization_flow` | `Source: Personalization Flow` |
| `calendar_widget` | `Source: Calendar Widget` |
| `unknown` | `Source: Unknown` |

---

## Universal Tags

Applied to all contacts:

| Tag | Description |
|-----|-------------|
| `AlfredAI Website` | Indicates the contact was captured from the AlfredAI website |

---

## Complete Tag Examples

### Example 1: Demo Share Lead
A lead accesses the Decision Support demo via a shared link:

```
Tags Applied:
- Demo Lead
- Demo Share Access
- Demo Access
- Demo: Decision Support
- page:resources-demos-decision-support
- Source: Demo Share
- AlfredAI Website
```

### Example 2: Header CTA Booking
A lead clicks "Book Impact Conversation" in the header:

```
Tags Applied:
- Header CTA
- Impact Conversation Booking
- page:{current-page}
- Source: Form
- AlfredAI Website
```

### Example 3: Chatbot Lead on Homepage
A lead engages with the chatbot on the homepage:

```
Tags Applied:
- Chatbot Lead
- Chatbot - Homepage
- page:homepage
- Source: Chatbot
- AlfredAI Website
```

### Example 4: Get Started Qualification
A lead completes the /signup qualification flow:

```
Tags Applied:
- Get Started Page
- Interactive Qualification
- Get Started Qualification
- Role: {selected role}
- Industry: {selected industry}
- Team Size: {selected size}
- Timeline: {selected timeline}
- Challenge: {selected challenge}
- page:signup
- Source: Form
- AlfredAI Website
```

### Example 5: Partnership Inquiry
A lead submits the partnership form on /partners:

```
Tags Applied:
- Contact Form Lead
- Partnership Inquiry
- page:partners
- Source: Form
- AlfredAI Website
```

---

## Custom Fields

In addition to tags, qualification data is also stored in GHL custom fields:

| Custom Field Key | Description |
|------------------|-------------|
| `industry` | Selected industry |
| `team_size` | Selected team size |
| `timeline` | Selected timeline |
| `role` | Selected role |
| `primary_challenge` | Selected primary challenge |

---

## Notes

Qualification data is also stored as a structured note on the contact:

```
[AlfredAI Qualification]
Role: {role}
Industry: {industry}
Challenge: {challenge}
Team Size: {size}
Timeline: {timeline}
```

---

## Lead Source Internal Mapping

The `lead_source` field in the database maps to these categories:

| `source_medium` Value | `lead_source` Value |
|-----------------------|---------------------|
| `lead_chatbot` | `chatbot` |
| `personalization_flow` | `personalization_flow` |
| `demo_share_link` | `demo_share` |
| `contact_form` | `form` |
| Other | `unknown` |

---

## Database Fields Reference

### `ghl_submissions` Table

| Field | Description |
|-------|-------------|
| `lead_source` | High-level source category (chatbot, form, demo_share, etc.) |
| `source_medium` | Specific capture method (header_cta, demo_share_link, etc.) |
| `source_campaign` | Campaign identifier (demo_request, demo_{id}, etc.) |
| `source_page` | URL path where the lead was captured |

---

## Filtering in GHL

To find specific lead types in GHL, use these tag combinations:

| Lead Type | Filter Tags |
|-----------|-------------|
| All Demo Leads | `Demo Lead` OR `Demo Access` |
| Specific Demo | `Demo: {Demo Name}` |
| Chatbot Leads | `Chatbot Lead` |
| Qualified Leads | `Interactive Qualification` |
| Partnership Inquiries | `Partnership Inquiry` |
| Newsletter Signups | `Newsletter Subscriber` |
| Homepage Leads | `page:homepage` |

---

*Last Updated: January 2026*
