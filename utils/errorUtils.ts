
import { useLanguage } from '../hooks/useLanguage';

/**
 * Extracts a user-friendly error message from various error objects.
 * Supports Supabase error format and generic JS errors.
 */
export const useErrorFormatter = () => {
    const { t } = useLanguage();

    const getErrorMessage = (err: any, fallbackKey: any = 'error'): string => {
        if (!err) return '';
        
        console.error('Error occurred:', err);

        // Supabase error object usually has a 'message' property
        const rawMessage = err.message || (typeof err === 'string' ? err : '');
        
        if (rawMessage.includes('already registered') || rawMessage.includes('unique constraint')) {
            return (t as any)('user_exists_error') || rawMessage;
        }

        if (rawMessage.includes('network') || rawMessage.includes('fetch')) {
            return (t as any)('network_error') || rawMessage;
        }

        if (rawMessage.includes('database')) {
            return (t as any)('db_access_error') || rawMessage;
        }

        return t(fallbackKey, { error: rawMessage }) || rawMessage;
    };

    return { getErrorMessage };
};
