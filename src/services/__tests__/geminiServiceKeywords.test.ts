import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompetitionCommentary, generateFillerMessages, generateAdminSummary } from '../geminiService';
import { supabase } from '../../supabaseClient';
import { AppSettings } from '../../types';

vi.mock('../../supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

describe('AI Service Keyword Integration', () => {
  const mockSettings: AppSettings = {
    school_name: 'Test School',
    competition_name: 'Test Comp',
    ai_keywords: ['Excellence', 'Innovation'],
    ai_custom_prompt: 'Custom Prompt',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateCompetitionCommentary should include keywords in prompt', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { text: 'Test response' } });

    await generateCompetitionCommentary([], 'Action', mockSettings, 100);

    const callArgs = (supabase.functions.invoke as any).mock.calls[0][1].body;
    expect(callArgs.prompt).toContain('השתמש במילות המפתח הבאות');
    expect(callArgs.prompt).toContain('Excellence, Innovation');
    expect(callArgs.model).toBe('gemini-2.5-flash-lite-preview-09-2025');
  });

  it('generateFillerMessages should include keywords in prompt', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { text: '["Message 1"]' } });

    await generateFillerMessages('School', 'Comp', 'he', mockSettings.ai_keywords);

    const callArgs = (supabase.functions.invoke as any).mock.calls[0][1].body;
    expect(callArgs.prompt).toContain('השתמש במילות המפתח הבאות');
    expect(callArgs.prompt).toContain('Excellence, Innovation');
    expect(callArgs.model).toBe('gemini-2.5-flash-lite-preview-09-2025');
  });

  it('generateAdminSummary should include keywords in prompt', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: { text: 'Summary' } });

    await generateAdminSummary([], mockSettings, 'he', 'campaign-123');

    const callArgs = (supabase.functions.invoke as any).mock.calls[0][1].body;
    expect(callArgs.prompt).toContain('השתמש במילות המפתח הבאות');
    expect(callArgs.prompt).toContain('Excellence, Innovation');
    expect(callArgs.model).toBe('gemini-2.5-flash-lite-preview-09-2025');
  });
});
