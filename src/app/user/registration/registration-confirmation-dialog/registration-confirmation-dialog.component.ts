import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

interface RegistrationConfirmationDialogData {
  email: string;
}

@Component({
  selector: 'registration-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './registration-confirmation-dialog.component.html',
  styleUrl: './registration-confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationConfirmationDialogComponent {
  readonly data = inject<RegistrationConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RegistrationConfirmationDialogComponent>);

  continueToLogin(): void {
    this.dialogRef.close();
  }
}
