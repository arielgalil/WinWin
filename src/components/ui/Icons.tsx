import React from 'react';

interface IconProps {
  className?: string;
}

const MaterialIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => {
  // Heuristic to map Tailwind width classes to font-size
  // This ensures the font-icon scales similarly to an SVG
  let fontSize = '24px'; // Default for icons
  
  if (className.includes('w-3') || className.includes('h-3')) fontSize = '12px';
  if (className.includes('w-4') || className.includes('h-4')) fontSize = '16px';
  if (className.includes('w-5') || className.includes('h-5')) fontSize = '20px';
  if (className.includes('w-6') || className.includes('h-6')) fontSize = '24px';
  if (className.includes('w-8') || className.includes('h-8')) fontSize = '32px';
  if (className.includes('w-10') || className.includes('h-10')) fontSize = '40px';
  if (className.includes('w-12') || className.includes('h-12')) fontSize = '48px';
  if (className.includes('w-14') || className.includes('h-14')) fontSize = '56px';
  if (className.includes('w-16') || className.includes('h-16')) fontSize = '64px';
  if (className.includes('w-20') || className.includes('h-20')) fontSize = '80px';
  if (className.includes('w-24') || className.includes('h-24')) fontSize = '96px';

  // Manual override if text- size class is present (rare for icons but possible)
  if (className.includes('text-xs')) fontSize = '12px';
  if (className.includes('text-sm')) fontSize = '14px';
  if (className.includes('text-base')) fontSize = '16px';
  if (className.includes('text-lg')) fontSize = '18px';
  if (className.includes('text-xl')) fontSize = '20px';
  if (className.includes('text-2xl')) fontSize = '24px';
  if (className.includes('text-3xl')) fontSize = '30px';
  if (className.includes('text-4xl')) fontSize = '36px';

  return (
    <span 
      className={`material-symbols-rounded ${filled ? 'icon-filled' : ''} inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ 
        fontSize,
        width: '1em', 
        height: '1em',
        lineHeight: 1
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

export const TrophyIcon = ({ className }: IconProps) => <MaterialIcon name="emoji_events" className={className} filled />;
export const TrendUpIcon = ({ className }: IconProps) => <MaterialIcon name="trending_up" className={className} />;
export const TrendDownIcon = ({ className }: IconProps) => <MaterialIcon name="trending_down" className={className} />;
export const TrendSameIcon = ({ className }: IconProps) => <MaterialIcon name="remove" className={className} />;
export const UsersIcon = ({ className }: IconProps) => <MaterialIcon name="groups" className={className} />;
export const AwardIcon = ({ className }: IconProps) => <MaterialIcon name="workspace_premium" className={className} />;
export const LockIcon = ({ className }: IconProps) => <MaterialIcon name="lock" className={className} />;
export const PlusIcon = ({ className }: IconProps) => <MaterialIcon name="add" className={className} />;
export const RefreshIcon = ({ className }: IconProps) => <MaterialIcon name="sync" className={className} />;
export const SchoolIcon = ({ className }: IconProps) => <MaterialIcon name="school" className={className} />;
export const LogoutIcon = ({ className }: IconProps) => <MaterialIcon name="logout" className={className} />;
export const SparklesIcon = ({ className }: IconProps) => <MaterialIcon name="auto_awesome" className={className} filled />;
export const CrownIcon = ({ className }: IconProps) => <MaterialIcon name="crown" className={className} filled />;
export const MedalIcon = ({ className }: IconProps) => <MaterialIcon name="military_tech" className={className} />;
export const StarIcon = ({ className }: IconProps) => <MaterialIcon name="star" className={className} filled />;
export const TrashIcon = ({ className }: IconProps) => <MaterialIcon name="delete" className={className} />;
export const UploadIcon = ({ className }: IconProps) => <MaterialIcon name="upload" className={className} />;
export const DownloadIcon = ({ className }: IconProps) => <MaterialIcon name="download" className={className} />;
export const EditIcon = ({ className }: IconProps) => <MaterialIcon name="edit" className={className} />;
export const CheckIcon = ({ className }: IconProps) => <MaterialIcon name="check" className={className} />;
export const XIcon = ({ className }: IconProps) => <MaterialIcon name="close" className={className} />;
export const AlertIcon = ({ className }: IconProps) => <MaterialIcon name="warning" className={className} />;
export const CheckCircleIcon = ({ className }: IconProps) => <MaterialIcon name="check_circle" className={className} filled />;
export const AlertCircleIcon = ({ className }: IconProps) => <MaterialIcon name="error" className={className} filled />;
export const InfoIcon = ({ className }: IconProps) => <MaterialIcon name="info" className={className} />;
export const LayersIcon = ({ className }: IconProps) => <MaterialIcon name="layers" className={className} />;
export const ListIcon = ({ className }: IconProps) => <MaterialIcon name="format_list_bulleted" className={className} />;
export const SearchIcon = ({ className }: IconProps) => <MaterialIcon name="search" className={className} />;
export const MenuIcon = ({ className }: IconProps) => <MaterialIcon name="menu" className={className} />;
export const CopyIcon = ({ className }: IconProps) => <MaterialIcon name="content_copy" className={className} />;
export const ShareIcon = ({ className }: IconProps) => <MaterialIcon name="share" className={className} />;
export const PlayIcon = ({ className }: IconProps) => <MaterialIcon name="play_arrow" className={className} filled />;
export const PauseIcon = ({ className }: IconProps) => <MaterialIcon name="pause" className={className} filled />;
export const SunIcon = ({ className }: IconProps) => <MaterialIcon name="light_mode" className={className} />;
export const MoonIcon = ({ className }: IconProps) => <MaterialIcon name="dark_mode" className={className} />;
export const HomeIcon = ({ className }: IconProps) => <MaterialIcon name="home" className={className} filled />;
export const UserIcon = ({ className }: IconProps) => <MaterialIcon name="person" className={className} filled />;
export const DatabaseIcon = ({ className }: IconProps) => <MaterialIcon name="dns" className={className} />;
export const UndoIcon = ({ className }: IconProps) => <MaterialIcon name="undo" className={className} />;
export const RedoIcon = ({ className }: IconProps) => <MaterialIcon name="redo" className={className} />;
export const SaveIcon = ({ className }: IconProps) => <MaterialIcon name="save" className={className} filled />;
export const ArrowRightIcon = ({ className }: IconProps) => <MaterialIcon name="arrow_forward" className={className} />;
export const TargetIcon = ({ className }: IconProps) => <MaterialIcon name="track_changes" className={className} />;
export const MapIcon = ({ className }: IconProps) => <MaterialIcon name="map" className={className} />;
export const CompassIcon = ({ className }: IconProps) => <MaterialIcon name="explore" className={className} />;
export const FootprintsIcon = ({ className }: IconProps) => <MaterialIcon name="footprint" className={className} />;
export const SendIcon = ({ className }: IconProps) => <MaterialIcon name="send" className={className} />;
export const LinkIcon = ({ className }: IconProps) => <MaterialIcon name="link" className={className} />;
export const SettingsIcon = ({ className }: IconProps) => <MaterialIcon name="settings" className={className} />;
export const CalculatorIcon = ({ className }: IconProps) => <MaterialIcon name="calculate" className={className} />;
export const DollarSignIcon = ({ className }: IconProps) => <MaterialIcon name="attach_money" className={className} />;
export const SproutIcon = ({ className }: IconProps) => <MaterialIcon name="eco" className={className} />;
export const KeyIcon = ({ className }: IconProps) => <MaterialIcon name="key" className={className} />;
export const ShieldAlertIcon = ({ className }: IconProps) => <MaterialIcon name="report" className={className} />;
export const ChevronRightIcon = ({ className }: IconProps) => <MaterialIcon name="chevron_right" className={className} />;
export const MusicIcon = ({ className }: IconProps) => <MaterialIcon name="music_note" className={className} />;
export const Volume2Icon = ({ className }: IconProps) => <MaterialIcon name="volume_up" className={className} />;
export const VolumeXIcon = ({ className }: IconProps) => <MaterialIcon name="volume_off" className={className} />;
export const ZapIcon = ({ className }: IconProps) => <MaterialIcon name="bolt" className={className} filled />;
export const ClockIcon = ({ className }: IconProps) => <MaterialIcon name="schedule" className={className} />;
export const WifiOffIcon = ({ className }: IconProps) => <MaterialIcon name="wifi_off" className={className} />;
export const WifiIcon = ({ className }: IconProps) => <MaterialIcon name="wifi" className={className} />;