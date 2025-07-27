import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ComponentErrorService } from './component-error.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private errorService = inject(ComponentErrorService);

  handleError(error: any): void {
    console.error('Global error caught:', error);

    if (error instanceof Error || error?.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.message || error.error?.message);
      this.errorService.handleError(error, 'Application Error');
    } else {
      console.error('Unhandled error:', error);
      this.errorService.showError('An unexpected error occurred. Please refresh the page.');
    }
  }
}
