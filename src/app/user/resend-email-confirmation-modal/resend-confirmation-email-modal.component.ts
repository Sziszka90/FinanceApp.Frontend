import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';

@Component({
  selector: 'resend-confirmation-email-modal',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './resend-confirmation-email-modal.component.html',
  styleUrl: './resend-confirmation-email-modal.component.scss'
})
export class ResendConfirmationEmailModalComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ResendConfirmationEmailModalComponent>);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  public emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public loading = signal<boolean>(false);

  private $onDestroy = new Subject<void>();

  onSubmit(): void {
    if (this.emailForm.valid) {
      this.loading.set(true);
      this.userApiService.resendConfirmationEmail(this.emailForm.value.email ?? "")
      .pipe(takeUntil(this.$onDestroy)).subscribe({
        next: (result) => {
          this.loading.set(false);
          this.snackBar.open(result.message, 'Close', { duration: 5000, panelClass: 'info-snackbar' });
          this.matDialogRef.close();
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open('Error sending email confirmation. Please try again.', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
          console.error('Error sending email confirmation:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.matDialogRef.close();
  }

  ngOnDestroy(): void {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }
}
