import { renderHook } from '@testing-library/react';
import { useAuthPermissions } from '../useAuthPermissions';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import { useCampaign } from '../../hooks/useCampaign';
import { useCampaignRole } from '../../hooks/useCampaignRole';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../hooks/useCampaign', () => ({
    useCampaign: vi.fn(),
}));

vi.mock('../../hooks/useCampaignRole', () => ({
    useCampaignRole: vi.fn(),
}));

vi.mock('../../config', () => ({
    isSuperUser: (role: string) => role === 'superuser',
}));

describe('useAuthPermissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default campaign mock
        vi.mocked(useCampaign).mockReturnValue({ campaign: { id: 'test-camp' } } as any);
    });

    it('returns the correct permission status for a teacher', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'teacher' } } as any);
        vi.mocked(useCampaignRole).mockReturnValue({ campaignRole: 'teacher' } as any);
        
        const { result } = renderHook(() => useAuthPermissions());
        
        expect(result.current.isTeacher).toBe(true);
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.canAccessAdmin).toBe(false);
        expect(result.current.canAccessVote).toBe(true);
    });

    it('returns the correct permission status for a campaign admin', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'user' } } as any);
        vi.mocked(useCampaignRole).mockReturnValue({ campaignRole: 'admin' } as any);
        
        const { result } = renderHook(() => useAuthPermissions());
        
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.canAccessAdmin).toBe(true);
        expect(result.current.canAccessVote).toBe(true);
    });

    it('returns the correct permission status for a superuser', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { role: 'superuser' } } as any);
        vi.mocked(useCampaignRole).mockReturnValue({ campaignRole: 'teacher' } as any);
        
        const { result } = renderHook(() => useAuthPermissions());
        
        expect(result.current.isSuper).toBe(true);
        expect(result.current.canAccessAdmin).toBe(true);
        expect(result.current.canAccessVote).toBe(true);
    });
});