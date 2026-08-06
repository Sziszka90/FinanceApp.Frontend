import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BaseComponent } from './base-component';
import { ComponentErrorService } from 'src/services/component-error.service';

class MockErrorService {
  public errorMessage = signal('');
  public hasError = signal(false);

  showError(message: string): void {
    this.errorMessage.set(message);
    this.hasError.set(true);
  }

  clearError(): void {
    this.errorMessage.set('');
    this.hasError.set(false);
  }

  showSuccess(): void {
    return;
  }

  handleError(error: unknown): void {
    this.errorMessage.set(String(error));
    this.hasError.set(true);
  }
}

class TestComponent extends BaseComponent {
  public setLoadingState(value: boolean): void {
    this.setLoading(value);
  }

  public getLoadingState(): boolean {
    return this.loading();
  }

  public showErrorPublic(message: string): void {
    this.showError(message);
  }

  public getErrorMessage(): string | null {
    return this.errorHandler.errorMessage();
  }

  public clearErrorPublic(): void {
    this.clearError();
  }

  public showSuccessPublic(message: string): void {
    this.showSuccess(message);
  }

  public handleErrorPublic(error: unknown, context: string): void {
    this.handleError(error, context);
  }

  public getDestroy$() {
    return this.destroy$;
  }
}

describe('BaseComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ComponentErrorService, useClass: MockErrorService },
        TestComponent
      ]
    });
    component = TestBed.inject(TestComponent);
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('sets and reads loading state', () => {
    component.setLoadingState(true);
    expect(component.getLoadingState()).toBeTrue();
    component.setLoadingState(false);
    expect(component.getLoadingState()).toBeFalse();
  });

  it('shows and clears errors', () => {
    component.showErrorPublic('Test error');
    expect(component.getErrorMessage()).toBe('Test error');
    component.clearErrorPublic();
    expect(component.getErrorMessage()).toBe('');
  });

  it('delegates success and contextual errors', () => {
    spyOn((component as any).errorHandler, 'showSuccess');
    spyOn((component as any).errorHandler, 'handleError');

    component.showSuccessPublic('Success!');
    component.handleErrorPublic('err', 'context');

    expect((component as any).errorHandler.showSuccess).toHaveBeenCalledWith('Success!');
    expect((component as any).errorHandler.handleError).toHaveBeenCalledWith('err', 'context');
  });

  it('clears errors and completes destroy state on destruction', () => {
    spyOn<any>(component, 'clearError');
    spyOn(component.getDestroy$(), 'next');
    spyOn(component.getDestroy$(), 'complete');

    component.ngOnDestroy();

    expect((component as any).clearError).toHaveBeenCalled();
    expect(component.getDestroy$().next).toHaveBeenCalled();
    expect(component.getDestroy$().complete).toHaveBeenCalled();
  });
});
