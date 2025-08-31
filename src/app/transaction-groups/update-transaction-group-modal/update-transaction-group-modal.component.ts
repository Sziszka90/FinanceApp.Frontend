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
    Name: new FormControl(this.data.Name, [Validators.required, Validators.minLength(2)]),
    Description: new FormControl(this.data.Description),
    GroupIcon: new FormControl(this.data.GroupIcon, Validators.required)
  });

  public groupIconOptions: string[] = Object.values(ICONS);

  public override customValidationMessages: FieldValidationMessages = {
    Name: {
      required: 'Transaction group name is required',
      minlength: 'Name must be at least 2 characters long'
    },
    GroupIcon: {
      required: 'Please select an icon for the group'
    }
  };

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    const updatedTransactionGroup = {
      Id: this.data.Id,
      Name: this.getFieldValue<string>('Name')!,
      Description: this.getFieldValue<string>('Description') || '',
      GroupIcon: this.getFieldValue<string>('GroupIcon')!
    };

    this.executeWithLoading(
      this.transactionApiService.updateTransactionGroup(this.data.Id, updatedTransactionGroup),
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
