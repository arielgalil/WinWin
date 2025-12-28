import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Campaign, AppSettings } from '../types';
import { logger } from '../utils/logger';

interface UseCampaignOptions<T = AppSettings> {
  slugOverride?: string;
  settingsSelector?: (settings: AppSettings) => T;
}

export const useCampaign = <T = AppSettings>(options: UseCampaignOptions<T> = {}) => {
  const { slugOverride, settingsSelector } = options;
  const queryClient = useQueryClient();
  const { slug: urlSlug } = useParams() as { slug: string };
  const slug = slugOverride || urlSlug;

  const { data: campaign, isLoading: isLoadingCampaign, isError: isCampaignError, error: campaignFetchError } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*, institution:institutions(*)').eq('slug', slug).single();
      if (error) {
        logger.error("Campaign fetch error", { component: 'useCampaign', action: 'fetch', data: error });
        throw error;
      }
      const campaign = data as Campaign;
      // If the campaign doesn't have its own logo, use the institution's logo
      if (!campaign.logo_url && campaign.institution?.logo_url) {
        campaign.logo_url = campaign.institution.logo_url;
      }
      return campaign;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });

  const campaignId = campaign?.id;

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('campaign_id', campaignId).single();
      if (error) {
        logger.error("Settings fetch error", { component: 'useCampaign', action: 'fetchSettings', data: error });
        throw error;
      }
      return data as AppSettings;
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 2,
    select: settingsSelector,
  });

  return {
    campaign,
    campaignId,
    settings,
    isLoadingCampaign,
    isLoadingSettings,
    isCampaignError,
    campaignFetchError,
    refreshCampaign: () => queryClient.refetchQueries({ queryKey: ['campaign', slug] }),
    refreshSettings: () => queryClient.refetchQueries({ queryKey: ['settings', campaignId] }),
  };
};
