import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { UserApiService } from 'src/services/user.api.service';

@Component({
  selector: 'forgot-password-modal',
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.scss'
})
export class ForgotPasswordRequestModalComponent {
  private userApiService = inject(UserApiService);
  private matDialogRef = inject(MatDialogRef<ForgotPasswordRequestModalComponent>);
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
      this.userApiService.forgotPassword(this.emailForm.value.email ?? "")
      .pipe(takeUntil(this.$onDestroy)).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Password reset email sent! Check your inbox.', 'Close', { duration: 5000, panelClass: 'info-snackbar' });
          this.matDialogRef.close();
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open('Error sending password reset email. Please try again.', 'Close', { duration: 5000, panelClass: 'error-snackbar' });
          console.error('Error sending password reset email:', error);
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
