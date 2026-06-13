import sql from '../../utils/sql.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get database stats
    let totalShoppers = 50;
    let avgSpent = 5000;
    let inactiveCount = 10;
    
    try {
      const stats = await sql`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(total_spent), 0) as avg_spent,
          COUNT(*) FILTER (WHERE last_purchase_date < NOW() - INTERVAL '30 days') as inactive
        FROM customers;
      `;
      if (stats && stats[0]) {
        totalShoppers = parseInt(stats[0].total || '0', 10);
        avgSpent = parseFloat(stats[0].avg_spent || '0');
        inactiveCount = parseInt(stats[0].inactive || '0', 10);
      }
    } catch (e) {
      console.error('Error fetching database stats for AI strategist:', e);
    }

    // Check if API key is set
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const systemPrompt = `
          You are an AI marketing strategist for a luxury fashion brand.
          Brand customer statistics:
          - Total customers: ${totalShoppers}
          - Average customer spent: ${avgSpent.toFixed(2)}
          - Inactive customers (>30 days): ${inactiveCount}

          Marketer's Request: "${prompt}"

          Analyze this request and suggest a targeting segment and communication campaign templates.
          You must return ONLY a raw JSON object (do not wrap in markdown or backticks) with this structure:
          {
            "segment_name": "Short, catchy name",
            "description": "One sentence describing who is in this group",
            "criteria": {
              "min_spent": number or null,
              "days_inactive": number or null
            },
            "message_whatsapp": "Personalized WhatsApp template. Use {{first_name}} and {{last_name}} as placeholder variables. Keep it conversational and include a placeholder URL [Link].",
            "message_email": "Subject: ...\\n\\nBody: ... (Include placeholder variables like {{first_name}} and a link)",
            "reasoning": "Explain in 2 sentences why this targeting criteria and channel strategy will drive maximum conversion and revenue."
          }
        `;

        const result = await model.generateContent(systemPrompt);
        let text = result.response.text();
        // Clean JSON formatting
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(text);
        return new Response(JSON.stringify(json), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to rule-based system:', geminiError);
      }
    }

    // Rules-based fallback system
    let suggestion = {
      segment_name: "Engaged Shoppers Segment",
      description: "Active shoppers with moderate spent",
      criteria: { min_spent: 1000, days_inactive: null },
      message_whatsapp: "Hi {{first_name}}, check out our trending items this week: [Link]!",
      message_email: "Subject: Trending this week: Selected for you\n\nHi {{first_name}},\n\nCheck out the hottest trends of the week chosen just for you.",
      reasoning: "Targeting moderate spenders increases overall engagement and encourages repeat purchase behavior. (Using fallback strategist)"
    };

    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes('big') || lowercasePrompt.includes('high') || lowercasePrompt.includes('spender') || lowercasePrompt.includes('spent')) {
      suggestion = {
        segment_name: "Lapsed Luxury Enthusiasts",
        description: "Shoppers who spent more than $5000 in total",
        criteria: { min_spent: 5000, days_inactive: null },
        message_whatsapp: "Hey {{first_name}}! We noticed you love premium style. Check out our new luxury collection: [Link]",
        message_email: "Subject: VIP Exclusive: New Luxury Collection\n\nHi {{first_name}},\n\nWe appreciate your loyalty! As one of our top shoppers, we'd love to invite you to view our newest premium products.",
        reasoning: "Targeting high spenders boosts average order value because these customers have higher purchasing power and brand affinity. (Using fallback strategist)"
      };
    } else if (lowercasePrompt.includes('inactive') || lowercasePrompt.includes('lost') || lowercasePrompt.includes('30 days') || lowercasePrompt.includes('lapse') || lowercasePrompt.includes('haven')) {
      suggestion = {
        segment_name: "Lapsed Customers Segment",
        description: "Shoppers who have not bought in the last 30 days",
        criteria: { min_spent: null, days_inactive: 30 },
        message_whatsapp: "Hi {{first_name}}, we miss you! Here's 10% off your next purchase: [Link]. Hope to see you back!",
        message_email: "Subject: We miss you, {{first_name}}! Here's 10% off\n\nHi {{first_name}},\n\nIt's been a while since your last purchase. We'd love to welcome you back with a special 10% discount.",
        reasoning: "Re-engaging inactive shoppers before they completely churn is cost-effective and helps recover lost sales. (Using fallback strategist)"
      };
    }

    return new Response(JSON.stringify(suggestion), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
