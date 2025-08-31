import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from '../../shared/base-component';
import { LoaderComponent } from '../../shared/loader/loader.component';

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

  private token = '';

  resetPasswordValid = signal<boolean>(true);

  override formGroup: FormGroup = this.fb.group({
    Password: [
      '',
      [
        Validators.required,
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
        Validators.minLength(8)
      ]
    ],
    ConfirmPassword: [
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
    Password: {
      required: 'Password is required',
      minlength: 'Minimum 8 characters required',
      pattern: 'Password must include at least one uppercase letter, one number, and one special character'
    },
    ConfirmPassword: {
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
    const password = control.get('Password')?.value;
    const confirmPassword = control.get('ConfirmPassword')?.value;

    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const password = this.getFieldValue<string>('Password') || '';

      this.executeWithLoading(
        this.userApiService.updatePassword({ Password: password, Token: this.token }),
        'Password reset successfully',
        'Failed to reset password'
      ).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }
}
