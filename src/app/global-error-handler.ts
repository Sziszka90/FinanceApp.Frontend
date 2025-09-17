import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ComponentErrorService } from 'src/services/component-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
// eslint-disable-next-line no-unused-vars
  constructor(private injector: Injector) {}

  handleError(error: string): void {
    const errorHandler = this.injector.get(ComponentErrorService);
    errorHandler.showError(error);
    console.error(error);
  }
}
