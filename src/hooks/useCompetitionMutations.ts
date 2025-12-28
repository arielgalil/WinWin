import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { CompetitionGoal } from '../types';

export const useCompetitionMutations = (campaignId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    if (!campaignId) return;
    queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['logs', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['ticker', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['settings', campaignId] });
  }, [queryClient, campaignId]);

  const addPoints = useCallback(async (payload: { classId: string; studentId?: string; points: number; teacherName: string; note?: string }) => {
    if (!campaignId) throw new Error('No campaign ID');
    
    const rpcParams: any = {
      p_class_id: payload.classId,
      p_points: payload.points,
      p_teacher_name: payload.teacherName,
      p_campaign_id: campaignId,
      p_student_id: payload.studentId || null,
      p_note: payload.note || null,
    };

    console.log("Calling add_score_transaction with params:", rpcParams);
    
    const { error } = await supabase.rpc('add_score_transaction', rpcParams);
    if (error) {
      console.error("RPC Point Transaction Error:", error);
      throw error;
    }
    
    await queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
    await queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
    invalidate();
  }, [campaignId, queryClient, invalidate]);

  const updateCommentary = useCallback(async (text: string) => {
    if (!campaignId) return;
    const { error } = await supabase.from('app_settings').update({ current_commentary: text }).eq('campaign_id', campaignId);
    if (error) console.error("Commentary update failed", error);
    else invalidate();
  }, [campaignId, invalidate]);

  const deleteLog = useCallback(async (id: string) => {
    const { data: log, error: fetchErr } = await supabase.from('action_logs').select('is_cancelled').eq('id', id).single();
    if (fetchErr) { console.error("Error fetching log state:", fetchErr); return; }
    
    const { error: updErr } = await supabase.from('action_logs').update({ is_cancelled: !log?.is_cancelled }).eq('id', id);
    if (updErr) console.error("Error toggling log cancellation:", updErr);
    
    invalidate();
  }, [invalidate]);

  const updateLog = useCallback(async ({ id, description, points }: { id: string; description: string; points: number }) => {
    const { error } = await supabase.from('action_logs').update({ description, points }).eq('id', id);
    if (error) console.error("Log update error:", error);
    invalidate();
  }, [invalidate]);

  const updateClassTarget = useCallback(async (classId: string, targetScore: number) => {
    const { error } = await supabase.from('classes').update({ target_score: targetScore }).eq('id', classId);
    if (error) console.error("Class target update error:", error);
    invalidate();
  }, [invalidate]);

  const updateSettingsGoals = useCallback(async (goals: CompetitionGoal[], gridSize: number) => {
    if (!campaignId) return;
    const { error } = await supabase.from('app_settings').update({ goals_config: goals, hex_grid_size: gridSize }).eq('campaign_id', campaignId);
    if (error) console.error("Goals update error:", error);
    invalidate();
  }, [campaignId, invalidate]);

  const toggleFreeze = useCallback(async (isFrozen: boolean) => {
    if (!campaignId) return;
    const { error } = await supabase.from('app_settings').update({ is_frozen: isFrozen }).eq('campaign_id', campaignId);
    if (error) console.error("Freeze toggle error:", error);
    else invalidate();
  }, [campaignId, invalidate]);

  const updateTabTimestamp = useCallback(async (tab: 'settings' | 'users' | 'goals' | 'classes' | 'logs') => {
    if (!campaignId) return;
    const column = `${tab}_updated_at`;
    const { error } = await supabase.from('app_settings').update({ [column]: new Date().toISOString() }).eq('campaign_id', campaignId);
    if (error) console.error(`Timestamp update failed for ${tab}`, error);
    else invalidate();
  }, [campaignId, invalidate]);

  return {
    addPoints,
    updateCommentary,
    deleteLog,
    updateLog,
    updateClassTarget,
    updateSettingsGoals,
    toggleFreeze,
    updateTabTimestamp,
    refreshData: async () => {
      if (!campaignId) return;
      await queryClient.invalidateQueries({ queryKey: ['classes', campaignId] });
      await queryClient.refetchQueries({ queryKey: ['classes', campaignId] });
      invalidate();
    }
  };
};