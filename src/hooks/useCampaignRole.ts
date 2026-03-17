import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useCallback, useMemo } from 'react';

interface UseCampaignRoleOptions<T = string | null | undefined> {
  select?: (data: string | null | undefined) => T;
}

const ROLE_CACHE_PREFIX = 'metziacha_role_cache_';

export const useCampaignRole = <T = string | null | undefined>(
  campaignId: string | undefined, 
  userId: string | undefined,
  options: UseCampaignRoleOptions<T> = {}
) => {
  const { select } = options;
  const cacheKey = `${ROLE_CACHE_PREFIX}${campaignId}_${userId}`;

  const getCachedRole = useCallback(() => {
    if (!campaignId || !userId) return undefined;
    const value = localStorage.getItem(cacheKey);
    return value ?? undefined; // null from localStorage means key not found → no initial data
  }, [campaignId, userId, cacheKey]);

  const saveToCache = useCallback((role: string | null) => {
    if (!campaignId || !userId || role === undefined) return;
    if (role === null) localStorage.removeItem(cacheKey);
    else localStorage.setItem(cacheKey, role);
  }, [campaignId, userId, cacheKey]);

  const initialRole = useMemo(() => getCachedRole(), [getCachedRole]) as string | undefined;

  const { data: campaignRole, isLoading: isLoadingRole, isFetching: isFetchingRole, isError, error } = useQuery({
    queryKey: ['role', campaignId, userId],
    queryFn: async () => {
      if (!campaignId || !userId) return null;
      try {
        const { data, error } = await supabase
          .from('campaign_users')
          .select('role')
          .eq('campaign_id', campaignId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const role = data?.role ?? null;
        saveToCache(role);
        return role;
      } catch (err) {
        console.error('Unexpected error in role query:', err);
        // Throw so React Query preserves cached/initialData instead of overwriting with null
        throw err;
      }
    },
    enabled: !!campaignId && !!userId,
    initialData: initialRole,
    staleTime: 1000 * 60 * 5, // 5 mins — revoked access clears within 5 min (was 30)
    retry: 1,
    select: select as any,
  });

  return {
    campaignRole: campaignRole as T,
    isLoadingRole: isLoadingRole && campaignRole === undefined,
    isFetchingRole,
    isError,
    error
  };
};
