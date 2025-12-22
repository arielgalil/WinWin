import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { AppSettings } from '../types';
import { useLanguage } from './useLanguage';

export const useSettings = (campaignId: string | undefined) => {
  const { t } = useLanguage();

  const { data: settings } = useQuery({
    queryKey: ['settings', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('campaign_id', campaignId).single();
      if (error) {
        console.error("Settings fetch error:", error);
        throw error;
      }
      return data as AppSettings;
    },
    enabled: !!campaignId,
    refetchInterval: 1000 * 30, // 30 seconds (reduced from 2 seconds)
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    settings: (settings || { 
      school_name: t('loading'), 
      competition_name: '', 
      logo_url: null,
      primary_color: '#4c1d95',
      secondary_color: '#0f172a',
      background_brightness: 50,
      score_presets: []
    }) as AppSettings,
    isLoading: !settings && !!campaignId
  };
};