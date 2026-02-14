import React from 'react';
import { render, screen } from '@testing-library/react';
import { FlagContext, FlagContextValue } from '../context';
import { Feature } from '../components';

function Wrapper({ value, children }: { value: FlagContextValue; children: React.ReactNode }) {
  return <FlagContext.Provider value={value}>{children}</FlagContext.Provider>;
}

const readyCtx = (flags: Record<string, any>): FlagContextValue => ({
  client: null,
  flags,
  ready: true,
});

describe('Feature', () => {
  it('renders children when flag is truthy', () => {
    render(
      <Wrapper value={readyCtx({ 'dark-mode': true })}>
        <Feature flag="dark-mode">
          <span data-testid="child">Dark</span>
        </Feature>
      </Wrapper>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('does not render when flag is falsy', () => {
    render(
      <Wrapper value={readyCtx({ 'dark-mode': false })}>
        <Feature flag="dark-mode">
          <span data-testid="child">Dark</span>
        </Feature>
      </Wrapper>
    );
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('renders with match prop', () => {
    render(
      <Wrapper value={readyCtx({ version: 'v2' })}>
        <Feature flag="version" match="v2">
          <span data-testid="v2">V2</span>
        </Feature>
      </Wrapper>
    );
    expect(screen.getByTestId('v2')).toBeTruthy();
  });

  it('renders fallback when match fails', () => {
    render(
      <Wrapper value={readyCtx({ version: 'v1' })}>
        <Feature flag="version" match="v2" fallback={<span data-testid="fallback">V1</span>}>
          <span data-testid="v2">V2</span>
        </Feature>
      </Wrapper>
    );
    expect(screen.queryByTestId('v2')).toBeNull();
    expect(screen.getByTestId('fallback')).toBeTruthy();
  });

  it('uses defaultValue when flag missing', () => {
    render(
      <Wrapper value={readyCtx({})}>
        <Feature flag="missing" defaultValue={false}>
          <span data-testid="child">Show</span>
        </Feature>
      </Wrapper>
    );
    expect(screen.queryByTestId('child')).toBeNull();
  });
});
