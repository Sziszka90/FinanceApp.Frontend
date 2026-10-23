import { inject, signal, WritableSignal, OnDestroy, Injectable } from '@angular/core';
import { ComponentErrorService } from 'src/services/component-error.service';
import { Subject } from 'rxjs';

@Injectable()
export abstract class BaseComponent implements OnDestroy {
  protected errorHandler = inject(ComponentErrorService);

  public loading: WritableSignal<boolean> = signal(false);

  public get hasError() { return this.errorHandler.hasError; }
  public get errorMessage() { return this.errorHandler.errorMessage; }

  protected destroy$ = new Subject<void>();

  protected showSuccess(message: string): void {
    this.errorHandler.showSuccess(message);
  }

  protected showError(message: string): void {
    this.errorHandler.showError(message);
  }

  protected handleError(error: unknown, context: string): void {
    this.errorHandler.handleError(error, context);
  }

  protected setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
  }

  protected clearError(): void {
    this.errorHandler.clearError();
  }

  protected isLoading(): boolean {
    return this.loading();
  }

  ngOnDestroy(): void {
    this.clearError();
    this.destroy$.next();
    this.destroy$.complete();
  }
}