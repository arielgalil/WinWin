import { render } from '@testing-library/react';
import { AiSettings } from '../AiSettings';
import { describe, it } from 'vitest';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';

describe('AiSettings', () => {
  it('renders without crashing', () => {
    render(
      <LanguageProvider>
        <SaveNotificationProvider>
          <AiSettings settings={{} as any} onRefresh={async () => {}} />
        </SaveNotificationProvider>
      </LanguageProvider>
    );
  });
});
