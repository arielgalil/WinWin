const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore: Deno is available in Edge Functions environment
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { prompt, systemInstruction, model, jsonSchema } = payload;
    
    // MINIMAL CONNECTIVITY TEST (PING/PONG)
    if (prompt === "ping") {
        return new Response(JSON.stringify({ text: "pong" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Model and API Key selection
    const modelName = model || 'gemini-2.5-flash-lite-preview-09-2025';
    // @ts-ignore: Deno.env is available in Edge Functions environment
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("API_KEY");
    
    if (!apiKey) {
        throw new Error("API_KEY_MISSING_ON_SERVER");
    }

    // Call Gemini API directly via fetch (Zero SDK)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const body: any = {
      contents: [{
        parts: [{ text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }]
      }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
      }
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }]
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
