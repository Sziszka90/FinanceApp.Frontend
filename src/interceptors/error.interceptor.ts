import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError, Observable } from 'rxjs';
import { ErrorModalComponent } from '../app/shared/error-modal/error-modal.component';
import { TOKEN_KEY } from 'src/models/Constants/token.const';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const matDialog = inject(MatDialog);
  const router = inject(Router);

  return next(req).pipe(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catchError((error: any) => { // ESLint disable: HTTP error objects have dynamic structure
      console.error('HTTP Error caught by interceptor:', error);

      switch (error.status) {
        case 400:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: error.error.message ?? error.error.error ?? error.message ?? error, details: error.error?.details ?? '' }
          });
          break;

        case 401:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: error.error.message ??
                error.error.error ??
                error.message ??
                error, details: error.error?.details ?? 'Unknown error occurred' }
          });
          localStorage.removeItem(TOKEN_KEY);
          router.navigateByUrl('/login');
          break;

        case 403:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: error.error.message ??
                error.error.error ??
                error.message ??
                error, details: error.error?.details ?? 'Unknown error occurred' }
          });
          break;

        case 404:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: error.error.message ?? error.error.error ?? error.message ?? error, details: error.error?.details ?? '' }
          });
          break;

        case 500:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: 'Server error occurred. Please try again later.', details: error.error?.details ?? '' }
          });
          break;

        case 0:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: 'Unable to connect to the server. Please check your connection.', details: 'Network Error' }
          });
          break;

        default:
          matDialog.open(ErrorModalComponent, {
            width: '50rem',
            data: { message: error.error.message ?? error.error.error ?? error.message ?? 'An unexpected error occurred', details: error.error?.details ?? '' }
          });
          break;
      }

      return throwError(() => ({ ...error.error, handled: true }));
    })
  );
};
