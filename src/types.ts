import React from "react";
import { CONFIG } from "./config";

export const APP_VERSION = CONFIG.APP_VERSION;

export interface ContactPerson {
  name: string;
  phone: string;
  email: string;
  role?: string;
}

export interface Institution {
  id: string;
  name: string;
  type?: string;
  logo_url?: string;
  crm_notes?: string;
  contacts: ContactPerson[];
  created_at?: string;
}

export interface Campaign {
  id: string;
  institution_id?: string;
  institution?: Institution;
  name: string;
  slug: string;
  is_active?: boolean;
  theme_color?: string;
  secondary_color?: string;
  logo_url?: string;
  price?: number;
  amount_paid?: number;
  payment_status?: "paid" | "partial" | "pending" | "cancelled";
  ai_enabled?: boolean;
}

export interface TickerMessage {
  id: string;
  text: string;
  campaign_id?: string;
  display_order?: number;
}

export interface Student {
  id: string;
  name: string;
  score: number;
  prev_score: number;
  trend: "up" | "down" | "same";
  class_id: string;
  campaign_id?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  color: string;
  score: number;
  target_score?: number;
  students: Student[];
  campaign_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "teacher" | "superuser";
  class_id: string | null;
  class_ids?: string[] | null;
  full_name: string;
}

export interface ScorePreset {
  label: string;
  value: number;
}

export interface CompetitionGoal {
  id: string;
  name: string;
  target_score: number;
  image_type: "upload" | "emoji";
  image_value: string;
}

export interface AppSettings {
  id?: string;
  school_name: string;
  competition_name: string;
  logo_url: string | null;
  primary_color?: string;
  secondary_color?: string;
  background_brightness?: number;
  current_commentary?: string;
  min_points?: number;
  max_points?: number;
  points_step?: number;
  score_presets?: ScorePreset[];
  target_score?: number;
  hex_grid_size?: number;
  goals_config?: CompetitionGoal[];
  campaign_id?: string;
  institution_type?: string;
  header_text_color_1?: string;
  header_text_color_2?: string;
  ai_custom_prompt?: string;
  ai_keywords?: string[];
  ai_shoutouts_enabled?: boolean;
  background_music_url?: string | null;
  background_music_mode?: "loop" | "once";
  background_music_volume?: number;
  gemini_api_key?: string;
  language?: "he" | "en";
  is_frozen?: boolean;
  ai_summary?: string | null;
  ai_summary_updated_at?: string | null;
  settings_updated_at?: string;
  users_updated_at?: string;
  goals_updated_at?: string;
  classes_updated_at?: string;
  logs_updated_at?: string;
  rotation_enabled?: boolean;
  rotation_interval?: number; // Default/Global fallback
  rotation_config?: { url: string; duration: number; hidden?: boolean }[];
  iris_pattern?:
    | { cx: number; cy: number; weight: number; delay: number }[]
    | null;
  burst_student_threshold?: number;
  burst_class_threshold?: number;
  burst_sounds_enabled?: boolean;
  burst_notifications_enabled?: boolean;
  burst_volume?: number;
  enabled_burst_types?: string[];
  leaderboard_top_count?: number;
  leaderboard_momentum_count?: number;
  active_lucky_wheel_id?: string | null;
  active_spin?: {
    winner_index: number;
    winner_name: string;
    round_number: number;
    start_at_ms: number;
    duration_ms: number;
    participant_names: string[];
  } | null;
}

export interface LogSnapshot {
  [key: string]: string | number | boolean | null | LogSnapshot | LogSnapshot[];
}

export interface ActionLog {
  id: string;
  created_at: string;
  description: string;
  points: number;
  teacher_name?: string;
  user_id?: string;
  student_id?: string | null;
  class_id?: string | null;
  campaign_id?: string;
  snapshot_data?: LogSnapshot;
  is_cancelled?: boolean;
  note?: string;
}

export enum ViewState {
  DASHBOARD = "DASHBOARD",
  LOGIN = "LOGIN",
  ADMIN_PANEL = "ADMIN_PANEL",
  CAMPAIGN_SELECTOR = "CAMPAIGN_SELECTOR",
  SUPER_ADMIN = "SUPER_ADMIN",
  TEACHER_LITE = "TEACHER_LITE",
}

export interface BurstNotificationData {
  id: string;
  type:
    | "GOAL_REACHED"
    | "LEADER_CHANGE"
    | "STAR_STUDENT"
    | "CLASS_BOOST"
    | "SHOUTOUT";
  title: string;
  subTitle?: string;
  value?: string | number;
  icon?: React.ReactNode;
  /** Emoji to show in the icon circle instead of the default SVG icon */
  emoji?: string;
}

// ── Lucky Wheel ──────────────────────────────────────────────────

export interface WheelFilterCriteria {
  class_ids?: string[];
  min_score?: number;
  max_score?: number;
  exclude_previous_winners?: boolean;
  points_per_ticket?: number;
}

export interface LuckyWheelTemplate {
  id: string;
  campaign_id: string;
  name: string;
  total_rounds: number;
  filter_criteria: WheelFilterCriteria;
  participant_ids: string[];
  participant_names: string[];
  ticket_weights?: number[];
  last_activated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LuckyWheelWinner {
  id: string;
  template_id: string | null;
  campaign_id: string;
  student_id: string | null;
  student_name: string;
  class_name?: string;
  won_at: string;
  round_number: number;
  /** Computed place in the countdown (1 = first, null = bonus round) */
  place_number?: number | null;
  wheel_name?: string;
}

/** Broadcast payload for remote wheel control */
export interface LuckyWheelControlState {
  action: "ACTIVATE" | "SPIN" | "RESET" | "DEACTIVATE";
  template_id?: string;
  participant_names?: string[];
  winner_index?: number;
  winner_name?: string;
  winner_class?: string;
  wheel_name?: string;
  round_number?: number;
  /** Computed place (1 = first, null = bonus) */
  place_number?: number | null;
  total_rounds?: number;
  start_at_ms?: number;
  duration_ms?: number;
  /** Filter criteria snapshot — shown in the info card when wheel opens */
  filter_criteria?: WheelFilterCriteria;
  /** Prize emoji — synchronized from admin so all screens show the same one */
  prize_emoji?: string;
  /** Resolved class names for the selected class_ids */
  class_names?: string[];
}
