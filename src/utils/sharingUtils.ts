import { Campaign } from '../types';

interface ShareMessageOptions {
  role?: string | null;
  campaign: Campaign;
  institutionName: string;
  origin: string;
}

const encouragingClosings = [
  'מעצימה',
  'פוריה',
  'מלאת פרגונים'
];

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
  origin
}: ShareMessageOptions): string => {
  const normalizedRole = role?.toLowerCase().trim();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'superuser' || normalizedRole === 'super_user' || normalizedRole === 'competition_admin';
  
  const dashboardLink = `${origin}/#/comp/${campaign.slug}`;
  const scoringLink = `${origin}/#/vote/${campaign.slug}`;
  const adminLink = `${origin}/#/admin/${campaign.slug}`;

  const closing = encouragingClosings[Math.floor(Math.random() * encouragingClosings.length)];

  let message = `🌱 תחרות מצמיחה - ${institutionName} - ${campaign.name}\n`;
  message += `* לוח התוצאות 🏆 - ${dashboardLink}\n`;
  message += `* הזנת ניקוד 🧮 - ${scoringLink}\n`;

  if (isAdmin) {
    message += `* ניהול תחרות ⚙️ - ${adminLink}\n`;
  }

  message += `שתהיה תחרות ${closing} ומצמיחה!`;

  return message;
};
