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

      const { data: clsData, error: clsError } = await supabase
        .from('classes')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (clsError) {
        console.error("Classes fetch error:", clsError);
        throw clsError;
      }
      
      const { data: stuData, error: stuError } = await supabase
        .from('students')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (stuError) {
        console.error("Students fetch error:", stuError);
        throw stuError;
      }

      return (clsData || []).map(cls => ({ 
        ...cls, 
        students: (stuData || []).filter(s => s.class_id === cls.id) 
      })) as ClassRoom[];
    },
    enabled: !!campaignId,
    refetchInterval: 1000 * 15,
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
