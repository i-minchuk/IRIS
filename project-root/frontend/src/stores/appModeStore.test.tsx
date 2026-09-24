import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAppModeStore, useIsDemo } from './appModeStore';

vi.mock('@/shared/api/meta', () => ({
  getMeta: vi.fn(),
}));

import { getMeta } from '@/shared/api/meta';

function IsDemoComponent() {
  const isDemo = useIsDemo();
  return <div data-testid="is-demo">{isDemo ? 'true' : 'false'}</div>;
}

describe('useAppModeStore', () => {
  beforeEach(() => {
    useAppModeStore.setState({ meta: null, loaded: false });
    vi.clearAllMocks();
  });

  it('initial state: meta is null, loaded is false', () => {
    const state = useAppModeStore.getState();
    expect(state.meta).toBeNull();
    expect(state.loaded).toBe(false);
  });

  it('fetchMeta sets meta and loaded on success', async () => {
    const mockMeta = { mode: 'demo', version: '4.7.0', features: { demo_data_seed: false, exports: true, external_integrations: true, feedback_button: true, demo_banner: false } };
    (getMeta as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockMeta });

    await useAppModeStore.getState().fetchMeta();

    const state = useAppModeStore.getState();
    expect(state.meta).toEqual(mockMeta);
    expect(state.loaded).toBe(true);
  });

  it('fetchMeta sets loaded=true even on error (graceful degradation)', async () => {
    (getMeta as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

    await useAppModeStore.getState().fetchMeta();

    const state = useAppModeStore.getState();
    expect(state.meta).toBeNull();
    expect(state.loaded).toBe(true);
  });

  it('fetchMeta is idempotent (does not refetch if loaded)', async () => {
    const mockMeta = { mode: 'prod', version: '4.7.0', features: { demo_data_seed: false, exports: true, external_integrations: true, feedback_button: true, demo_banner: false } };
    (getMeta as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockMeta });

    await useAppModeStore.getState().fetchMeta();
    expect(getMeta).toHaveBeenCalledTimes(1);

    await useAppModeStore.getState().fetchMeta();
    expect(getMeta).toHaveBeenCalledTimes(1); // still 1
  });
});

describe('useIsDemo', () => {
  beforeEach(() => {
    useAppModeStore.setState({ meta: null, loaded: false });
  });

  it('returns true when mode is demo', () => {
    useAppModeStore.setState({ meta: { mode: 'demo', version: '4.7.0', features: { demo_data_seed: false, exports: true, external_integrations: true, feedback_button: true, demo_banner: false } }, loaded: true });
    render(<IsDemoComponent />);
    expect(screen.getByTestId('is-demo').textContent).toBe('true');
  });

  it('returns false when mode is prod', () => {
    useAppModeStore.setState({ meta: { mode: 'prod', version: '4.7.0', features: { demo_data_seed: false, exports: true, external_integrations: true, feedback_button: true, demo_banner: false } }, loaded: true });
    render(<IsDemoComponent />);
    expect(screen.getByTestId('is-demo').textContent).toBe('false');
  });

  it('returns false when meta is null', () => {
    render(<IsDemoComponent />);
    expect(screen.getByTestId('is-demo').textContent).toBe('false');
  });
});
