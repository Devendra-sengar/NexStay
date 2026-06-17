import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'There was an error communicating with the server. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-status-error/5 border border-status-error/15 rounded-xl max-w-lg mx-auto my-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-status-error/10 text-status-error mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-text-muted text-sm max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary flex items-center justify-center gap-2 text-sm text-status-error border-status-error/30 hover:bg-status-error/10"
        >
          <RotateCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
