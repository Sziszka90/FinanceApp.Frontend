import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from 'src/app/shared/base-component';

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

  override formGroup: FormGroup = this.fb.group({
    Email: ['', [Validators.required, Validators.email]]
  });

  override customValidationMessages = {
    Email: {
      required: 'Email is required',
      email: 'Please provide a valid email address'
    }
  };

  onSubmit(): void {
    if (this.isFormValid()) {
      const email = this.getFieldValue<string>('Email') || '';

      this.executeWithLoading(
        this.userApiService.resendConfirmationEmail(email),
        undefined,
        'Error sending email confirmation'
      ).subscribe({
        next: (result: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          this.showSuccess(result?.Message || 'Confirmation email sent successfully');
          this.matDialogRef.close();
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
