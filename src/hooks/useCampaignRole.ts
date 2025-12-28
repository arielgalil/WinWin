import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

interface UseCampaignRoleOptions<T = string | null | undefined> {
  select?: (data: string | null | undefined) => T;
}

export const useCampaignRole = <T = string | null | undefined>(
  campaignId: string | undefined, 
  userId: string | undefined,
  options: UseCampaignRoleOptions<T> = {}
) => {
  const { select } = options;
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
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }
        return data?.role;
      } catch (err) {
        console.error('Unexpected error in role query:', err);
        return undefined;
      }
    },
    enabled: !!campaignId && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    select: select as any,
  });

  return {
    campaignRole: campaignRole as T,
    isLoadingRole,
    isError,
    error
  };
};
