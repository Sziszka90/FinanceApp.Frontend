import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { BaseComponent } from 'src/app/shared/base-component';
import { FieldValidationMessages } from 'src/services/form-validation.service';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';

@Component({
  selector: 'update-transaction-group-modal',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    CommonModule,
    LoaderComponent
  ],
  templateUrl: './update-transaction-group-modal.component.html',
  styleUrl: './update-transaction-group-modal.component.scss',
  standalone: true
})
export class UpdateTransactionGroupModalComponent extends BaseComponent {
  private dialogRef = inject(MatDialogRef<UpdateTransactionGroupModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);
  public data = inject<GetTransactionGroupDto>(MAT_DIALOG_DATA);

  public override formGroup = this.fb.group({
    name: new FormControl(this.data.name, [Validators.required, Validators.minLength(2)]),
    description: new FormControl(this.data.description),
    groupIcon: new FormControl(this.data.groupIcon, Validators.required)
  });

  public groupIconOptions: string[] = Object.values(ICONS);

  public override customValidationMessages: FieldValidationMessages = {
    name: {
      required: 'Transaction group name is required',
      minlength: 'Name must be at least 2 characters long'
    },
    groupIcon: {
      required: 'Please select an icon for the group'
    }
  };

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    const updatedTransactionGroup = {
      id: this.data.id,
      name: this.getFieldValue<string>('name')!,
      description: this.getFieldValue<string>('description') || '',
      groupIcon: this.getFieldValue<string>('groupIcon')!
    };

    this.executeWithLoading(
      this.transactionApiService.updateTransactionGroup(this.data.id, updatedTransactionGroup),
      'Transaction group updated successfully!',
      'Updating transaction group'
    ).subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
