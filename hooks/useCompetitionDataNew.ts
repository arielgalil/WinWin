import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';
import { useCampaign } from './useCampaign';
import { useSettings } from './useSettings';
import { useClasses } from './useClasses';
import { useCompetitionMutations } from './useCompetitionMutations';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { useTickerMessages, useTickerMutations } from './useTickerMessages';

export const useCompetitionData = (slugOverride?: string) => {
  const { user } = useAuth();
  const { campaign, campaignId, isLoadingCampaign, isCampaignError, campaignFetchError } = useCampaign(slugOverride);
  const { settings } = useSettings(campaignId);
  const { classes } = useClasses(campaignId);
  const { tickerMessages, logs, loadMoreLogs } = useTickerMessages(campaignId);
  
  const mutations = useCompetitionMutations(campaignId);
  const realtime = useRealtimeSubscriptions(campaignId);
  const tickerMutations = useTickerMutations(campaignId, realtime.invalidate);

  const { data: campaignRole } = useQuery({
    queryKey: ['role', campaignId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaign_users').select('role').eq('campaign_id', campaignId).eq('user_id', user?.id).single();
      if (error) console.error("Role fetch error:", error);
      return data?.role;
    },
    enabled: !!campaignId && !!user?.id,
  });

  return {
    classes,
    settings,
    currentCampaign: campaign,
    campaignRole,
    isLoadingCampaign,
    isCampaignError,
    campaignFetchError,
    logs,
    tickerMessages,
    addPoints: mutations.addPoints,
    updateCommentary: mutations.updateCommentary,
    deleteLog: mutations.deleteLog,
    updateLog: mutations.updateLog,
    addTickerMessage: tickerMutations.addTickerMessage,
    deleteTickerMessage: tickerMutations.deleteTickerMessage,
    updateTickerMessage: tickerMutations.updateTickerMessage,
    updateClassTarget: mutations.updateClassTarget,
    updateSettingsGoals: mutations.updateSettingsGoals,
    toggleFreeze: mutations.toggleFreeze,
    refreshData: mutations.refreshData,
    loadMoreLogs,
    notification: null
  };
};