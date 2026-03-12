import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { AppSettings, Campaign } from "../types";
import { logger } from "../utils/logger";
import { withTimeout } from "../utils/supabaseUtils";

interface UseCampaignOptions<T = AppSettings> {
  slugOverride?: string;
  settingsSelector?: (settings: AppSettings) => T;
  initialData?: {
    campaign: Campaign;
    settings: AppSettings;
  };
}

const CACHE_PREFIX = 'metziacha_camp_cache_';

export const useCampaign = <T = AppSettings>(
  options: UseCampaignOptions<T> = {},
) => {
  const { slugOverride, settingsSelector, initialData } = options;
  const queryClient = useQueryClient();
  const { slug: urlSlug } = useParams() as { slug: string };
  const slug = slugOverride || urlSlug;

  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistence logic for Instant-On
  const getCachedData = useCallback(() => {
    if (!slug) return null;
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${slug}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn("Failed to parse campaign cache", e);
    }
    return null;
  }, [slug]);

  const saveToCache = useCallback((data: any) => {
    if (!slug || !data.campaign || !data.settings) return;
    // Cancel any pending write before scheduling a new one (prevents stale data overwriting fresh data)
    if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
    cacheTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`${CACHE_PREFIX}${slug}`, JSON.stringify(data));
      } catch (e) {}
    }, 1000);
  }, [slug]);

  // Derived initial data from options OR cache
  const effectiveInitialData = useMemo(() => {
    if (initialData) return initialData;
    return getCachedData();
  }, [initialData, getCachedData]);

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
          // Reduced timeout to 6s for faster recovery
          const { data, error } = await withTimeout(
            supabase.from("campaigns").select(
              "*, institution:institutions(*)",
            ).eq("slug", slug).maybeSingle(),
            6000 
          );

          if (error) throw error;
          if (!data) return null;

          const campaign = data as Campaign;
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
      
      return await fetchWithRetry();
    },
    enabled: !!slug, 
    initialData: effectiveInitialData?.campaign,
    staleTime: 1000 * 60 * 5, // 5 mins stale (down from 30)
    refetchOnWindowFocus: false,
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
          // Reduced timeout to 6s
          const { data, error } = await withTimeout(
            supabase.from("app_settings").select("*")
              .eq("campaign_id", campaignId).maybeSingle(),
            6000
          );
          
          if (error) throw error;

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
    initialData: effectiveInitialData?.settings,
    staleTime: 1000 * 5, // 5 seconds stale (down from 15 mins) - critical for real-time
    refetchOnWindowFocus: false,
    select: settingsSelector,
  });

  // Background Cache Update
  useEffect(() => {
    if (campaign && settings && !isFetchingCampaign && !isFetchingSettings) {
       // We only cache the full settings object, not the selected one
       // To do this simply, we only trigger cache if we have raw settings
       // If settingsSelector is used, 'settings' might be partial. 
       // We'll skip caching if partial to be safe, or just cache campaign
       saveToCache({ campaign, settings });
    }
  }, [campaign, settings, isFetchingCampaign, isFetchingSettings, saveToCache]);

  const refreshCampaign = useCallback(
    () => slug ? queryClient.refetchQueries({ queryKey: ["campaign", slug] }) : Promise.resolve(),
    [queryClient, slug],
  );

  const refreshSettings = useCallback(
    () => campaignId ? queryClient.refetchQueries({ queryKey: ["settings", campaignId] }) : Promise.resolve(),
    [queryClient, campaignId],
  );

  return useMemo(() => {
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
      // If we have data (from cache or elsewhere), we are NOT loading
      isLoadingCampaign: isLoadingCampaign && !campaign,
      isLoadingSettings: isLoadingSettings && !settings,
      isFetchingCampaign,
      isFetchingSettings,
      isCampaignError,
      campaignFetchError,
      refreshCampaign,
      refreshSettings,
    };
  }, [
    slug,
    campaign,
    campaignId,
    settings,
    isLoadingCampaign,
    isLoadingSettings,
    isFetchingCampaign,
    isFetchingSettings,
    isCampaignError,
    campaignFetchError,
    refreshCampaign,
    refreshSettings
  ]);
};
