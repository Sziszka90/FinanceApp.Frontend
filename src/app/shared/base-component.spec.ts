import { TestBed } from '@angular/core/testing';
import { BaseComponent } from './base-component';
import { FormGroup, FormControl } from '@angular/forms';
import { FormValidationService } from 'src/services/form-validation.service';
import { ComponentErrorService } from 'src/services/component-error.service';

class MockErrorService {
  public errorMessage: string | null = null;
  public hasError = false;
  showError(msg: string) { this.errorMessage = msg; this.hasError = true; }
  clearError() { this.errorMessage = null; this.hasError = false; }
  showSuccess(msg: string) { /* no-op */ }
  handleError(error: unknown, context: string) { this.errorMessage = String(error); this.hasError = true; }
  snackBar: any;
  getErrorMessage() { return this.errorMessage; }
  setError(msg: string) { this.errorMessage = msg; }
}
class MockValidationService {
  validateForm(form: FormGroup) {
    const isValid = !!form.get('field')?.value;
    return {
      isValid,
      summary: isValid ? '' : 'Validation failed',
    };
  }
  hasFieldError() { return false; }
  getFieldErrorMessage() { return ''; }
  getAllFormErrors() { return {}; }
  markAllFieldsAsTouched() { /* no-op */ }
  defaultMessages: any;
  getValidationSummary() { return ''; }
  hasFormErrors() { return false; }
  getFirstFormError() { return ''; }
  getAllFieldErrors() { return {}; }
  getFieldErrors() { return {}; }
}

class TestComponent extends BaseComponent {
  constructor() {
    super();
    this.formGroup = new FormGroup({ field: new FormControl('') });
  }
  public setLoadingState(val: boolean) { this.setLoading(val); }
  public getLoadingState() { return this.loading(); }
  public showErrorPublic(msg: string) { this.showError(msg); }
  public getErrorMessage() { return this.errorHandler.errorMessage; }
  public clearErrorPublic() { this.clearError(); }
  public validateFormPublic() { return this.validateForm(); }
  public markAllFieldsAsTouchedPublic() { this.markAllFieldsAsTouched(); }
  public resetFormPublic() { this.resetForm(); }
  public showSuccessPublic(msg: string) { this.showSuccess(msg); }
  public handleErrorPublic(error: unknown, context: string) { this.handleError(error, context); }
  public getFormValuePublic() { return this.getFormValue(); }
  public getFieldValuePublic(fieldName: string) { return this.getFieldValue(fieldName); }
  public setFieldValuePublic(fieldName: string, value: unknown) { this.setFieldValue(fieldName, value); }
  public patchFormValuesPublic(values: { [key: string]: unknown }) { this.patchFormValues(values); }
  public disableFormPublic() { this.disableForm(); }
  public enableFormPublic() { this.enableForm(); }
  public getDestroy$() { return this.destroy$; }
  public clearErrorSpy() { return this.clearError(); }
}

describe('BaseComponent', () => {
  let component: TestComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FormValidationService, useClass: MockValidationService },
        { provide: ComponentErrorService, useClass: MockErrorService },
        TestComponent
      ]
    });
    component = TestBed.inject(TestComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set and get loading state', () => {
    component.setLoadingState(true);
    expect(component.getLoadingState()).toBeTrue();
    component.setLoadingState(false);
    expect(component.getLoadingState()).toBeFalse();
  });

  it('should show and clear error message', () => {
    component.showErrorPublic('Test error');
    expect(component.getErrorMessage()).toBe('Test error');
    component.clearErrorPublic();
    expect(component.getErrorMessage()).toBeNull();
  });

  it('should validate form and set error if invalid', () => {
    // Make form invalid
    component.formGroup?.get('field')?.setValue('');
    const valid = component.validateFormPublic();
    expect(valid).toBeFalse();
    expect(component.getErrorMessage()).toContain('Validation failed');
  });

  it('should validate form and not set error if valid', () => {
    // Make form valid
    component.formGroup?.get('field')?.setValue('valid');
    component.formGroup?.get('field')?.setErrors(null);
    const valid = component.validateFormPublic();
    expect(valid).toBeTrue();
  });

  it('should mark all fields as touched', () => {
    spyOn((component as any).formValidator, 'markAllFieldsAsTouched');
    component.markAllFieldsAsTouchedPublic();
    expect((component as any).formValidator.markAllFieldsAsTouched).toHaveBeenCalledWith(component.formGroup);
  });

  it('should reset form', () => {
    const form = component.formGroup!;
    form.markAsTouched();
    form.markAsDirty();
    form.setValue({ field: 'value' });
    component.resetFormPublic();
    expect(form.pristine).toBeTrue();
    expect(form.untouched).toBeTrue();
    expect(form.get('field')?.value).toBeNull();
  });

  it('should show success message', () => {
    spyOn((component as any).errorHandler, 'showSuccess');
    component.showSuccessPublic('Success!');
    expect((component as any).errorHandler.showSuccess).toHaveBeenCalledWith('Success!');
  });

  it('should handle error', () => {
    spyOn((component as any).errorHandler, 'handleError');
    component.handleErrorPublic('err', 'context');
    expect((component as any).errorHandler.handleError).toHaveBeenCalledWith('err', 'context');
  });

  it('should get form value', () => {
    component.formGroup?.get('field')?.setValue('test');
    expect(component.getFormValuePublic()).toEqual({ field: 'test' });
  });

  it('should get field value', () => {
    component.formGroup?.get('field')?.setValue('abc');
    expect(component.getFieldValuePublic('field')).toBe('abc');
    expect(component.getFieldValuePublic('nonexistent')).toBeNull();
  });

  it('should set field value', () => {
    component.setFieldValuePublic('field', 'xyz');
    expect(component.formGroup?.get('field')?.value).toBe('xyz');
  });

  it('should patch form values', () => {
    component.patchFormValuesPublic({ field: 'patched' });
    expect(component.formGroup?.get('field')?.value).toBe('patched');
  });

  it('should disable and enable form', () => {
    component.disableFormPublic();
    expect(component.formGroup?.disabled).toBeTrue();
    component.enableFormPublic();
    expect(component.formGroup?.enabled).toBeTrue();
  });

  it('should call ngOnDestroy and clear error', () => {
    spyOn<any>(component, 'clearError');
    spyOn(component.getDestroy$(), 'next');
    spyOn(component.getDestroy$(), 'complete');
    component.ngOnDestroy();
    expect((component as any).clearError).toHaveBeenCalled();
    expect(component.getDestroy$().next).toHaveBeenCalled();
    expect(component.getDestroy$().complete).toHaveBeenCalled();
  });
});
