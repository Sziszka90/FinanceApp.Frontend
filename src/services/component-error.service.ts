import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ComponentErrorService {
  private snackBar = inject(MatSnackBar);

  showError(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: 'error-snackbar'
    });
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: 'success-snackbar'
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: 'warning-snackbar'
    });
  }

  getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    return error?.error?.message || 
           error?.message || 
           error?.error || 
           'An unexpected error occurred';
  }

  handleError(error: any, context?: string): void {
    const message = this.getErrorMessage(error);
    const displayMessage = context ? `${context}: ${message}` : message;
    this.showError(displayMessage);
  }
}
