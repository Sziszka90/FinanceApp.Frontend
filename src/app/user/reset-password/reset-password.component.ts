
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from '../../shared/base-component';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'reset-password',
  imports: [ReactiveFormsModule, LoaderComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent extends BaseComponent implements OnInit {
  private router = inject(Router);
  private userApiService = inject(UserApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

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
      const password = this.getFieldValue<string>('password') || '';

      this.setLoading(true);

      this.userApiService.updatePassword({ password: password, token: this.token }).subscribe({
        next: () => {
          this.setLoading(false);
          this.showSuccess('Password reset successful! Please log in with your new password.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.setLoading(false);
          this.handleError(error, 'Failed to reset password');
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }
}