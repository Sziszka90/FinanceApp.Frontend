import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ComponentErrorService {
  private snackBar = inject(MatSnackBar);

  public hasError: WritableSignal<boolean> = signal(false);
  public errorMessage: WritableSignal<string> = signal('');

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
      const err = error as Record<string, unknown>;
      const body = err['error'];
      const bodyRecord = body && typeof body === 'object' ? body as Record<string, unknown> : null;
      const nestedError = bodyRecord?.['error'];
      const nestedErrorRecord = nestedError && typeof nestedError === 'object'
        ? nestedError as Record<string, unknown>
        : null;
      return (
        (bodyRecord?.['message'] as string | undefined) ??
        (nestedErrorRecord?.['message'] as string | undefined) ??
        (nestedError as string | undefined) ??
        (err['message'] as string | undefined) ??
        'An unexpected error occurred'
      );
    }

    return 'An unexpected error occurred';
  }

  handleError(error: unknown, context?: string): void {
    const message = this.getErrorMessage(error);
    this.setError(message);
    const displayMessage = context ? `${context}: ${message}` : message;
    this.showError(displayMessage);
  }

  clearError(): void {
    this.hasError.set(false);
    this.errorMessage.set('');
  }

  setError(message: string): void {
    this.hasError.set(true);
    this.errorMessage.set(message);
  }
}
