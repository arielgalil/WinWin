import { render } from '@testing-library/react';
import { AiSettings } from '../AiSettings';
import { vi, describe, it, expect } from 'vitest';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';

// Mock dependencies
vi.mock('../../../hooks/useCompetitionData', () => ({
  useCompetitionData: () => ({
    updateSettings: vi.fn(),
  }),
}));

describe('AiSettings', () => {
  it('renders without crashing', () => {
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <AiSettings settings={{} as any} onRefresh={() => {}} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );
  });
});
