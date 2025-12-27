import { useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ClassRoom, AppSettings, TickerMessage, Campaign, CompetitionGoal } from '../types';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';
import { useToast } from './useToast';
import { logger } from '../utils/logger';

export const useCompetitionData = (slugOverride?: string) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
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
    staleTime: 1000 * 60 * 10, // Increased to 10 minutes to reduce load
    refetchInterval: 10000, // Reduced from 5 seconds to 10 seconds
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
    refetchInterval: 15000, // Reduced to 15 seconds to reduce server load
    staleTime: 5000, // Increased to 5 seconds to reduce refetches
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

  const { data: campaignRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['role', campaignId, user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('campaign_users').select('role').eq('campaign_id', campaignId).eq('user_id', user?.id).single();
        if (error) {
          // If no rows found, user is not a member - return null
          if (error.code === 'PGRST116') {
            console.log('User is not a member of this campaign');
            return null;
          }
          // For other errors (like RLS violations), return undefined to indicate uncertainty
          console.warn('Role query failed with error:', error.code, error.message);
          return undefined;
        }
        console.log('User role found:', data?.role);
        return data?.role;
      } catch (err) {
        console.error('Unexpected error in role query:', err);
        return undefined;
      }
    },
    enabled: !!campaignId && !!user?.id,
    retry: 2, // Allow more retries to handle temporary issues
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
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

  // Realtime subscriptions moved to useRealtimeSubscriptions hook to avoid duplication

  // Track ongoing score updates to prevent race conditions
  const ongoingUpdates = useRef(new Set<string>());

  const addPoints = async (payload: { classId: string; studentId?: string; points: number; teacherName: string; note?: string }) => {
    // Validate and sanitize inputs
    if (!payload.classId || typeof payload.classId !== 'string') {
      throw new Error('Invalid class ID');
    }
    if (typeof payload.points !== 'number' || isNaN(payload.points)) {
      throw new Error('Invalid points value');
    }
    if (!payload.teacherName || typeof payload.teacherName !== 'string') {
      throw new Error('Invalid teacher name');
    }
    
    // Check if similar update is already in progress  
    const similarKey = `${payload.classId}-${payload.studentId || 'class'}`;
    if (ongoingUpdates.current.has(similarKey)) {
      throw new Error('Score update already in progress for this target');
    }
    
    // Create unique key and track update
    const updateKey = `${payload.classId}-${payload.studentId || 'class'}-${Date.now()}`;
    ongoingUpdates.current.add(updateKey);
    
    try {
      // Build sanitized parameters object
      const rpcParams: any = {
        p_class_id: payload.classId.trim(),
        p_points: Math.max(-9999, Math.min(9999, payload.points)), // Limit points range
        p_teacher_name: payload.teacherName.trim().substring(0, 100), // Limit length and trim
        p_campaign_id: campaignId
      };

      // Always include these parameters, passing NULL explicitly when needed
      rpcParams.p_student_id = payload.studentId ? payload.studentId.trim() : null;
      rpcParams.p_note = payload.note ? payload.note.trim().substring(0, 500) : null; // Limit note length

    logger.info("Calling add_score_transaction with params:", rpcParams);
    
    if (!window.navigator.onLine) {
      showToast(t('sync_pending'), 'info');
    }

    const { error } = await supabase.rpc('add_score_transaction', rpcParams);
    if (error) {
      logger.error("RPC Point Transaction Error:", error);
        throw error;
      }
      
      // Immediate refresh for critical data
      await queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
      await queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
      
      // Also refresh other related data
      invalidate();
    } finally {
      ongoingUpdates.current.delete(similarKey);
    }
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
    
    if (!window.navigator.onLine) {
      showToast(t('sync_pending'), 'info');
    }

    const { error: updErr } = await supabase.from('action_logs').update({ is_cancelled: !log?.is_cancelled }).eq('id', id);
    if (updErr) console.error("Error toggling log cancellation:", updErr);
    
    invalidate();
  };

  const updateLog = async ({ id, description, points }: { id: string; description: string; points: number }) => {
    if (!window.navigator.onLine) {
      showToast(t('sync_pending'), 'info');
    }
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
    if (error) {
      console.error("Class target update error:", error);
    } else {
      await updateTabTimestamp('goals');
    }
    invalidate();
  };

  const updateSettingsGoals = async (goals: CompetitionGoal[], gridSize: number) => {
    const { error } = await supabase.from('app_settings').update({ 
      goals_config: goals, 
      hex_grid_size: gridSize,
      goals_updated_at: new Date().toISOString()
    }).eq('campaign_id', campaignId);
    if (error) console.error("Goals update error:", error);
    invalidate();
  };

  const updateTabTimestamp = async (tab: 'settings' | 'users' | 'goals' | 'classes' | 'logs') => {
    if (!campaignId) return;
    const column = `${tab}_updated_at`;
    const { error } = await supabase.from('app_settings').update({ [column]: new Date().toISOString() }).eq('campaign_id', campaignId);
    if (error) console.error(`Timestamp update failed for ${tab}`, error);
    else invalidate();
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
    isLoadingRole,
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
    updateTabTimestamp,
    toggleFreeze,
    refreshData: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
      await queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
      invalidate();
    },
    loadMoreLogs,
    notification: null
  };
};
