import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError, Observable, timer } from 'rxjs';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { ErrorTrackingService } from 'src/services/error-tracking.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const errorTracking = inject(ErrorTrackingService);

  return next(req).pipe(
    catchError((error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('HTTP Error caught by interceptor:', error);

      // Add URL to error for tracking
      const errorWithUrl = { ...error, url: req.url };

      // Handle 401 unauthorized - clear token and redirect to login
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        router.navigateByUrl('/login');
      }

      // Check if component will handle this error after a short delay
      timer(200).subscribe(() => {
        if (!errorTracking.isHandled(errorWithUrl)) {
          const errorMessage = getErrorMessage(error);
          snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar',
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });

      return throwError(() => errorWithUrl);
    })
  );
};

// Extract user-friendly error message
function getErrorMessage(error: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Try to get a meaningful error message
  const message = error.error?.message ||
                 error.error?.error ||
                 error.message ||
                 getDefaultErrorMessage(error.status);

  return message;
}

// Get default error messages for different status codes
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 0:
      return 'Network error. Please check your internet connection.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
