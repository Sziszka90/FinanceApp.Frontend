import { Component, inject, signal } from '@angular/core';
import { AuthenticationService } from '../../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordRequestModalComponent } from '../forgot-password-modal/forgot-password-modal.component';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { ResendConfirmationEmailModalComponent } from '../resend-email-confirmation-modal/resend-confirmation-email-modal.component';
import { BaseComponent } from '../../shared/base-component';
import { ErrorTrackingService } from 'src/services/error-tracking.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    LoaderComponent
  ]
})
export class LoginComponent extends BaseComponent {
  private authService = inject(AuthenticationService);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private errorTracking = inject(ErrorTrackingService);

  override formGroup: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loginValid = signal<boolean>(true);

  // Remove manual subscription management - BaseComponent handles this
  // loginSubscription: Subscription | undefined;

  forgotPassword(): void {
    this.matDialog.open(ForgotPasswordRequestModalComponent, {
      width: '400px',
      height: 'auto'
    });
  }

  resendConfirmationEmail(): void {
    this.matDialog.open(ResendConfirmationEmailModalComponent, {
      width: '400px',
      height: 'auto'
    });
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      this.loginValid.set(true);

      this.executeWithLoading(
        this.authService.login(this.formGroup.value),
        undefined, // no success message
        'Login failed'
      ).subscribe({
        next: (data: { token: string }) => {
          if (data.token === '') {
            this.loginValid.set(false);
            this.showError('Invalid login credentials');
          } else {
            this.loginValid.set(true);
            this.authService.saveToken(data.token);
            this.authService.userLoggedIn.next(true);
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          this.loginValid.set(false);
          // Mark error as handled by component to prevent fallback snackbar
          this.errorTracking.markAsHandled(error);
          // Error is already handled by executeWithLoading
        }
      });
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
}
