import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[200px] flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-center">
              <div className="text-red-400 text-lg font-bold mb-2">Something went wrong</div>
              <div className="text-red-300 text-sm">Please refresh the page or try again later</div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left text-xs text-red-200">
                  <summary>Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}