import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormField, FormRoot, form, minLength, pattern, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, takeUntil } from 'rxjs';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from '../../shared/base-component';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'reset-password',
  imports: [FormField, FormRoot, LoaderComponent],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent extends BaseComponent implements OnInit {
  private router = inject(Router);
  private userApiService = inject(UserApiService);
  private route = inject(ActivatedRoute);
  private token = '';

  readonly resetPasswordModel = signal({
    password: '',
    confirmPassword: ''
  });

  readonly resetPasswordForm = form(this.resetPasswordModel, path => {
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, { message: 'Minimum 8 characters required' });
    pattern(path.password, /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message: 'Password must include at least one uppercase letter, one number, and one special character'
    });
    required(path.confirmPassword, { message: 'Confirm password is required' });
    minLength(path.confirmPassword, 8, { message: 'Minimum 8 characters required' });
    pattern(path.confirmPassword, /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message: 'Password must include at least one uppercase letter, one number, and one special character'
    });
    validate(path.confirmPassword, ({ value, valueOf }) => {
      if (!value() || value() === valueOf(path.password)) {
        return undefined;
      }

      return { kind: 'passwordsMismatch', message: 'Passwords do not match.' };
    });
  }, {
    submission: {
      action: async () => {
        this.setLoading(true);
        try {
          await firstValueFrom(this.userApiService.updatePassword({
            password: this.resetPasswordModel().password,
            token: this.token
          }));
          this.setLoading(false);
          this.showSuccess('Password reset successful! Please log in with your new password.');
          await this.router.navigate(['/login']);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Failed to reset password');
        }
      }
    }
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.token = params.get('token') ?? '';
    });
  }

  hasPasswordMismatch(): boolean {
    return this.resetPasswordForm.confirmPassword().errors().some(error => error.kind === 'passwordsMismatch');
  }
}
