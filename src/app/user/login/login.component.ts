import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { AuthenticationService } from '../../../services/authentication.service';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordRequestModalComponent } from '../forgot-password-modal/forgot-password-modal.component';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { ResendConfirmationEmailModalComponent } from '../resend-email-confirmation-modal/resend-confirmation-email-modal.component';
import { BaseComponent } from '../../shared/base-component';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormField, FormRoot, RouterLink, LoaderComponent]
})
export class LoginComponent extends BaseComponent {
  private authService = inject(AuthenticationService);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  readonly loginModel = signal({
    email: '',
    password: ''
  });

  readonly loginForm = form(this.loginModel, path => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
  }, {
    submission: {
      action: async () => {
        this.setLoading(true);
        try {
          await this.authService.loginAsync(this.loginModel());
          await this.router.navigate(['/']);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Login failed');
        }
      }
    }
  });

  forgotPassword(): void {
    this.matDialog.open(ForgotPasswordRequestModalComponent, {
      width: '600px',
      height: 'auto'
    });
  }

  resendConfirmationEmail(): void {
    this.matDialog.open(ResendConfirmationEmailModalComponent, {
      width: '600px',
      height: 'auto'
    });
  }

}
