import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillSummary {
  id: string;
  supplier_name: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
  has_early_pay_discount: boolean;
  discount_percentage?: number;
  risk_level: string;
  days_until_due: number;
}

interface ScheduleRequest {
  bills: BillSummary[];
  available_funds: number;
  optimize_for: 'cash_flow' | 'discounts' | 'relationships';
}

// Structured response interfaces
interface PaymentScheduleItem {
  invoice_id: string;
  supplier_name: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  payment_week: number;
  payment_date: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  discount_captured: boolean;
  savings: number;
}

interface WeeklySummary {
  week: number;
  start_date: string;
  end_date: string;
  total_payments: number;
  invoice_count: number;
  cash_remaining: number;
}

interface PaymentAlert {
  type: 'overdue' | 'risk' | 'discount_expiring';
  message: string;
  invoice_ids: string[];
}

interface AIScheduleResponse {
  items: PaymentScheduleItem[];
  weekly_summaries: WeeklySummary[];
  alerts: PaymentAlert[];
  total_savings: number;
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bills, available_funds, optimize_for } = await req.json() as ScheduleRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build detailed invoice data for AI
    const billsData = bills.map(b => ({
      id: b.id,
      supplier: b.supplier_name,
      invoice: b.invoice_number,
      amount: b.total_amount,
      due_date: b.due_date,
      days_until_due: b.days_until_due,
      has_discount: b.has_early_pay_discount,
      discount_pct: b.discount_percentage || 2,
      risk: b.risk_level,
    }));

    const today = new Date();
    const week1Start = new Date(today);
    week1Start.setDate(today.getDate() + (1 - today.getDay())); // Next Monday
    
    const getWeekDates = (weekNum: number) => {
      const start = new Date(week1Start);
      start.setDate(start.getDate() + (weekNum - 1) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    };

    const systemPrompt = `You are an AI accounts payable assistant. You MUST respond with ONLY a valid JSON object - no markdown, no explanation, no code blocks.

Your task is to create an optimal payment schedule for the provided invoices.

CRITICAL: Your response must be a raw JSON object matching this exact structure:
{
  "items": [
    {
      "invoice_id": "string",
      "supplier_name": "string", 
      "invoice_number": "string",
      "amount": number,
      "due_date": "YYYY-MM-DD",
      "payment_week": 1-4,
      "payment_date": "YYYY-MM-DD",
      "priority": "critical" | "high" | "medium" | "low",
      "reason": "string explaining why scheduled this way",
      "discount_captured": boolean,
      "savings": number
    }
  ],
  "weekly_summaries": [
    {
      "week": 1-4,
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD", 
      "total_payments": number,
      "invoice_count": number,
      "cash_remaining": number
    }
  ],
  "alerts": [
    {
      "type": "overdue" | "risk" | "discount_expiring",
      "message": "string",
      "invoice_ids": ["string"]
    }
  ],
  "total_savings": number,
  "recommendations": ["string"]
}

Priority rules:
- "critical": Overdue or due within 3 days
- "high": Due within 7 days OR has early pay discount expiring soon
- "medium": Due within 14 days
- "low": Due beyond 14 days

When optimizing for "${optimize_for}":
${optimize_for === 'cash_flow' ? '- Delay payments as long as possible without penalties\n- Spread payments evenly across weeks\n- Preserve cash reserves' : ''}
${optimize_for === 'discounts' ? '- Prioritize invoices with early pay discounts\n- Capture all available discounts\n- Calculate savings from each discount' : ''}
${optimize_for === 'relationships' ? '- Pay strategic suppliers first\n- Never delay payments to key vendors\n- Maintain consistent payment patterns' : ''}`;

    const userPrompt = `Create a 4-week payment schedule for these invoices:

Available Funds: $${available_funds}
Today's Date: ${today.toISOString().split('T')[0]}

Week Dates:
- Week 1: ${getWeekDates(1).start} to ${getWeekDates(1).end}
- Week 2: ${getWeekDates(2).start} to ${getWeekDates(2).end}
- Week 3: ${getWeekDates(3).start} to ${getWeekDates(3).end}
- Week 4: ${getWeekDates(4).start} to ${getWeekDates(4).end}

Invoices to schedule:
${JSON.stringify(billsData, null, 2)}

Return ONLY the JSON object. No markdown formatting, no explanations.`;

    console.log("Calling Lovable AI for structured payment schedule...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate payment schedule" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";
    
    console.log("AI raw response:", aiContent.substring(0, 500));

    // Parse the JSON response
    let scheduleData: AIScheduleResponse;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedContent = aiContent.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();
      
      scheduleData = JSON.parse(cleanedContent);
      
      // Validate required fields
      if (!scheduleData.items || !Array.isArray(scheduleData.items)) {
        throw new Error("Invalid response: missing items array");
      }
      if (!scheduleData.weekly_summaries || !Array.isArray(scheduleData.weekly_summaries)) {
        throw new Error("Invalid response: missing weekly_summaries array");
      }
      
      // CRITICAL: Recalculate weekly summaries to ensure math is correct
      // The AI may make arithmetic errors, so we validate and fix
      const correctedWeeklySummaries: WeeklySummary[] = [];
      let runningCash = available_funds;
      
      for (let week = 1; week <= 4; week++) {
        const weekItems = scheduleData.items.filter(item => item.payment_week === week);
        const weekTotal = weekItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const invoiceCount = weekItems.length;
        
        // Subtract this week's payments from running cash
        runningCash = runningCash - weekTotal;
        
        // Find existing summary or create new one
        const existingSummary = scheduleData.weekly_summaries.find(s => s.week === week);
        
        correctedWeeklySummaries.push({
          week,
          start_date: existingSummary?.start_date || getWeekDates(week).start,
          end_date: existingSummary?.end_date || getWeekDates(week).end,
          total_payments: weekTotal, // Use recalculated total
          invoice_count: invoiceCount, // Use recalculated count
          cash_remaining: Math.round(runningCash * 100) / 100, // Round to 2 decimal places
        });
      }
      
      // Replace AI's weekly summaries with corrected ones
      scheduleData.weekly_summaries = correctedWeeklySummaries;
      
      // Recalculate total_savings from items
      scheduleData.total_savings = scheduleData.items
        .filter(item => item.discount_captured)
        .reduce((sum, item) => sum + (item.savings || 0), 0);
      
      console.log("Successfully parsed and validated AI schedule with", scheduleData.items.length, "items");
      console.log("Corrected weekly summaries:", JSON.stringify(correctedWeeklySummaries));
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", aiContent);
      
      // Return a fallback response with error indication
      return new Response(JSON.stringify({ 
        error: "AI returned an unexpected format. Please try again.",
        raw_response: aiContent.substring(0, 500),
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI payment schedule generated successfully");

    return new Response(JSON.stringify({ 
      schedule: scheduleData,
      generated_at: new Date().toISOString(),
      bills_analyzed: bills.length,
      available_funds,
      optimize_for
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Payment schedule error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
