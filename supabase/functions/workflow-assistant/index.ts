import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

const SYSTEM_PROMPT = `You are an expert AI Workflow Assistant that helps employees create automation workflows without any coding.

Your role is to:
1. Understand what process the user wants to automate
2. Guide them step-by-step to build the workflow
3. Recommend triggers, actions, and conditions based on best practices
4. Ask clarifying questions when needed
5. Suggest improvements and optimizations

When responding, always:
- Be encouraging and supportive - the user doesn't need technical knowledge
- Provide 2-4 specific suggestions for the next step
- Explain briefly why each suggestion would be helpful
- Keep responses concise but informative

IMPORTANT: Once the workflow has at least one trigger and one action (or after 2+ steps have been added), ALWAYS include one suggestion to complete/finalize the workflow. Use phrases like:
- "Activate this workflow"
- "Finalize and deploy workflow"  
- "Complete workflow setup"
- "Save and activate workflow"
This gives users a clear path to conclude the workflow building process.

Available workflow components you can suggest:
TRIGGERS: HR System events, Email received, Form submitted, Schedule/Time-based, Webhook, Database change, File uploaded
ACTIONS: Send email, Create Slack message, Update database, Generate document, Send notification, Create calendar event, Call API, Assign task
CONDITIONS: Check field value, Compare dates, Role/department check, Approval required, Budget threshold

When suggesting a workflow node, include these details in your response:
- Node type (trigger, action, or condition)
- Specific component name
- Brief description of what it does

Format your suggestions as a numbered list that the user can click to proceed.

Remember: You're empowering non-technical employees to automate their work. Make it feel magical and easy!`;

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
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory?.length || 0);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('No response content from AI');
      throw new Error('No response from AI');
    }

    console.log('AI response received, length:', aiResponse.length);

    // Parse suggestions from the response
    let suggestions = extractSuggestions(aiResponse);
    
    // Ensure completion suggestion exists when conversation has progressed
    suggestions = ensureCompletionSuggestion(suggestions, conversationHistory);
    
    // Detect if a workflow node should be added based on context
    const nodeToAdd = detectNodeToAdd(message, aiResponse);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      suggestions,
      nodeToAdd
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error in workflow-assistant function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractSuggestions(text: string): string[] {
  const suggestions: string[] = [];
  
  // Look for numbered lists (1. 2. 3. etc)
  const numberedPattern = /\d+\.\s*\*?\*?([^*\n]+)\*?\*?/g;
  let match;
  while ((match = numberedPattern.exec(text)) !== null) {
    const suggestion = match[1].trim().replace(/^\*\*|\*\*$/g, '').trim();
    if (suggestion.length > 5 && suggestion.length < 100) {
      suggestions.push(suggestion);
    }
  }
  
  // If no numbered items, look for bullet points
  if (suggestions.length === 0) {
    const bulletPattern = /[-•]\s*\*?\*?([^*\n]+)\*?\*?/g;
    while ((match = bulletPattern.exec(text)) !== null) {
      const suggestion = match[1].trim().replace(/^\*\*|\*\*$/g, '').trim();
      if (suggestion.length > 5 && suggestion.length < 100) {
        suggestions.push(suggestion);
      }
    }
  }
  
  return suggestions.slice(0, 4); // Max 4 suggestions
}

// Ensure at least one completion option is available when workflow is being built
function ensureCompletionSuggestion(suggestions: string[], conversationHistory: any[]): string[] {
  const completionKeywords = ['activate', 'deploy', 'complete', 'finalize', 'finish', 'done', 'ready', 'save and'];
  const hasCompletion = suggestions.some(s => 
    completionKeywords.some(kw => s.toLowerCase().includes(kw))
  );
  
  // If conversation has progressed (2+ messages) and no completion option, add one
  if (!hasCompletion && conversationHistory && conversationHistory.length >= 2) {
    // Keep max 3 suggestions and add completion option
    return [...suggestions.slice(0, 3), "Activate this workflow"];
  }
  
  return suggestions;
}

function detectNodeToAdd(userMessage: string, aiResponse: string): any | null {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();
  
  // Detect triggers
  if (lowerMessage.includes('when') || lowerMessage.includes('trigger')) {
    if (lowerMessage.includes('employee') || lowerMessage.includes('hr') || lowerMessage.includes('hire')) {
      return { type: 'trigger', icon: 'Users', title: 'New Employee Added', subtitle: 'HR System Trigger', color: 'hsl(var(--primary))' };
    }
    if (lowerMessage.includes('email') || lowerMessage.includes('receive')) {
      return { type: 'trigger', icon: 'Mail', title: 'Email Received', subtitle: 'Email Trigger', color: 'hsl(var(--primary))' };
    }
    if (lowerMessage.includes('form') || lowerMessage.includes('submit')) {
      return { type: 'trigger', icon: 'FileText', title: 'Form Submitted', subtitle: 'Form Trigger', color: 'hsl(var(--primary))' };
    }
    if (lowerMessage.includes('schedule') || lowerMessage.includes('time') || lowerMessage.includes('daily') || lowerMessage.includes('weekly')) {
      return { type: 'trigger', icon: 'Clock', title: 'Scheduled Time', subtitle: 'Time-based Trigger', color: 'hsl(var(--primary))' };
    }
  }
  
  // Detect actions
  if (lowerMessage.includes('send') && lowerMessage.includes('email')) {
    return { type: 'action', icon: 'Mail', title: 'Send Email', subtitle: 'Email notification', color: 'hsl(262, 83%, 58%)' };
  }
  if (lowerMessage.includes('slack') || lowerMessage.includes('channel') || lowerMessage.includes('message')) {
    return { type: 'action', icon: 'MessageSquare', title: 'Send Slack Message', subtitle: 'Team notification', color: 'hsl(142, 76%, 36%)' };
  }
  if (lowerMessage.includes('notification') || lowerMessage.includes('notify') || lowerMessage.includes('alert')) {
    return { type: 'action', icon: 'Bell', title: 'Send Notification', subtitle: 'Push notification', color: 'hsl(199, 89%, 48%)' };
  }
  if (lowerMessage.includes('document') || lowerMessage.includes('generate') || lowerMessage.includes('create doc')) {
    return { type: 'action', icon: 'FileText', title: 'Generate Document', subtitle: 'Auto-create document', color: 'hsl(47, 100%, 50%)' };
  }
  if (lowerMessage.includes('calendar') || lowerMessage.includes('meeting') || lowerMessage.includes('schedule')) {
    return { type: 'action', icon: 'Clock', title: 'Create Calendar Event', subtitle: 'Schedule meeting', color: 'hsl(0, 84%, 60%)' };
  }
  if (lowerMessage.includes('assign') || lowerMessage.includes('task')) {
    return { type: 'action', icon: 'Users', title: 'Assign Task', subtitle: 'Create & assign task', color: 'hsl(262, 83%, 58%)' };
  }
  if (lowerMessage.includes('database') || lowerMessage.includes('save') || lowerMessage.includes('store') || lowerMessage.includes('update')) {
    return { type: 'action', icon: 'Database', title: 'Update Database', subtitle: 'Save data', color: 'hsl(199, 89%, 48%)' };
  }
  
  // Detect conditions
  if (lowerMessage.includes('if') || lowerMessage.includes('check') || lowerMessage.includes('condition') || lowerMessage.includes('depends')) {
    if (lowerMessage.includes('role') || lowerMessage.includes('department') || lowerMessage.includes('type')) {
      return { type: 'condition', icon: 'GitBranch', title: 'Check Role/Department', subtitle: 'Conditional branch', color: 'hsl(47, 100%, 50%)' };
    }
    if (lowerMessage.includes('approve') || lowerMessage.includes('approval')) {
      return { type: 'condition', icon: 'GitBranch', title: 'Approval Required', subtitle: 'Wait for approval', color: 'hsl(47, 100%, 50%)' };
    }
    return { type: 'condition', icon: 'GitBranch', title: 'Check Condition', subtitle: 'Conditional logic', color: 'hsl(47, 100%, 50%)' };
  }
  
  // Check AI response for node suggestions
  if (lowerResponse.includes("i've added") || lowerResponse.includes("i'll add") || lowerResponse.includes("adding")) {
    if (lowerResponse.includes('trigger')) {
      return { type: 'trigger', icon: 'Zap', title: 'Workflow Trigger', subtitle: 'Start point', color: 'hsl(var(--primary))' };
    }
  }
  
  return null;
}
