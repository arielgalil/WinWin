import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TIMEOUTS } from '../../config';
import { supabase } from '../../supabaseClient';
import React from 'react';

// Mock dependencies
vi.mock('../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
                }))
            }))
        })),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        }
    }
}));

vi.mock('../../utils/i18n', () => ({
    t: (key: string) => key,
}));

describe('AuthContext Timeouts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses configured safety timeout on mount', async () => {
        const spy = vi.spyOn(global, 'setTimeout');
        
        await act(async () => {
             render(
                <AuthProvider>
                    <div>Child</div>
                </AuthProvider>
            );
        });

        // The safety timer in useEffect
        expect(spy).toHaveBeenCalledWith(expect.any(Function), TIMEOUTS.authSafetyTimeoutMs);
    });

    it('uses configured profile fetch timeout', async () => {
        // Mock session to trigger fetchUserProfile
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: { 
                session: { 
                    user: { id: 'test-user', email: 'test@example.com' } 
                } 
            }
        } as any);

        const spy = vi.spyOn(global, 'setTimeout');

        await act(async () => {
            render(
               <AuthProvider>
                   <div>Child</div>
               </AuthProvider>
           );
       });

       // Trigger the async operations
       await act(async () => {
           vi.runAllTicks();
       });

       // We expect the profile fetch timeout to be called
       expect(spy).toHaveBeenCalledWith(expect.any(Function), TIMEOUTS.authProfileFetchMs);
    });
});
