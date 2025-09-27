import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, Observable, switchMap } from 'rxjs';
import { TokenApiService } from 'src/services/token.api.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const authApi = inject(TokenApiService);

  const isRefreshRequest = req.url.includes('/refresh');
  const isRetried = req.headers.has('X-Refresh-Attempted');

  return next(req).pipe(
    catchError((error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('HTTP Error caught by interceptor:', error);

      const errorWithUrl = { ...error, url: req.url };

      if (error.status === 401 && !isRefreshRequest && !isRetried) {
        const retriedReq = req.clone({ setHeaders: { 'X-Refresh-Attempted': 'true' } });
        return authApi.refreshToken().pipe(
          switchMap(() => next(retriedReq)),
          catchError(() => {
            if (!req.url.includes('api/v1/users') && !req.url.includes('api/v1/token/refresh')) {
              router.navigateByUrl('/login');
              return throwError(() => errorWithUrl);
            }
            return throwError(() => errorWithUrl);
          })
        );
      }

      if (error.status === 503) {
        console.error('Service Unavailable:', error);
      }

      return throwError(() => errorWithUrl);
    })
  );
};

