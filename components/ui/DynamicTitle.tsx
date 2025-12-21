
import React, { useEffect } from 'react';
import { AppSettings, Campaign } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface DynamicTitleProps {
    settings?: AppSettings;
    campaign?: Campaign | null;
    pageName?: string;
}

export const DynamicTitle: React.FC<DynamicTitleProps> = ({ settings, campaign, pageName }) => {
    const { t } = useLanguage();

    useEffect(() => {
        const baseSuffix = `🌱 ${t('growth_competition')}`;
        const compName = settings?.competition_name || campaign?.name || "";

        let newTitle = baseSuffix;

        if (compName && pageName) {
            newTitle = `${compName} - ${pageName} | ${baseSuffix}`;
        } else if (pageName) {
            newTitle = `${pageName} | ${baseSuffix}`;
        } else if (compName) {
            newTitle = `${compName} | ${baseSuffix}`;
        }

        if (document.title !== newTitle) {
            document.title = newTitle;
        }
    }, [settings?.competition_name, campaign?.name, pageName, t]);

    return null;
};
