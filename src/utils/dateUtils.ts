import { t, Language } from './i18n';

export const formatLastSaved = (dateString: string | null, language: Language = 'he'): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  let datePart: string;
  if (inputDate.getTime() === today.getTime()) {
    datePart = t('today', language);
  } else if (inputDate.getTime() === yesterday.getTime()) {
    datePart = t('yesterday', language);
  } else {
    datePart = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
  
  const timePart = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const separator = ',';
  return `${datePart}${separator} ${timePart}`;
};