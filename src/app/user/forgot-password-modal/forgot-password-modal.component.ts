import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from 'src/app/shared/base-component';

@Component({
  selector: 'forgot-password-modal',
  imports: [FormField, FormRoot, LoaderComponent],
  templateUrl: './forgot-password-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './forgot-password-modal.component.scss'
})
export class ForgotPasswordRequestModalComponent extends BaseComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ForgotPasswordRequestModalComponent>);
  readonly forgotPasswordModel = signal({ email: '' });

  readonly forgotPasswordForm = form(this.forgotPasswordModel, path => {
    required(path.email, { message: 'Email address is required' });
    email(path.email, { message: 'Please enter a valid email address' });
  }, {
    submission: {
      action: async () => {
        this.setLoading(true);
        try {
          await firstValueFrom(this.userApiService.forgotPassword(this.forgotPasswordModel().email));
          this.setLoading(false);
          this.showSuccess('Password reset email sent! Check your inbox.');
          this.matDialogRef.close();
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Sending password reset email');
        }
      }
    }
  });

  onCancel(): void {
    this.matDialogRef.close();
  }
}
