import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ComponentErrorService } from './component-error.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private errorService = inject(ComponentErrorService);

  handleError(error: unknown): void {
    console.error('Global error caught:', error);

    // Check if this error was already handled by components or interceptors
    const errorObj = error as Record<string, unknown>;
    if (errorObj?.['handled'] || (errorObj?.['error'] as Record<string, unknown>)?.['handled']) {
      console.warn('Error already handled by component/interceptor, skipping global handler');
      return;
    }

    if (error instanceof Error || (errorObj?.['error'] instanceof ErrorEvent)) {
      const message = error instanceof Error ? error.message :
        (errorObj?.['error'] as ErrorEvent)?.message || 'Unknown error';
      console.error('Client-side error:', message);
      this.errorService.handleError(error, 'Application Error');
    } else {
      console.error('Unhandled error:', error);
      this.errorService.showError('An unexpected error occurred. Please refresh the page.');
    }
  }
}
