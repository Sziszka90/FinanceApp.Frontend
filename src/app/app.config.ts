import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
  HttpEvent,
  HttpClient
} from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Observable } from 'rxjs';
import { errorInterceptor } from 'src/interceptors/error.interceptor';
import { environment } from '../environments/environment';

export const provideTranslation = () => ({
  defaultLanguage: 'en',
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  }
});

export const provideAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (req.url.includes('llmprocessor/prompt')) {
    const token = environment.llmProcessorToken;
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/translations/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideNativeDateAdapter(),
    importProvidersFrom(BrowserAnimationsModule),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([provideAuthInterceptor, errorInterceptor])
    ),
    importProvidersFrom([TranslateModule.forRoot(provideTranslation())]),
    provideAnimationsAsync()
  ]
};
