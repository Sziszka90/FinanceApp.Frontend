import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { enumValidator } from 'src/helpers/helpers';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { UpdateTransactionDto } from 'src/models/TransactionDtos/update-transaction.dto';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from 'src/app/shared/base-component';
import { FieldValidationMessages } from 'src/services/form-validation.service';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';

@Component({
  selector: 'update-transaction-modal',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSelectModule,
    BsDatepickerModule,
    LoaderComponent
],
  templateUrl: './update-transaction-modal.component.html',
  styleUrl: './update-transaction-modal.component.scss',
  standalone: true
})
export class UpdateTransactionModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UpdateTransactionModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);
  public data = inject(MAT_DIALOG_DATA);

  public override formGroup: FormGroup = this.fb.group({
    Name: new FormControl(this.data.Name, [Validators.required, Validators.minLength(2)]),
    Description: new FormControl(this.data.Description),
    Value: new FormControl(this.data.Value.Amount, [
      Validators.required,
      Validators.min(0.01)
    ]),
    Currency: new FormControl(this.data.Value.Currency, Validators.required),
    TransactionDate: new FormControl(this.data.TransactionDate, Validators.required),
    TransactionType: new FormControl(
      null,
      [Validators.required, enumValidator(TransactionTypeEnum)]
    ),
    Group: new FormControl(
      this.data.TransactionGroup != null
        ? this.data.TransactionGroup
        : null
    )
  });

  public override customValidationMessages: FieldValidationMessages = {
    Name: {
      required: 'Transaction name is required',
      minlength: 'Name must be at least 2 characters long'
    },
    Value: {
      required: 'Transaction amount is required',
      min: 'Amount must be greater than 0'
    },
    Currency: {
      required: 'Please select a currency'
    },
    TransactionDate: {
      required: 'Transaction date is required'
    },
    TransactionType: {
      required: 'Please select a transaction type'
    }
  };
  groupOptions = signal<GetTransactionGroupDto[]>([]);
  typeOptions: {Name: string, Value: TransactionTypeEnum}[] = [{ Name: 'Expense', Value: TransactionTypeEnum.Expense }, { Name: 'Income', Value: TransactionTypeEnum.Income }];
  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  ngOnInit(): void {
  this.formGroup!.get('Group')?.setValue(this.data.TransactionGroup);
  this.formGroup!.get('Currency')?.setValue(this.data.Value.Currency);
  this.formGroup!.get('TransactionType')?.setValue(this.data.TransactionType);
  this.formGroup!.get('TransactionDate')?.setValue(new Date(this.data.TransactionDate));

    this.executeWithLoading(
      this.transactionApiService.getAllTransactionGroups(),
      undefined,
      'Loading transaction groups'
    ).subscribe({
      next: (data) => {
        this.groupOptions.set(data);
        this.groupOptions.update(groups => [...groups, { Id: '', Name: 'No group' } as GetTransactionGroupDto]);
      }
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    let transactionDate = undefined;

    const date: Date = this.getFieldValue<Date>('TransactionDate')!;
    if (date && date.getFullYear() !== 1) {
      transactionDate = date;
    }

    const updatedTransaction: UpdateTransactionDto = {
      Id: this.data.Id,
      Name: this.getFieldValue<string>('Name')!,
      Description: this.getFieldValue<string>('Description') || '',
      Value: {
        Amount: this.getFieldValue<number>('Value')!,
        Currency: this.getFieldValue<CurrencyEnum>('Currency')!
      },
      TransactionType: this.getFieldValue<TransactionTypeEnum>('TransactionType')!,
      TransactionDate: transactionDate,
      TransactionGroupId: this.getFieldValue<GetTransactionGroupDto>('Group')?.Id || undefined
    };

    this.executeWithLoading(
      this.transactionApiService.updateTransaction(this.data.Id, updatedTransaction),
      'Transaction updated successfully!',
      'Updating transaction'
    ).subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  compareCategoryObjects(object1: any, object2: any) {
    return object1 && object2 && object1.id == object2.id;
  }
}
