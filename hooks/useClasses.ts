import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { ClassRoom } from '../types';

export const useClasses = (campaignId: string | undefined) => {
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', campaignId],
    queryFn: async () => {
      const { data: clsData, error: clsError } = await supabase.from('classes').select('*').eq('campaign_id', campaignId);
      if (clsError) console.error("Classes fetch error:", clsError);
      
      const { data: stuData, error: stuError } = await supabase.from('students').select('*').eq('campaign_id', campaignId);
      if (stuError) console.error("Students fetch error:", stuError);

      return (clsData || []).map(cls => ({ 
        ...cls, 
        students: (stuData || []).filter(s => s.class_id === cls.id) 
      })) as ClassRoom[];
    },
    enabled: !!campaignId,
    refetchInterval: 1000 * 15, // 15 seconds (reduced from 3 seconds)
    staleTime: 1000 * 10, // 10 seconds
  });

  return { classes };
};