import React from 'react';
import { render, screen } from '@testing-library/react';
import { FlagProvider } from '../provider';
import { FlagContext } from '../context';
import { useFlags } from '../hooks';

// Test with bootstrap flags (synchronous ready)
describe('FlagProvider', () => {
  it('renders children', () => {
    render(
      <FlagProvider sdkKey="test-key" context={{ kind: 'user', key: 'u1' }} options={{ offline: true }}>
        <span data-testid="child">Hello</span>
      </FlagProvider>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('provides bootstrap flags immediately', () => {
    function FlagReader() {
      const flags = useFlags();
      return <span data-testid="flags">{JSON.stringify(flags)}</span>;
    }

    render(
      <FlagProvider
        sdkKey="test-key"
        context={{ kind: 'user', key: 'u1' }}
        options={{ bootstrap: { feat: true }, offline: true }}
      >
        <FlagReader />
      </FlagProvider>
    );
    expect(screen.getByTestId('flags').textContent).toBe('{"feat":true}');
  });
});
