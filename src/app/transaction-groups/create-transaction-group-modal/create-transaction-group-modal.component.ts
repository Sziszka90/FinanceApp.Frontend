import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { BaseComponent } from 'src/app/shared/base-component';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'transaction-modal',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    CommonModule,
    LoaderComponent
  ],
  templateUrl: './create-transaction-group-modal.component.html',
  styleUrl: './create-transaction-group-modal.component.scss',
  standalone: true,
})
export class CreateTransactionGroupModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTransactionGroupModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);

  public override formGroup: FormGroup = this.fb.group({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl(''),
    groupIcon: new FormControl('', Validators.required)
  });

  public groupIconOptions: string[] = Object.values(ICONS);

  ngOnInit(): void {
    if (this.groupIconOptions.length > 0) {
      this.formGroup!.patchValue({
        groupIcon: this.groupIconOptions.at(-1)
      });
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    const createdTransactionGroup = {
      name: this.getFieldValue('name'),
      description: this.getFieldValue('description'),
      groupIcon: this.getFieldValue('groupIcon')
    };

    this.transactionApiService
      .createTransactionGroup(createdTransactionGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.showSuccess('Transaction group created successfully!');
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.handleError(error, 'Creating transaction group');
        }
      });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
