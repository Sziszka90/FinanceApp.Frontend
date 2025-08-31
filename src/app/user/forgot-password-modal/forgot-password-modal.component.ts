import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from 'src/app/shared/base-component';
import { FieldValidationMessages } from 'src/services/form-validation.service';

@Component({
  selector: 'forgot-password-modal',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.scss'
})
export class ForgotPasswordRequestModalComponent extends BaseComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ForgotPasswordRequestModalComponent>);
  private fb = inject(FormBuilder);

  public override formGroup: FormGroup = this.fb.group({
    Email: ['', [Validators.required, Validators.email]]
  });

  public override customValidationMessages: FieldValidationMessages = {
    Email: {
      required: 'Email address is required',
      email: 'Please enter a valid email address'
    }
  };

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    const email = this.getFieldValue<string>('Email')!;

    this.executeWithLoading(
      this.userApiService.forgotPassword(email),
      'Password reset email sent! Check your inbox.',
      'Sending password reset email'
    ).subscribe({
      next: () => {
        this.matDialogRef.close();
      }
    });
  }

  onCancel(): void {
    this.matDialogRef.close();
  }
}
