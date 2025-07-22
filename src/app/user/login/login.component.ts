import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { AuthenticationService } from '../../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordRequestModalComponent } from '../forgot-password-modal/forgot-password-modal.component';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { ResendConfirmationEmailModalComponent } from '../resend-email-confirmation-modal/resend-confirmation-email-modal.component';

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
  ],
})
export class LoginComponent implements OnDestroy {
  private authService = inject(AuthenticationService);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loginValid = signal<boolean>(true);
  loading = signal<boolean>(false);

  loginSubscription: Subscription | undefined;

  forgotPassword(): void {
    const dialogRef = this.matDialog.open(ForgotPasswordRequestModalComponent, {
      width: '400px',
      height: 'auto',
    });
  }

  resendConfirmationEmail(): void {
    const dialogRef = this.matDialog.open(ResendConfirmationEmailModalComponent, {
      width: '400px',
      height: 'auto',
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginValid.set(true);
      this.loading.set(true);
      this.loginSubscription = this.authService
        .login(this.loginForm.value)
        .pipe(
          take(1)
        ).subscribe({
          next: (data: { token: string }) => {
            this.loading.set(false);
            if (data.token == '') {
              this.loginValid.set(false);
            } else {
              this.loginValid.set(true);
              this.authService.saveToken(data.token);
              this.authService.userLoggedIn.next(true);
              this.router.navigate(['/']);
            }
          },
          error: () => {
            this.loading.set(false);
          }
        })
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.loginSubscription?.unsubscribe();
  }
}
