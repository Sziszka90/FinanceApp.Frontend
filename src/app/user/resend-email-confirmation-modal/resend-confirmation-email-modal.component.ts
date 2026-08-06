import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';
import { BaseComponent } from 'src/app/shared/base-component';

@Component({
  selector: 'resend-confirmation-email-modal',
  imports: [FormField, FormRoot, LoaderComponent],
  templateUrl: './resend-confirmation-email-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './resend-confirmation-email-modal.component.scss'
})
export class ResendConfirmationEmailModalComponent extends BaseComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ResendConfirmationEmailModalComponent>);
  readonly resendEmailModel = signal({ email: '' });

  readonly resendEmailForm = form(this.resendEmailModel, path => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please provide a valid email address' });
  }, {
    submission: {
      action: async () => {
        this.setLoading(true);
        try {
          const result = await firstValueFrom(this.userApiService.resendConfirmationEmail(this.resendEmailModel().email));
          this.setLoading(false);
          this.showSuccess(result?.message || 'Confirmation email sent successfully');
          this.matDialogRef.close();
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Error sending email confirmation');
        }
      }
    }
  });

  onCancel(): void {
    this.matDialogRef.close();
  }
}
