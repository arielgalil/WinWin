import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { AppSettings, Campaign } from "../types";
import { logger } from "../utils/logger";

interface UseCampaignOptions<T = AppSettings> {
  slugOverride?: string;
  settingsSelector?: (settings: AppSettings) => T;
  initialData?: {
    campaign: Campaign;
    settings: AppSettings;
  };
}

export const useCampaign = <T = AppSettings>(
  options: UseCampaignOptions<T> = {},
) => {
  const { slugOverride, settingsSelector, initialData } = options;
  const queryClient = useQueryClient();
  const { slug: urlSlug } = useParams() as { slug: string };
  const slug = slugOverride || urlSlug;

  // Move log to useEffect to prevent state update during render (DebugConsole)
  useEffect(() => {
    if (slug) {
      logger.debug(`[useCampaign] Initializing for slug: ${slug} (v3.6.1)`);
    }
  }, [slug]);

  const {
    data: campaign,
    isLoading: isLoadingCampaign,
    isFetching: isFetchingCampaign,
    isError: isCampaignError,
    error: campaignFetchError,
  } = useQuery({
    queryKey: ["campaign", slug],
    queryFn: async () => {
      if (!slug) return null;
      const fetchWithRetry = async (attempt = 1): Promise<Campaign | null> => {
        try {
          const { data, error } = await supabase.from("campaigns").select(
            "*, institution:institutions(*)",
          ).eq("slug", slug).maybeSingle();

          if (error) throw error;
          if (!data) return null;

          const campaign = data as Campaign;
          // If the campaign doesn't have its own logo, use the institution's logo
          if (!campaign.logo_url && campaign.institution?.logo_url) {
            campaign.logo_url = campaign.institution.logo_url;
          }
          return campaign;
        } catch (err) {
          if (attempt < 2) {
            logger.warn(`Campaign fetch failed, retrying... (Attempt ${attempt})`);
            await new Promise(r => setTimeout(r, 1000));
            return fetchWithRetry(attempt + 1);
          }
          throw err;
        }
      };
      
      const campaign = await fetchWithRetry();
      if (!campaign) {
        logger.warn(`Campaign not found for slug: ${slug}`);
        return null;
      }
      return campaign;
    },
    enabled: !!slug, 
    initialData: initialData?.campaign,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });

  const campaignId = campaign?.id;

  const {
    data: settings,
    isLoading: isLoadingSettings,
    isFetching: isFetchingSettings,
  } = useQuery({
    queryKey: ["settings", campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      
      const fetchWithRetry = async (attempt = 1): Promise<AppSettings | null> => {
        try {
          const { data, error } = await supabase.from("app_settings").select("*")
            .eq("campaign_id", campaignId).maybeSingle();
          
          if (error) throw error;

          // If no settings exist yet, provide a robust default object to avoid blank screens
          if (!data) {
            const defaultSettings: AppSettings = {
              campaign_id: campaignId,
              school_name: campaign?.institution?.name || "Win2Grow School",
              competition_name: campaign?.name || "New Competition",
              logo_url: campaign?.logo_url || null,
              primary_color: "#3b82f6",
              secondary_color: "#1d4ed8",
              background_brightness: 50,
              min_points: 0,
              max_points: 100,
              points_step: 1,
              language: "he",
              is_frozen: false,
              rotation_enabled: false,
              rotation_interval: 10
            };
            return defaultSettings;
          }

          return (data as AppSettings | null) ?? null;
        } catch (err) {
          if (attempt < 2) {
            logger.warn(`Settings fetch failed, retrying... (Attempt ${attempt})`);
            await new Promise(r => setTimeout(r, 1000));
            return fetchWithRetry(attempt + 1);
          }
          throw err;
        }
      };

      return fetchWithRetry();
    },
    enabled: !!campaignId, 
    initialData: initialData?.settings,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 2,
    select: settingsSelector,
  });

  const refreshCampaign = useCallback(
    () => slug ? queryClient.refetchQueries({ queryKey: ["campaign", slug] }) : Promise.resolve(),
    [queryClient, slug],
  );

  const refreshSettings = useCallback(
    () => campaignId ? queryClient.refetchQueries({ queryKey: ["settings", campaignId] }) : Promise.resolve(),
    [queryClient, campaignId],
  );

  // Safety return for components that don't need campaign data (e.g. Super Admin)
  if (!slug) {
    return {
      campaign: null,
      campaignId: undefined,
      settings: null,
      isLoadingCampaign: false,
      isLoadingSettings: false,
      isFetchingCampaign: false,
      isFetchingSettings: false,
      isCampaignError: false,
      campaignFetchError: null,
      refreshCampaign: () => Promise.resolve(),
      refreshSettings: () => Promise.resolve(),
    };
  }

  return {
    campaign,
    campaignId,
    settings,
    isLoadingCampaign: isLoadingCampaign && !initialData,
    isLoadingSettings: isLoadingSettings && !initialData,
    isFetchingCampaign,
    isFetchingSettings,
    isCampaignError,
    campaignFetchError,
    refreshCampaign,
    refreshSettings,
  };
};
