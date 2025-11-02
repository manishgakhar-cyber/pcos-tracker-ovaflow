import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const assessmentSchema = z.object({
  age: z.number().int().min(10).max(100),
  height: z.number().min(36).max(96), // inches
  weight: z.number().min(50).max(500), // lbs
  ethnicity: z.string().max(100),
  periodFrequency: z.string().max(100),
  cycleLength: z.number().int().min(14).max(60),
  irregularPeriods: z.string().max(50),
  flowIntensity: z.string().max(50),
  symptoms: z.array(z.string()).max(20),
  acneSeverity: z.string().max(50),
  hairGrowth: z.string().max(50),
  hairLoss: z.string().max(50),
  weightChanges: z.string().max(50),
  moodSymptoms: z.array(z.string()).max(20),
  familyHistory: z.string().max(50),
  medications: z.string().max(500).optional(),
  additionalNotes: z.string().max(1000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validationResult = assessmentSchema.safeParse(body.assessmentData);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid input data. Please check all fields and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assessmentData = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a medical assessment AI specializing in PCOS (Polycystic Ovary Syndrome) risk evaluation. 

Your task is to analyze the user's assessment data and provide an accurate risk score (0-100) and risk level (Low, Moderate, or High) based on established medical criteria.

IMPORTANT SCORING GUIDELINES:
- PCOS diagnosis typically requires at least 2 out of 3 Rotterdam criteria:
  1. Irregular or absent ovulation (irregular periods)
  2. Clinical or biochemical signs of hyperandrogenism (excess hair growth, acne, male-pattern baldness)
  3. Polycystic ovaries on ultrasound (cannot be assessed here)

- Risk scoring should be evidence-based:
  * Low Risk (0-30): Few or no significant symptoms, regular cycles
  * Moderate Risk (31-60): Some concerning symptoms, possibly meets 1 Rotterdam criterion
  * High Risk (61-100): Multiple significant symptoms, likely meets 2+ Rotterdam criteria

- Consider symptom severity and combination, not just count:
  * Having 2 mild symptoms is NOT high risk
  * Having irregular periods + significant hirsutism + severe acne = higher risk
  * Family history increases risk but is not diagnostic alone

- Weight considerations:
  * Weight gain alone is not diagnostic of PCOS
  * Consider it as a contributing factor, not primary indicator

Return ONLY a JSON object with this exact structure (no additional text):
{
  "riskScore": <number 0-100>,
  "riskLevel": "<Low|Moderate|High>",
  "reasoning": "<brief explanation of the assessment>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"]
}`;

    const userPrompt = `Please analyze this PCOS assessment data:

Age: ${assessmentData.age}
Height: ${assessmentData.height} inches
Weight: ${assessmentData.weight} lbs
Ethnicity: ${assessmentData.ethnicity}

Period Frequency: ${assessmentData.periodFrequency}
Cycle Length: ${assessmentData.cycleLength} days
Irregular Periods: ${assessmentData.irregularPeriods}
Flow Intensity: ${assessmentData.flowIntensity}

Physical Symptoms Checked: ${assessmentData.symptoms.length > 0 ? assessmentData.symptoms.join(', ') : 'None'}
Acne Severity: ${assessmentData.acneSeverity}
Excess Hair Growth: ${assessmentData.hairGrowth}
Hair Loss: ${assessmentData.hairLoss}
Weight Changes: ${assessmentData.weightChanges}

Mood Symptoms: ${assessmentData.moodSymptoms.length > 0 ? assessmentData.moodSymptoms.join(', ') : 'None'}
Family History of PCOS: ${assessmentData.familyHistory}

Medications: ${assessmentData.medications || 'None'}
Additional Notes: ${assessmentData.additionalNotes || 'None'}

Provide your analysis.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to process assessment. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Sanitize content - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse the JSON response from the AI
    const analysisResult = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-pcos-assessment:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ 
        error: "Failed to process assessment. Please try again."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
