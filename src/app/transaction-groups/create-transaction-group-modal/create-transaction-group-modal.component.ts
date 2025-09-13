import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialogRef
} from '@angular/material/dialog';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FieldValidationMessages } from 'src/services/form-validation.service';
import { BaseComponent } from 'src/app/shared/base-component';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';

@Component({
  selector: 'transaction-modal',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    LoaderComponent
],
  templateUrl: './create-transaction-group-modal.component.html',
  styleUrl: './create-transaction-group-modal.component.scss',
  standalone: true
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

  public override customValidationMessages: FieldValidationMessages = {
    name: {
      required: 'Transaction group name is required',
      minlength: 'Name must be at least 2 characters long'
    },
    groupIcon: {
      required: 'Please select an icon for the group'
    }
  };

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
      name: this.getFieldValue<string>('name') ?? '',
      description: this.getFieldValue<string>('description') ?? '',
      groupIcon: this.getFieldValue<string>('groupIcon') ?? ''
    };

    this.executeWithLoading(
      this.transactionApiService.createTransactionGroup(createdTransactionGroup),
      'Transaction group created successfully!',
      'Creating transaction group'
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
