import React from 'react';
import { useFlag } from './hooks';
import { FlagProvider, FlagProviderProps } from './provider';
import { FlagContext } from './context';

export interface FeatureProps {
  flag: string;
  defaultValue?: any;
  match?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on a feature flag.
 */
export function Feature({ flag, defaultValue = false, match, fallback = null, children }: FeatureProps) {
  const value = useFlag(flag, defaultValue);

  const isMatch = match !== undefined ? value === match : !!value;

  if (isMatch) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

export interface AsyncFlagProviderProps extends FlagProviderProps {
  loading?: React.ReactNode;
}

/**
 * Like FlagProvider but shows a loading state until SDK is ready.
 */
export function AsyncFlagProvider({ loading = null, children, ...providerProps }: AsyncFlagProviderProps) {
  return (
    <FlagProvider {...providerProps}>
      <AsyncFlagProviderInner loading={loading}>
        {children}
      </AsyncFlagProviderInner>
    </FlagProvider>
  );
}

function AsyncFlagProviderInner({ loading, children }: { loading: React.ReactNode; children: React.ReactNode }) {
  const { ready } = React.useContext(FlagContext);
  if (!ready) return <>{loading}</>;
  return <>{children}</>;
}
