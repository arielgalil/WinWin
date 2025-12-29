import { supabase } from "../supabaseClient";
import { ClassRoom, ActionLog, AppSettings } from "../types";
import { t, Language } from "../utils/i18n";

// Helper to call our secure Supabase Edge Function
const callGeminiFunction = async (payload: {
    prompt: string | any;
    systemInstruction?: string;
    model?: string;
    jsonSchema?: any;
}, lang: Language = 'he'): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const { data, error } = await supabase.functions.invoke('ask-gemini', {
            body: {
                ...payload,
                model: payload.model || 'gemini-2.0-flash' // Default to stable model
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (error) {
            console.error("Supabase function connection error:", error.message);
            throw error;
        }
        
        if (data?.error) {
            console.error("AI Edge Function internal error:", data.error);
            throw new Error(data.error);
        }

        return data.text || "";
    } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("Secure AI call failed:", err);
        
        if (err.name === 'AbortError') {
            throw new Error(t('ai_communication_error', lang) + " (Timeout)");
        }

        const msg = err.message || "";
        if (msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError')) {
            throw new Error(t('ai_server_connection_error', lang));
        }
        if (msg.includes('API_KEY')) {
            throw new Error(t('ai_api_key_error', lang));
        }
        throw err;
    }
};

export const testGeminiConnection = async (overrideKey?: string, lang: Language = 'he'): Promise<{ success: boolean; message: string }> => {
    try {
        if (overrideKey) {
            const { GoogleGenAI } = await import("@google/genai");
            const ai = new GoogleGenAI({ apiKey: overrideKey });
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
            await model.generateContent("ping");
            return { success: true, message: t('ai_connection_success_provided_key', lang) };
        }

        const text = await callGeminiFunction({ prompt: "ping" }, lang);
        return { success: !!text, message: text ? t('ai_connection_success_server', lang) : t('ai_empty_response', lang) };
    } catch (error: any) {
        return { success: false, message: error.message || t('ai_communication_error', lang) };
    }
};

// Sanitize input for AI prompts
const sanitizeForAI = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 200) // Limit length
    .trim();
};

export const generateCompetitionCommentary = async (
  topClasses: ClassRoom[],
  recentAction: string,
  settings: AppSettings,
  totalInstitutionScore: number,
  actionNote?: string,
  lang: Language = 'he',
  contributors?: string[]
): Promise<string> => {
  // Sanitize all inputs
  const sanitizedLeaders = topClasses.slice(0, 3).map(c => sanitizeForAI(c.name)).filter(Boolean).join(", ");
  const sanitizedContributors = contributors && contributors.length > 0 
    ? contributors.map(sanitizeForAI).filter(Boolean).join(", ") 
    : sanitizedLeaders;
  const sanitizedAction = sanitizeForAI(recentAction);
  const sanitizedNote = sanitizeForAI(actionNote || '');
  
  const prompt = `Recent Contributors: ${sanitizedContributors}. Total Score: ${totalInstitutionScore}. Goal Progress: ${sanitizedAction}. Note: ${sanitizedNote}. Task: Congratulate the contributors (names only) in exactly 3-5 Hebrew words.`;
  
  try {
      return await callGeminiFunction({
          prompt,
          systemInstruction: settings.ai_custom_prompt || t('ai_instruction_commentator', lang),
          model: 'gemini-2.0-flash'
      }, lang);
  } catch (err) {
      return t('ai_commentary_fallback', lang);
  }
};

export const generateFillerMessages = async (schoolName: string, competitionName: string, lang: Language = 'he'): Promise<string[]> => {
    const fallbacks = [
        t('ai_fallback_1', lang),
        t('ai_fallback_2', lang),
        t('ai_fallback_3', lang),
        t('ai_fallback_4', lang),
        t('ai_fallback_5', lang)
    ];
    try {
        const text = await callGeminiFunction({
            prompt: t('ai_prompt_generate_filler', lang, { schoolName, competitionName }),
            jsonSchema: {
                type: "array",
                items: { type: "string" }
            },
            model: 'gemini-2.0-flash'
        }, lang);
        
        if (!text) return fallbacks;
        return JSON.parse(text) || fallbacks;
    } catch (e) {
        return fallbacks;
    }
};

export const generateAdminSummary = async (
  logs: ActionLog[],
  settings: AppSettings,
  lang: Language = 'he',
  campaignId: string
): Promise<string> => {
  const threshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (settings.ai_summary && settings.ai_summary_updated_at) {
    const lastUpdate = new Date(settings.ai_summary_updated_at).getTime();
    const now = new Date().getTime();
    if (now - lastUpdate < threshold) {
      return settings.ai_summary;
    }
  }

  // Clean logs to remove IDs and internal data that might confuse the AI or end up in the summary
  const cleanedLogs = logs.slice(0, 25).map(log => ({
      timestamp: log.created_at,
      event: log.description,
      points: log.points,
      performer: log.teacher_name || 'System',
      note: log.note || ''
  }));

  const prompt = t('ai_prompt_summarize', lang, { data: JSON.stringify(cleanedLogs) });

  const summary = await callGeminiFunction({
      prompt,
      systemInstruction: t('ai_instruction_admin', lang),
      model: 'gemini-2.0-flash'
  }, lang);

  if (summary && campaignId) {
    const { error } = await supabase
      .from('app_settings')
      .update({
        ai_summary: summary,
        ai_summary_updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Failed to save AI summary', error);
    }
  }

  return summary;
};