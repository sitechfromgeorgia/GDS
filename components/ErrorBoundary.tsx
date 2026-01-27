import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { COMPANY, getPhoneLink } from "../config";

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
 * Global Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    this.setState({ errorInfo });

    // Here you could also send error to a logging service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.hash = "/";
    window.location.reload();
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              დაფიქსირდა შეცდომა
            </h1>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              სამწუხაროდ, რაღაც არასწორად წარიმართა. გთხოვთ სცადოთ თავიდან ან
              დაბრუნდით მთავარ გვერდზე.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                თავიდან ცდა
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                მთავარი გვერდი
              </button>
            </div>

            {/* Support Info */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              თუ პრობლემა გრძელდება, დაგვიკავშირდით:{" "}
              <a
                href={getPhoneLink()}
                className="text-emerald-600 hover:underline"
              >
                {COMPANY.phoneFormatted}
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for ErrorBoundary with render props pattern
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;
