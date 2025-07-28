import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from 'src/app/shared/base-component';
import { ErrorTrackingService } from 'src/services/error-tracking.service';

@Component({
  selector: 'resend-confirmation-email-modal',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './resend-confirmation-email-modal.component.html',
  styleUrl: './resend-confirmation-email-modal.component.scss'
})
export class ResendConfirmationEmailModalComponent extends BaseComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ResendConfirmationEmailModalComponent>);
  private fb = inject(FormBuilder);
  private errorTracking = inject(ErrorTrackingService);

  override formGroup: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  resendEmailValid = signal<boolean>(true);

  override customValidationMessages = {
    email: {
      required: 'Email is required',
      email: 'Please provide a valid email address'
    }
  };

  onSubmit(): void {
    if (this.isFormValid()) {
      this.resendEmailValid.set(true);
      const email = this.getFieldValue<string>('email') || '';

      this.executeWithLoading(
        this.userApiService.resendConfirmationEmail(email),
        undefined,
        'Error sending email confirmation'
      ).subscribe({
        next: (result: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          this.resendEmailValid.set(true);
          this.showSuccess(result?.message || 'Confirmation email sent successfully');
          this.matDialogRef.close();
        },
        error: (error) => {
          this.resendEmailValid.set(false);
          // Mark error as handled by component to prevent fallback snackbar
          this.errorTracking.markAsHandled(error);
          // Error is already handled by executeWithLoading
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  onCancel(): void {
    this.matDialogRef.close();
  }
}
