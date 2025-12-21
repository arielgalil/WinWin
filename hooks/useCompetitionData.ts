import { useEffect, useCallback } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ClassRoom, AppSettings, TickerMessage, Campaign, CompetitionGoal } from '../types';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';

export const useCompetitionData = (slugOverride?: string) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { slug: urlSlug } = useParams() as { slug: string };
  const slug = slugOverride || urlSlug;
  const { user } = useAuth();

  const { data: campaign, isLoading: isLoadingCampaign, isError: isCampaignError, error: campaignFetchError } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*, institution:institutions(*)').eq('slug', slug).single();
      if (error) {
        console.error("Campaign fetch error:", error);
        throw error;
      }
      return data as Campaign;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 5000,
  });

  const campaignId = campaign?.id;

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
    refetchInterval: 2000,
  });

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
  });

  const { data: tickerMessages = [] } = useQuery({
    queryKey: ['ticker', campaignId],
    queryFn: async () => {
        const { data, error } = await supabase.from('ticker_messages').select('*').eq('campaign_id', campaignId).order('display_order');
        if (error) console.error("Ticker fetch error:", error);
        return data as TickerMessage[];
    },
    enabled: !!campaignId,
  });

  const { data: campaignRole } = useQuery({
    queryKey: ['role', campaignId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaign_users').select('role').eq('campaign_id', campaignId).eq('user_id', user?.id).single();
      if (error) console.error("Role fetch error:", error);
      return data?.role;
    },
    enabled: !!campaignId && !!user?.id,
  });

  const { data: logsData, fetchNextPage: loadMoreLogs } = useInfiniteQuery({
    queryKey: ['logs', campaignId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.from('action_logs').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }).range(Number(pageParam), Number(pageParam) + 24);
      if (error) console.error("Logs fetch error:", error);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.length === 25 ? allPages.length * 25 : undefined,
    enabled: !!campaignId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['logs', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['ticker', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['settings', campaignId] });
  }, [queryClient, campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    
    // Explicitly listen to changes in key tables to ensure real-time updates work reliably
    const channel = supabase.channel(`realtime_${campaignId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'classes', 
        filter: `campaign_id=eq.${campaignId}` 
      }, (payload) => {
        console.log("Realtime: Classes update received", payload);
        invalidate();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students', 
        filter: `campaign_id=eq.${campaignId}` 
      }, () => invalidate())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'action_logs', 
        filter: `campaign_id=eq.${campaignId}` 
      }, () => invalidate())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings', 
      }, (payload) => {
        console.log("Realtime: Settings update received", payload);
        invalidate();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'ticker_messages', 
        filter: `campaign_id=eq.${campaignId}` 
      }, () => invalidate())
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'campaigns', 
      }, (payload) => {
        console.log("Realtime: Campaign update received", payload);
        invalidate();
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${campaignId}:`, status);
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [campaignId, invalidate]);

  const addPoints = async (payload: { classId: string; studentId?: string; points: number; teacherName: string; note?: string }) => {
    const { error } = await supabase.rpc('add_score_transaction', {
        p_class_id: payload.classId,
        p_student_id: payload.studentId,
        p_points: payload.points,
        p_teacher_name: payload.teacherName,
        p_note: payload.note,
        p_campaign_id: campaignId
    });
    if (error) {
      console.error("RPC Point Transaction Error:", error);
      throw error;
    }
    invalidate();
  };

  const updateCommentary = async (text: string) => {
    if (!campaignId) return;
    const { error } = await supabase.from('app_settings').update({ current_commentary: text }).eq('campaign_id', campaignId);
    if (error) console.error("Commentary update failed", error);
    else invalidate();
  };

  const deleteLog = async (id: string) => {
    const { data: log, error: fetchErr } = await supabase.from('action_logs').select('is_cancelled').eq('id', id).single();
    if (fetchErr) { console.error("Error fetching log state:", fetchErr); return; }
    
    const { error: updErr } = await supabase.from('action_logs').update({ is_cancelled: !log?.is_cancelled }).eq('id', id);
    if (updErr) console.error("Error toggling log cancellation:", updErr);
    
    invalidate();
  };

  const updateLog = async ({ id, description, points }: { id: string; description: string; points: number }) => {
    const { error } = await supabase.from('action_logs').update({ description, points }).eq('id', id);
    if (error) console.error("Log update error:", error);
    invalidate();
  };

  const addTickerMessage = async (text: string) => {
    const { error } = await supabase.from('ticker_messages').insert({ text, campaign_id: campaignId });
    if (error) console.error("Ticker add error:", error);
    invalidate();
  };

  const deleteTickerMessage = async (id: string) => {
    const { error } = await supabase.from('ticker_messages').delete().eq('id', id);
    if (error) console.error("Ticker delete error:", error);
    invalidate();
  };

  const updateTickerMessage = async ({ id, ...updates }: { id: string; [key: string]: any }) => {
    const { error } = await supabase.from('ticker_messages').update(updates).eq('id', id);
    if (error) console.error("Ticker update error:", error);
    invalidate();
  };

  const updateClassTarget = async (classId: string, targetScore: number) => {
    const { error } = await supabase.from('classes').update({ target_score: targetScore }).eq('id', classId);
    if (error) console.error("Class target update error:", error);
    invalidate();
  };

  const updateSettingsGoals = async (goals: CompetitionGoal[], gridSize: number) => {
    const { error } = await supabase.from('app_settings').update({ goals_config: goals, hex_grid_size: gridSize }).eq('campaign_id', campaignId);
    if (error) console.error("Goals update error:", error);
    invalidate();
  };

  const toggleFreeze = async (isFrozen: boolean) => {
    if (!campaignId) return;
    const { error } = await supabase.from('app_settings').update({ is_frozen: isFrozen }).eq('campaign_id', campaignId);
    if (error) console.error("Freeze toggle error:", error);
    else invalidate();
  };

  return {
    classes,
    // Fix: provide a complete fallback for AppSettings to satisfy TypeScript union type checks in consumers
    settings: (settings || { 
      school_name: t('loading'), 
      competition_name: '', 
      logo_url: null,
      primary_color: '#4c1d95',
      secondary_color: '#0f172a',
      background_brightness: 50,
      score_presets: []
    }) as AppSettings,
    currentCampaign: campaign,
    campaignRole,
    isLoadingCampaign,
    isCampaignError,
    campaignFetchError,
    logs: logsData?.pages.flat() || [],
    tickerMessages,
    addPoints,
    updateCommentary,
    deleteLog,
    updateLog,
    addTickerMessage,
    deleteTickerMessage,
    updateTickerMessage,
    updateClassTarget,
    updateSettingsGoals,
    toggleFreeze,
    refreshData: invalidate,
    loadMoreLogs,
    notification: null
  };
};
