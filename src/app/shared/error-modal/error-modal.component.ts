import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [
    MatDialogModule,
    MatButtonModule
  ]
})
export class ErrorModalComponent {
  private dialogRef = inject(MatDialogRef<ErrorModalComponent>);
  public data = inject<{ message?: string, details: { [key: string]: any } }>(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
