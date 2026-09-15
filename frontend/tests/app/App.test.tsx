import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/app/App';
vi.mock('../../src/app/rename', () => ({ Rename: () => <div data-testid="rename-screen" /> }));
describe('App', () => {
  it('rename画面を配置する', () => {
    render(<App />);
    expect(screen.getAllByTestId('rename-screen')).toHaveLength(1);
  });
});
