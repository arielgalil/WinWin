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
    if (!campaignId || !userId) return null;
    return localStorage.getItem(cacheKey);
  }, [campaignId, userId, cacheKey]);

  const saveToCache = useCallback((role: string | null) => {
    if (!campaignId || !userId || role === undefined) return;
    if (role === null) localStorage.removeItem(cacheKey);
    else localStorage.setItem(cacheKey, role);
  }, [campaignId, userId, cacheKey]);

  const initialRole = useMemo(() => getCachedRole(), [getCachedRole]);

  const { data: campaignRole, isLoading: isLoadingRole, isError, error } = useQuery({
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
        return null;
      }
    },
    enabled: !!campaignId && !!userId,
    initialData: initialRole,
    staleTime: 1000 * 60 * 30, // 30 mins
    select: select as any,
  });

  return {
    campaignRole: campaignRole as T,
    isLoadingRole: isLoadingRole && campaignRole === undefined,
    isError,
    error
  };
};
