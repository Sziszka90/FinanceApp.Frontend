import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ComponentErrorService {
  private snackBar = inject(MatSnackBar);

  showError(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: 'error-snackbar'
    });
  }

  showSuccess(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: 'info-snackbar'
    });
  }

  getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      return (errorObj['error'] as Record<string, unknown>)?.['message'] as string ||
             errorObj['message'] as string ||
             errorObj['error'] as string ||
             'An unexpected error occurred';
    }

    return 'An unexpected error occurred';
  }

  handleError(error: unknown, context?: string): void {
    const message = this.getErrorMessage(error);
    const displayMessage = context ? `${context}: ${message}` : message;
    this.showError(displayMessage);
  }
}
