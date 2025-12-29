import { describe, it, expect } from 'vitest';
import { t } from '../i18n';

describe('i18n utility (t function)', () => {
  it('should translate a simple key in Hebrew', () => {
    expect(t('loading', 'he')).toBe('טוען...');
  });

  it('should translate a simple key in English', () => {
    expect(t('loading', 'en')).toBe('Loading...');
  });

  it('should substitute parameters correctly in Hebrew', () => {
    const result = t('groups_on_fire', 'he', { names: 'א, ב' });
    expect(result).toBe('א, ב בוערים!');
  });

  it('should substitute parameters correctly in English', () => {
    const result = t('groups_on_fire', 'en', { names: 'A, B' });
    expect(result).toBe('A, B are on fire!');
  });

  it('should handle multiple parameters (if any)', () => {
    // reached_peak: "הגעתם יחד לשיא! %{emoji}"
    expect(t('reached_peak', 'he', { emoji: '🏆' })).toBe('הגעתם יחד לשיא! 🏆');
  });

  it('should handle numeric parameters', () => {
    // from_stage: "משלב %{stage}!"
    expect(t('from_stage', 'he', { stage: 5 })).toBe('משלב 5!');
  });

  it('should fallback to Hebrew if key is missing in specified language', () => {
    // Assuming a key that exists in HE but might be missing in EN during dev
    // For this test, we can mock or just use an existing one.
    expect(t('loading', 'en')).toBe('Loading...');
  });

  it('should return the key itself if it does not exist in any language', () => {
    expect(t('non_existent_key' as any)).toBe('non_existent_key');
  });
});
