import { describe, it, expect, vi } from 'vitest';
import { generateRoleBasedShareMessage } from '../sharingUtils';

describe('sharingUtils', () => {
  const mockCampaign = {
    name: 'תחרות חורף',
    slug: 'winter-2025',
  };
  const mockInstitution = 'בית ספר דוגמה';

  it('generates a Super Admin message with all 3 links', () => {
    const message = generateRoleBasedShareMessage({
      role: 'superuser',
      campaign: mockCampaign as any,
      institutionName: mockInstitution,
      origin: 'https://winwin.app'
    });

    expect(message).toContain('תחרות חורף');
    expect(message).toContain('בית ספר דוגמה');
    expect(message).toContain('לוח התוצאות 🏆 - https://winwin.app/#/comp/winter-2025');
    expect(message).toContain('הזנת ניקוד 🧮 - https://winwin.app/#/vote/winter-2025');
    expect(message).toContain('ניהול תחרות ⚙️ - https://winwin.app/#/admin/winter-2025');
  });

  it('generates a Competition Admin message with all 3 links', () => {
    const message = generateRoleBasedShareMessage({
      role: 'admin',
      campaign: mockCampaign as any,
      institutionName: mockInstitution,
      origin: 'https://winwin.app'
    });

    expect(message).toContain('ניהול תחרות ⚙️');
  });

  it('generates a Teacher message with only 2 links (no admin link)', () => {
    const message = generateRoleBasedShareMessage({
      role: 'teacher',
      campaign: mockCampaign as any,
      institutionName: mockInstitution,
      origin: 'https://winwin.app'
    });

    expect(message).toContain('לוח התוצאות 🏆');
    expect(message).toContain('הזנת ניקוד 🧮');
    expect(message).not.toContain('ניהול תחרות ⚙️');
  });
});
