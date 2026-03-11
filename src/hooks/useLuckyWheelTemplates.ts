import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import {
    LuckyWheelTemplate,
    LuckyWheelWinner,
    Student,
    WheelFilterCriteria,
} from "../types";
import { logger } from "../utils/logger";

/**
 * React Query hook for Lucky Wheel template CRUD and winner history.
 */
export function useLuckyWheelTemplates(campaignId?: string) {
    const queryClient = useQueryClient();

    // ── Fetch all templates for this campaign ──
    const {
        data: templates = [],
        isLoading: isLoadingTemplates,
    } = useQuery<LuckyWheelTemplate[]>({
        queryKey: ["wheel-templates", campaignId],
        queryFn: async () => {
            if (!campaignId) return [];
            const { data, error } = await supabase
                .from("lucky_wheel_templates")
                .select("*")
                .eq("campaign_id", campaignId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!campaignId,
    });

    // ── Fetch winner history ──
    const {
        data: winners = [],
        isLoading: isLoadingWinners,
    } = useQuery<LuckyWheelWinner[]>({
        queryKey: ["wheel-winners", campaignId],
        queryFn: async () => {
            if (!campaignId) return [];
            const { data, error } = await supabase
                .from("lucky_wheel_winners")
                .select("*")
                .eq("campaign_id", campaignId)
                .order("won_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!campaignId,
    });

    // ── Apply filter criteria against existing students ──
    const filterParticipants = async (
        criteria: WheelFilterCriteria,
        allStudents: Student[],
    ): Promise<{ ids: string[]; names: string[] }> => {
        let filtered = [...allStudents];

        if (criteria.class_ids && criteria.class_ids.length > 0) {
            filtered = filtered.filter((s) =>
                criteria.class_ids!.includes(s.class_id)
            );
        }
        if (criteria.min_score != null) {
            filtered = filtered.filter((s) => s.score >= criteria.min_score!);
        }
        if (criteria.max_score != null) {
            filtered = filtered.filter((s) => s.score <= criteria.max_score!);
        }
        if (criteria.exclude_previous_winners && campaignId) {
            const { data: prevWinners } = await supabase
                .from("lucky_wheel_winners")
                .select("student_id")
                .eq("campaign_id", campaignId);
            const winnerIds = new Set(
                (prevWinners ?? []).map((w) => w.student_id),
            );
            filtered = filtered.filter((s) => !winnerIds.has(s.id));
        }

        return {
            ids: filtered.map((s) => s.id),
            names: filtered.map((s) => s.name),
        };
    };

    // ── Create template ──
    const createTemplate = useMutation({
        mutationFn: async (input: {
            name: string;
            filter_criteria: WheelFilterCriteria;
            participant_ids: string[];
            participant_names: string[];
        }) => {
            if (!campaignId) throw new Error("No campaign");
            const { data, error } = await supabase.from("lucky_wheel_templates")
                .insert({
                    campaign_id: campaignId,
                    name: input.name,
                    filter_criteria: input.filter_criteria,
                    participant_ids: input.participant_ids,
                    participant_names: input.participant_names,
                }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-templates", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to create wheel template", err),
    });

    // ── Update template ──
    const updateTemplate = useMutation({
        mutationFn: async (
            input: Partial<LuckyWheelTemplate> & { id: string },
        ) => {
            const { id, ...updates } = input;
            const { error } = await supabase
                .from("lucky_wheel_templates")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-templates", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to update wheel template", err),
    });

    // ── Delete template ──
    const deleteTemplate = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("lucky_wheel_templates")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-templates", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to delete wheel template", err),
    });

    // ── Duplicate template ──
    const duplicateTemplate = useMutation({
        mutationFn: async (template: LuckyWheelTemplate) => {
            if (!campaignId) throw new Error("No campaign");
            const { data, error } = await supabase.from("lucky_wheel_templates")
                .insert({
                    campaign_id: campaignId,
                    name: `${template.name} (copy)`,
                    filter_criteria: template.filter_criteria,
                    participant_ids: template.participant_ids,
                    participant_names: template.participant_names,
                }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-templates", campaignId],
            });
        },
        onError: (err) =>
            logger.error("Failed to duplicate wheel template", err),
    });

    // ── Delete winner ──
    const deleteWinner = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("lucky_wheel_winners")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-winners", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to delete wheel winner", err),
    });

    // ── Delete ALL winners ──
    const deleteAllWinners = useMutation({
        mutationFn: async () => {
            if (!campaignId) throw new Error("No campaign");
            const { error } = await supabase
                .from("lucky_wheel_winners")
                .delete()
                .eq("campaign_id", campaignId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-winners", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to delete all wheel winners", err),
    });

    // ── Save winner ──
    const saveWinner = useMutation({
        mutationFn: async (
            input: Omit<LuckyWheelWinner, "id" | "won_at" | "campaign_id">,
        ) => {
            if (!campaignId) throw new Error("No campaign");
            const { error } = await supabase.from("lucky_wheel_winners").insert(
                {
                    ...input,
                    campaign_id: campaignId,
                    won_at: new Date().toISOString(),
                },
            );
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-winners", campaignId],
            });
        },
        onError: (err) => logger.error("Failed to save wheel winner", err),
    });

    // ── Record activation ──
    const recordActivation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("lucky_wheel_templates")
                .update({ last_activated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["wheel-templates", campaignId],
            });
        },
        onError: (err) =>
            logger.error("Failed to record wheel activation", err),
    });

    return {
        templates,
        isLoadingTemplates,
        winners,
        isLoadingWinners,
        filterParticipants,
        createTemplate: createTemplate.mutateAsync,
        updateTemplate: updateTemplate.mutateAsync,
        deleteTemplate: deleteTemplate.mutateAsync,
        duplicateTemplate: duplicateTemplate.mutateAsync,
        saveWinner: saveWinner.mutateAsync,
        deleteWinner: deleteWinner.mutateAsync,
        deleteAllWinners: deleteAllWinners.mutateAsync,
        recordActivation: recordActivation.mutateAsync,
        isCreating: createTemplate.isPending,
    };
}
