const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_PROMPT_LENGTH = 4000;
const MAX_INSTRUCTION_LENGTH = 2000;
const ALLOWED_MODELS = [
  'gemini-3.1-flash-lite-preview',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

// @ts-ignore: Deno is available in Edge Functions environment
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Require a valid Bearer token — supabase.functions.invoke() always sends the user JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  try {
    const payload = await req.json();
    const { prompt, systemInstruction, model, jsonSchema } = payload;

    // MINIMAL CONNECTIVITY TEST (PING/PONG) — authenticated callers only
    if (prompt === "ping") {
      return new Response(JSON.stringify({ text: "pong" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    if (typeof prompt !== 'string' || prompt.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: 'Prompt too long' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    if (systemInstruction !== undefined && typeof systemInstruction !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid systemInstruction' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Model allowlist — prevents injecting arbitrary model names into the API URL
    const modelName = (typeof model === 'string' && ALLOWED_MODELS.includes(model))
      ? model
      : 'gemini-3.1-flash-lite-preview';

    // @ts-ignore: Deno.env is available in Edge Functions environment
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("API_KEY");

    if (!apiKey) {
      throw new Error("API_KEY_MISSING_ON_SERVER");
    }

    // Call Gemini API directly via fetch (Zero SDK)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const body: any = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
      }
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction.substring(0, MAX_INSTRUCTION_LENGTH) }]
      };
    }

    if (jsonSchema) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.responseSchema = jsonSchema;
    }

    console.log(`Calling Gemini API directly via fetch... Model: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Function Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
