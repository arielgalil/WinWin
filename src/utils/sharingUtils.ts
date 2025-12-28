import { Campaign } from '../types';
import { t, Language } from './i18n';

interface ShareMessageOptions {
  role?: string | null;
  campaign: Campaign;
  institutionName: string;
  origin: string;
  language?: Language;
}

/**
 * Generates a role-based message for sharing the competition links.
 * 
 * Super Admin/Admin: Dashboard, Scoring, and Admin Panel links.
 * Teacher/Others: Dashboard and Scoring links.
 */
export const generateRoleBasedShareMessage = ({
  role,
  campaign,
  institutionName,
  origin,
  language = 'he'
}: ShareMessageOptions): string => {
  const normalizedRole = role?.toLowerCase().trim();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superuser' || normalizedRole === 'super_user' || normalizedRole === 'competition_admin';
  
  const dashboardLink = `${origin}/#/comp/${campaign.slug}`;
  const scoringLink = `${origin}/#/vote/${campaign.slug}`;
  const adminLink = `${origin}/#/admin/${campaign.slug}`;

  const adjs = [
    t('share_adj_1', language),
    t('share_adj_2', language),
    t('share_adj_3', language)
  ];
  const closing = adjs[Math.floor(Math.random() * adjs.length)];

  let message = t('share_title', language, { institution: institutionName, campaign: campaign.name }) + '\n';
  message += `* ${t('share_leaderboard', language)} - ${dashboardLink}\n`;
  message += `* ${t('share_scoring', language)} - ${scoringLink}\n`;

  if (isAdmin) {
    message += `* ${t('share_admin', language)} - ${adminLink}\n`;
  }

  message += t('share_closing', language, { adj: closing });

  return message;
};
