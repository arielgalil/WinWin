import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PointsManager } from '../PointsManager';
import { MyClassStatus } from '../MyClassStatus';

// Mock hooks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

vi.mock('../../../hooks/useScoreEntry', () => ({
    useScoreEntry: () => ({
        selectedStudentIds: new Set(),
        filteredStudents: [],
        classes: [],
        settings: {}
    })
}));

vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

describe('Admin Panel Card Width Unification', () => {
    it('PointsManager has correct layout container', () => {
        const { container } = render(<PointsManager user={{ full_name: 'Test' } as any} />);
        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv.className).toMatch(/gap-8|space-y-8/);
        expect(mainDiv.className).not.toContain('max-w-6xl');
    });

    it('MyClassStatus has correct layout container', () => {
        const { container } = render(<MyClassStatus classId="1" classes={[{ id: '1', name: 'Class 1', students: [], score: 0 } as any]} />);
        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv.className).toMatch(/gap-8|space-y-8/);
        expect(mainDiv.className).not.toContain('max-w-6xl');
    });
});
