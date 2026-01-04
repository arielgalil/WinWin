import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAdminSummary, testGeminiConnection } from '../geminiService';
import { supabase } from '../../supabaseClient';
import { AppSettings } from '../../types';

// Declare mocks outside so they can be accessed and cleared
const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({
  eq: mockEq,
}));
const mockSelect = vi.fn(); // If select is used in `geminiService.ts`

// Use these declared mocks inside vi.mock
vi.mock('../../supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}));

// Mock i18n
vi.mock('../../utils/i18n', () => ({
  t: (key: string) => key,
}));

// Mock GoogleGenAI properly as a constructor
const generateContentMock = vi.fn().mockResolvedValue({ response: { text: () => 'pong' } });
const getGenerativeModelMock = vi.fn().mockImplementation(() => ({
  generateContent: generateContentMock,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function() {
    return {
      getGenerativeModel: getGenerativeModelMock,
    };
  }),
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clears all spies and their call history
    // Reset specific mock implementations if needed
    mockEq.mockResolvedValue({ error: null }); // Ensure it's reset for all tests
  });

  it('generateAdminSummary should call invoke with correct parameters', async () => {
    const mockLogs = [
      { id: '1', created_at: '2023-01-01', description: 'Test Log', points: 10, teacher_name: 'Teacher' }
    ];
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { text: 'AI Summary Result' },
      error: null,
    } as any);

    const result = await generateAdminSummary(mockLogs as any, {} as AppSettings, 'en', 'campaign-id-123');
    
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ask-gemini', expect.objectContaining({
      body: expect.objectContaining({
        model: 'gemini-2.5-flash-lite-preview-09-2025'
      })
    }));
    expect(result).toBe('AI Summary Result');
    // Expect update to have been called for saving the new summary
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        ai_summary: 'AI Summary Result',
    }));
    expect(mockEq).toHaveBeenCalledWith('campaign_id', 'campaign-id-123');
  });

  it('should handle timeout/abort correctly (simulated via error return)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { error: 'Timeout simulated' },
        error: null,
    } as any);

    await expect(generateAdminSummary([], {} as AppSettings, 'en', 'campaign-id-123')).rejects.toThrow('Timeout simulated');
  });

  it('testGeminiConnection with override key should use GoogleGenAI directly', async () => {
    const result = await testGeminiConnection('fake-key');
    expect(result.success).toBe(true);
    expect(result.message).toBe('ai_connection_success_provided_key');
    expect(getGenerativeModelMock).toHaveBeenCalledWith({ model: 'gemini-2.5-flash-lite-preview-09-2025' });
  });

  describe('AI Summary Persistence', () => {
    it('should return existing summary if it is recent', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
      const mockSettings = {
        ai_summary: 'Recent summary',
        ai_summary_updated_at: recentDate.toISOString(),
      } as AppSettings;

      const result = await generateAdminSummary([], mockSettings, 'en', 'campaign-id-123');

      expect(result).toBe('Recent summary');
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
      // Ensure no update call was made
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should generate new summary if existing one is old', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
      const mockSettings = {
        ai_summary: 'Old summary',
        ai_summary_updated_at: oldDate.toISOString(),
      } as AppSettings;

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { text: 'New AI Summary' },
        error: null,
      } as any);

      const result = await generateAdminSummary([], mockSettings, 'en', 'campaign-id-123');

      expect(result).toBe('New AI Summary');
      expect(supabase.functions.invoke).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('app_settings');
      expect(mockUpdate).toHaveBeenCalledWith({ // Assert on mockUpdate directly
        ai_summary: 'New AI Summary',
        ai_summary_updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('campaign_id', 'campaign-id-123'); // Assert on mockEq directly
    });
  });
});
