import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

interface CanvasErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

export function CanvasErrorFallback({ error, onRetry }: CanvasErrorFallbackProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-paper">
      <div className="text-center p-8 max-w-md bg-panel rounded-lg border border-line">
        <AlertTriangleIcon className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-ink mb-2">Canvas Error</h2>
        <p className="text-sm text-ink-secondary mb-4">
          Something went wrong while rendering the floor plan. Your data is safe.
        </p>
        {error && (
          <p className="text-xs text-ink-faint mb-4 font-mono bg-hover p-2 rounded">
            {error.message}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-ink-inverse rounded hover:bg-teal-deep transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
