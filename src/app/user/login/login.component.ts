import { Component, inject } from '@angular/core';
import { AuthenticationService } from '../../../services/authentication.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  imports: [
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

  override formGroup: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
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

  async onSubmit(): Promise<void> {
    if (this.formGroup.valid) {
      const result = await this.authService.loginAsync(this.formGroup.value);

      if (result.token === '') {
        this.showError('Invalid login credentials');
      } else {
        this.authService.saveToken(result!.token);
        this.authService.userLoggedIn.next(true);
        this.router.navigate(['/']);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
}
