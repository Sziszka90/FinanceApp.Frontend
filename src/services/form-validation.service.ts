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

        // Replace placeholders with actual values
        message = this.replacePlaceholders(message, errors[errorType]);

        // Capitalize field name in message
        const capitalizedFieldName = this.capitalizeFieldName(fieldName);
        message = message.replace(/this field/gi, capitalizedFieldName);

        return message;
      }
    }

    return '';
  }

  /**
   * Get all validation errors for a form
   */
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

  /**
   * Mark all fields as touched to trigger validation display
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(fieldName => {
      const control = form.get(fieldName);
      if (control) {
        control.markAsTouched();

        // If it's a nested FormGroup, recursively mark as touched
        if (control instanceof FormGroup) {
          this.markAllFieldsAsTouched(control);
        }
      }
    });
  }

  /**
   * Get a summary of all validation errors as a single string
   */
  getValidationSummary(
    form: FormGroup,
    customMessages?: FieldValidationMessages,
    separator = ', '
  ): string {
    const errors = this.getAllFormErrors(form, customMessages);
    return Object.values(errors).join(separator);
  }

  /**
   * Check if form has any validation errors
   */
  hasFormErrors(form: FormGroup): boolean {
    return form.invalid && form.touched;
  }

  /**
   * Get the first validation error found in the form
   */
  getFirstFormError(
    form: FormGroup,
    customMessages?: FieldValidationMessages
  ): string {
    const errors = this.getAllFormErrors(form, customMessages);
    const firstError = Object.values(errors)[0];
    return firstError || '';
  }

  /**
   * Validate form and return formatted error messages
   */
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

  /**
   * Custom validator factory for common patterns
   */
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

  /**
   * Private helper methods
   */
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
    // Convert camelCase to readable format
    const readable = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  }
}
