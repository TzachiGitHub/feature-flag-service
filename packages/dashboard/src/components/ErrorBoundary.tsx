import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-primary inline-flex items-center gap-2"
              aria-label="Try again"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            {this.state.error && (
              <div className="mt-4">
                <button
                  onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} technical details
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 text-xs text-red-400/70 bg-slate-950 rounded p-3 text-left overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error state component for API errors
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 max-w-md w-full text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center mb-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        {message && <p className="text-sm text-slate-400 mb-4">{message}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary inline-flex items-center gap-2 text-sm"
            aria-label={retryLabel}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
