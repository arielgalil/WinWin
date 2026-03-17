import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ClassRoom } from '../types';

interface UseClassesOptions<T = ClassRoom[]> {
  select?: (data: ClassRoom[]) => T;
}

export const useClasses = <T = ClassRoom[]>(
  campaignId: string | undefined,
  options: UseClassesOptions<T> = {}
) => {
  const { select } = options;

  const { data: classes = [] as any, isLoading, isError, error } = useQuery({
    queryKey: ['classes', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];

      // Single query with nested select — eliminates O(n×m) client-side join
      const { data, error } = await supabase
        .from('classes')
        .select('*, students(*)')
        .eq('campaign_id', campaignId);

      if (error) {
        console.error("Classes fetch error:", error);
        throw error;
      }

      return (data || []) as ClassRoom[];
    },
    enabled: !!campaignId,
    // No refetchInterval — realtime subscriptions in useRealtimeSubscriptions handle live updates
    staleTime: 1000 * 10,
    select: select as any,
  });

  return {
    classes: classes as T,
    isLoading,
    isError,
    error
  };
};
