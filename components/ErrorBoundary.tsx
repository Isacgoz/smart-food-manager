import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../services/sentry';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component with Sentry Integration
 * 
 * Catches React errors and reports them to Sentry
 * Displays a user-friendly error message
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Capture error in Sentry with component stack
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 text-center">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
              Une erreur est survenue
            </h1>
            
            <p className="text-slate-400 mb-6">
              L'application a rencontré un problème inattendu. 
              L'erreur a été automatiquement signalée à notre équipe.
            </p>

            {import.meta.env.VITE_APP_ENV === 'development' && this.state.error && (
              <div className="bg-slate-800 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-400 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-400">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Réessayer
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
