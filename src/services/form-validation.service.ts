import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

export interface ValidationMessage {
  [key: string]: string;
}

export interface FieldValidationMessages {
  [fieldName: string]: ValidationMessage;
}

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  private defaultMessages: ValidationMessage = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minlength: 'This field must be at least {requiredLength} characters long',
    maxlength: 'This field cannot exceed {requiredLength} characters',
    min: 'Value must be at least {min}',
    max: 'Value cannot exceed {max}',
    pattern: 'Please enter a valid format',
    custom: 'Invalid input'
  };

  hasFieldError(form: FormGroup, fieldName: string, errorType?: string): boolean {
    const field = form.get(fieldName);
    if (!field) {return false;}

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }

    return field.invalid && (field.dirty || field.touched);
  }

  getFieldErrorMessage(
    form: FormGroup,
    fieldName: string,
    customMessages?: FieldValidationMessages
  ): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) {return '';}

    const fieldCustomMessages = customMessages?.[fieldName] || {};
    const errors = field.errors;

    for (const errorType in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, errorType)) {
        let message = fieldCustomMessages[errorType] ||
                     this.defaultMessages[errorType] ||
                     this.defaultMessages['custom'];

        message = this.replacePlaceholders(message, errors[errorType]);

        const capitalizedFieldName = this.capitalizeFieldName(fieldName);
        message = message.replace(/this field/gi, capitalizedFieldName);

        return message;
      }
    }

    return '';
  }

  getAllFormErrors(
    form: FormGroup,
    customMessages?: FieldValidationMessages
  ): { [fieldName: string]: string } {
    const formErrors: { [fieldName: string]: string } = {};

    Object.keys(form.controls).forEach(fieldName => {
      const errorMessage = this.getFieldErrorMessage(form, fieldName, customMessages);
      if (errorMessage) {
        formErrors[fieldName] = errorMessage;
      }
    });

    return formErrors;
  }

  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(fieldName => {
      const control = form.get(fieldName);
      if (control) {
        control.markAsTouched();

        if (control instanceof FormGroup) {
          this.markAllFieldsAsTouched(control);
        }
      }
    });
  }

  getValidationSummary(
    form: FormGroup,
    customMessages?: FieldValidationMessages,
    separator = ', '
  ): string {
    const errors = this.getAllFormErrors(form, customMessages);
    return Object.values(errors).join(separator);
  }

  hasFormErrors(form: FormGroup): boolean {
    return form.invalid && form.touched;
  }

  getFirstFormError(
    form: FormGroup,
    customMessages?: FieldValidationMessages
  ): string {
    const errors = this.getAllFormErrors(form, customMessages);
    const firstError = Object.values(errors)[0];
    return firstError || '';
  }

  validateForm(
    form: FormGroup,
    customMessages?: FieldValidationMessages
  ): {
    isValid: boolean;
    errors: { [fieldName: string]: string };
    summary: string;
  } {
    this.markAllFieldsAsTouched(form);

    const errors = this.getAllFormErrors(form, customMessages);
    const isValid = Object.keys(errors).length === 0;
    const summary = Object.values(errors).join(', ');

    return {
      isValid,
      errors,
      summary
    };
  }

  createCustomValidators() {
    return {
      noWhitespace: (control: AbstractControl): ValidationErrors | null => {
        if (control.value && control.value.trim().length === 0) {
          return { noWhitespace: true };
        }
        return null;
      },

      phoneNumber: (control: AbstractControl): ValidationErrors | null => {
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
        if (control.value && !phoneRegex.test(control.value)) {
          return { phoneNumber: true };
        }
        return null;
      },

      strongPassword: (control: AbstractControl): ValidationErrors | null => {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (control.value && !strongPasswordRegex.test(control.value)) {
          return { strongPassword: true };
        }
        return null;
      }
    };
  }

  private replacePlaceholders(message: string, errorValue: unknown): string {
    if (typeof errorValue === 'object' && errorValue !== null) {
      const errorObj = errorValue as Record<string, unknown>;
      for (const key in errorObj) {
        if (Object.prototype.hasOwnProperty.call(errorObj, key)) {
          message = message.replace(`{${key}}`, String(errorObj[key]));
        }
      }
    }
    return message;
  }

  private capitalizeFieldName(fieldName: string): string {
    const readable = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }
}
