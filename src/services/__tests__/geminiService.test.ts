import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAdminSummary, testGeminiConnection } from '../geminiService';
import { supabase } from '../../supabaseClient';

// Mock Supabase
vi.mock('../../supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
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
    vi.clearAllMocks();
  });

  it('generateAdminSummary should call invoke with correct parameters', async () => {
    const mockLogs = [
      { id: '1', created_at: '2023-01-01', description: 'Test Log', points: 10, teacher_name: 'Teacher' }
    ];
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { text: 'AI Summary Result' },
      error: null,
    } as any);

    const result = await generateAdminSummary(mockLogs as any);
    
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ask-gemini', expect.objectContaining({
      body: expect.objectContaining({
        model: 'gemini-2.0-flash'
      })
    }));
    expect(result).toBe('AI Summary Result');
  });

  it('should handle timeout/abort correctly (simulated via error return)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { error: 'Timeout simulated' },
        error: null,
    } as any);

    await expect(generateAdminSummary([])).rejects.toThrow('Timeout simulated');
  });

  it('testGeminiConnection with override key should use GoogleGenAI directly', async () => {
    const result = await testGeminiConnection('fake-key');
    expect(result.success).toBe(true);
    expect(result.message).toBe('ai_connection_success_provided_key');
    expect(getGenerativeModelMock).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
  });
});
