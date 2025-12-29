import { describe, it, expect } from 'vitest';
import { parseFormattedText } from '../whatsappUtils';

describe('whatsappUtils', () => {
  describe('parseFormattedText', () => {
    it('should split text by **bold**', () => {
      const text = 'Hello **world**!';
      const result = parseFormattedText(text);
      expect(result).toEqual(['Hello ', '**world**', '!']);
    });

    it('should split text by *bold*', () => {
      const text = 'Hello *world*!';
      const result = parseFormattedText(text);
      expect(result).toEqual(['Hello ', '*world*', '!']);
    });

    it('should handle ambiguous asterisk usage (likely intended as bullets) by not bolding', () => {
      const text = 'Item 1 * Item 2 * Item 3';
      // New behavior expectation: treated as plain text because of spaces
      const result = parseFormattedText(text);
      expect(result).toEqual(['Item 1 * Item 2 * Item 3']);
    });

    it('should strict bold *text* but not * text *', () => {
        const text = 'Bold *bold* Not * not *';
        const result = parseFormattedText(text);
        expect(result).toEqual(['Bold ', '*bold*', ' Not * not *']);
    });
  });
});
