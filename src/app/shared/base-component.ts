import { inject, signal, WritableSignal, OnDestroy, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormValidationService, FieldValidationMessages } from 'src/services/form-validation.service';
import { ComponentErrorService } from 'src/services/component-error.service';
import { Observable, finalize, Subject, tap, catchError, throwError, takeUntil } from 'rxjs';

@Injectable()
export abstract class BaseComponent implements OnDestroy {
  protected formValidator = inject(FormValidationService);
  protected errorHandler = inject(ComponentErrorService);

  formGroup?: FormGroup;
  customValidationMessages?: FieldValidationMessages;

  protected get form(): FormGroup | undefined {
    return this.formGroup;
  }

  public loading: WritableSignal<boolean> = signal(false);

  protected destroy$ = new Subject<void>();

  public hasFieldError(fieldName: string, errorType?: string): boolean {
    if (!this.form) {return false;}
    return this.formValidator.hasFieldError(this.form, fieldName, errorType);
  }

  public getFieldErrorMessage(fieldName: string): string {
    if (!this.form) {return '';}
    return this.formValidator.getFieldErrorMessage(
      this.form,
      fieldName,
      this.customValidationMessages
    );
  }

  protected validateForm(): boolean {
    if (!this.form) {return false;}

    const validationResult = this.formValidator.validateForm(
      this.form,
      this.customValidationMessages
    );

    if (!validationResult.isValid) {
      this.errorHandler.showError(`Please fix the following: ${validationResult.summary}`);
      return false;
    }

    return true;
  }

  protected getFormErrors(): { [fieldName: string]: string } {
    if (!this.form) {return {};}
    return this.formValidator.getAllFormErrors(this.form, this.customValidationMessages);
  }

  protected markAllFieldsAsTouched(): void {
    if (!this.form) {return;}
    this.formValidator.markAllFieldsAsTouched(this.form);
  }

  protected isFormValid(): boolean {
    return this.form?.valid ?? false;
  }

  protected resetForm(): void {
    if (!this.form) {return;}
    this.form.reset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

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

  protected executeWithLoading<T>(
    operation: Observable<T>,
    successMessage?: string,
    errorContext?: string
  ): Observable<T> {
    this.setLoading(true);

    return operation.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        if (successMessage) {
          this.showSuccess(successMessage);
        }
      }),
      catchError((error) => {
        this.handleError(error, errorContext || 'operation');
        const handledError = { ...error, handled: true };
        return throwError(() => handledError);
      }),
      finalize(() => this.setLoading(false))
    );
  }

  protected getFormValue<T = unknown>(): T | null {
    return this.form?.value as T || null;
  }

  protected getFieldValue<T = unknown>(fieldName: string): T | null {
    return this.form?.get(fieldName)?.value || null;
  }

  protected setFieldValue(fieldName: string, value: unknown): void {
    this.form?.get(fieldName)?.setValue(value);
  }

  protected patchFormValues(values: { [key: string]: unknown }): void {
    this.form?.patchValue(values);
  }

  protected isLoading(): boolean {
    return this.loading();
  }

  protected disableForm(): void {
    this.form?.disable();
  }

  protected enableForm(): void {
    this.form?.enable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
