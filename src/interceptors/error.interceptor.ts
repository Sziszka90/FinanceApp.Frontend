import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, Observable, switchMap } from 'rxjs';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { AuthenticationApiService } from '../services/authentication.api.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
    const authApi = inject(AuthenticationApiService);

  return next(req).pipe(
    catchError((error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('HTTP Error caught by interceptor:', error);

      const errorWithUrl = { ...error, url: req.url };

      if (error.status === 401) {
        return authApi.refreshToken().pipe(
          switchMap(() => {
            return next(req);
          }),
          catchError(() => {
            router.navigateByUrl('/login');
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

