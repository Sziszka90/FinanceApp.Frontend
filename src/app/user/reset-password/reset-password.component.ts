import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from '../../shared/base-component';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { ErrorTrackingService } from 'src/services/error-tracking.service';

@Component({
  selector: 'reset-password',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent extends BaseComponent implements OnInit {
  private router = inject(Router);
  private userApiService = inject(UserApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private errorTracking = inject(ErrorTrackingService);

  private token = '';

  resetPasswordValid = signal<boolean>(true);

  override formGroup: FormGroup = this.fb.group({
    password: [
      '',
      [
        Validators.required,
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
        Validators.minLength(8)
      ]
    ],
    confirmPassword: [
      '',
      [
        Validators.required,
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
        Validators.minLength(8)
      ]
    ]
  },
  { validators: this.passwordsMatchValidator }
  );

  override customValidationMessages = {
    password: {
      required: 'Password is required',
      minlength: 'Minimum 8 characters required',
      pattern: 'Password must include at least one uppercase letter, one number, and one special character'
    },
    confirmPassword: {
      required: 'Confirm password is required',
      minlength: 'Minimum 8 characters required',
      pattern: 'Password must include at least one uppercase letter, one number, and one special character'
    }
  };

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.token = params.get('token') ?? '';
    });
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.resetPasswordValid.set(true);
      const password = this.getFieldValue<string>('password') || '';

      this.executeWithLoading(
        this.userApiService.updatePassword({ password: password, token: this.token }),
        'Password reset successfully',
        'Failed to reset password'
      ).subscribe({
        next: () => {
          this.resetPasswordValid.set(true);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.resetPasswordValid.set(false);
          // Mark error as handled by component to prevent fallback snackbar
          this.errorTracking.markAsHandled(error);
          // Error is already handled by executeWithLoading
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }
}
