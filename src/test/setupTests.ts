import { vi } from "vitest";


vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));