import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Campaign } from '../types';
import { logger } from '../utils/logger';

export const useCampaign = (slugOverride?: string) => {
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
      return data as Campaign;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes (reduced from 5 seconds)
  });

  return {
    campaign,
    campaignId: campaign?.id,
    isLoadingCampaign,
    isCampaignError,
    campaignFetchError,
    refreshCampaign: () => queryClient.refetchQueries({ queryKey: ['campaign', slug] })
  };
};