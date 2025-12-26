
import { useState, useCallback } from 'react';

interface ConfirmationConfig {
    title: string;
    message: string;
    isDanger?: boolean;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm: () => void;
}

export const useConfirmation = () => {
    const [modalConfig, setModalConfig] = useState<ConfirmationConfig & { isOpen: boolean }>({
        isOpen: false,
        title: '',
        message: '',
        isDanger: false,
        onConfirm: () => { }
    });

    const openConfirmation = useCallback((config: ConfirmationConfig) => {
        setModalConfig({
            ...config,
            isOpen: true
        });
    }, []);

    const closeConfirmation = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Helper for "Confirm and Close" pattern
    const handleConfirm = useCallback(() => {
        modalConfig.onConfirm();
        closeConfirmation();
    }, [modalConfig, closeConfirmation]);

    return {
        modalConfig: {
            ...modalConfig,
            onConfirm: handleConfirm,
            onCancel: closeConfirmation
        },
        openConfirmation,
        closeConfirmation
    };
};
