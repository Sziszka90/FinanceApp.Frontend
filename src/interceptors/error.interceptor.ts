import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, Observable } from 'rxjs';
import { TOKEN_KEY } from 'src/models/Constants/token.const';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('HTTP Error caught by interceptor:', error);

      const errorWithUrl = { ...error, url: req.url };

      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        router.navigateByUrl('/login');
      }

      return throwError(() => errorWithUrl);
    })
  );
};

