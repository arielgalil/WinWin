import { useCallback, useState } from "react";

type StorageType = "session" | "local";

/**
 * A hook for persisting boolean values to sessionStorage or localStorage.
 * Provides a React state interface with automatic persistence.
 *
 * @param key - The storage key to use
 * @param defaultValue - Default value if no stored value exists
 * @param storage - 'session' for sessionStorage, 'local' for localStorage
 * @returns Tuple of [value, setValue] similar to useState
 */
export function usePersistedBoolean(
    key: string,
    defaultValue = false,
    storage: StorageType = "session",
): [boolean, (value: boolean) => void] {
    const storageApi = storage === "session" ? sessionStorage : localStorage;

    const [value, setValue] = useState<boolean>(() => {
        try {
            const stored = storageApi.getItem(key);
            if (stored === null) return defaultValue;
            return stored === "true";
        } catch {
            return defaultValue;
        }
    });

    const setPersisted = useCallback((newValue: boolean) => {
        try {
            storageApi.setItem(key, newValue ? "true" : "false");
        } catch (e) {
            console.warn(`Failed to persist ${key}:`, e);
        }
        setValue(newValue);
    }, [key, storageApi]);

    return [value, setPersisted];
}
