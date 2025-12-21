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
    try {
        const functionUrl = `${(supabase as any).functions.url}/ask-gemini`;
        console.log(`Invoking AI Edge Function at: ${functionUrl}`);
        const { data, error } = await supabase.functions.invoke('ask-gemini', {
            body: payload
        });

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
        console.error("Secure AI call failed:", err);
        
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
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite-preview-09-2025',
                contents: "ping",
            });
            return { success: true, message: t('ai_connection_success_provided_key', lang) };
        }

        const text = await callGeminiFunction({ prompt: "ping" }, lang);
        return { success: !!text, message: text ? t('ai_connection_success_server', lang) : t('ai_empty_response', lang) };
    } catch (error: any) {
        return { success: false, message: error.message || t('ai_communication_error', lang) };
    }
};

export const generateCompetitionCommentary = async (
  topClasses: ClassRoom[],
  recentAction: string,
  settings: AppSettings,
  totalInstitutionScore: number,
  actionNote?: string,
  lang: Language = 'he'
): Promise<string> => {
  const leaders = topClasses.slice(0, 3).map(c => c.name).join(", ");
  const prompt = `Action: ${recentAction}. Note: ${actionNote || 'none'}. Leaders: ${leaders}. Total Institution Score: ${totalInstitutionScore}. Write 1 short exciting Hebrew sentence for a school leaderboard ticker.`;
  
  try {
      return await callGeminiFunction({
          prompt,
          systemInstruction: settings.ai_custom_prompt || t('ai_instruction_commentator', lang),
          model: 'gemini-2.5-flash-lite-preview-09-2025'
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
            }
        }, lang);
        
        if (!text) return fallbacks;
        return JSON.parse(text) || fallbacks;
    } catch (e) {
        return fallbacks;
    }
};

export const generateAdminSummary = async (logs: ActionLog[], lang: Language = 'he'): Promise<string> => {
    // Clean logs to remove IDs and internal data that might confuse the AI or end up in the summary
    const cleanedLogs = logs.slice(0, 25).map(log => ({
        timestamp: log.created_at,
        event: log.description,
        points: log.points,
        performer: log.teacher_name || 'System',
        note: log.note || ''
    }));

    const prompt = t('ai_prompt_summarize', lang, { data: JSON.stringify(cleanedLogs) });
    
    return await callGeminiFunction({
        prompt,
        systemInstruction: t('ai_instruction_admin', lang),
        model: 'gemini-2.5-flash-lite-preview-09-2025'
    }, lang);
};
