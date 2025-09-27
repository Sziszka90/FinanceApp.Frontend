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
import { forkJoin } from 'rxjs';

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
  name: ["", [Validators.required, Validators.minLength(2)]],
  description: [""],
  value: ["", [Validators.required, Validators.min(0.01)]],
  currency: ["", Validators.required],
  transactionDate: ["", Validators.required],
  transactionType: [null, [Validators.required, enumValidator(TransactionTypeEnum)]],
  group: [null] 
});

  public override customValidationMessages: FieldValidationMessages = {
    name: {
      required: 'Transaction name is required',
      minlength: 'Name must be at least 2 characters long'
    },
    value: {
      required: 'Transaction amount is required',
      min: 'Amount must be greater than 0'
    },
    currency: {
      required: 'Please select a currency'
    },
    transactionDate: {
      required: 'Transaction date is required'
    },
    transactionType: {
      required: 'Please select a transaction type'
    }
  };

  groupOptions = signal<GetTransactionGroupDto[]>([]);
  typeOptions: {name: string, value: TransactionTypeEnum}[] = [{ name: 'Expense', value: TransactionTypeEnum.Expense }, { name: 'Income', value: TransactionTypeEnum.Income }];
  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  ngOnInit(): void {
    this.setLoading(true);
    const transactionGroups$ = this.transactionApiService.getAllTransactionGroups();
    const transaction$ = this.transactionApiService.getTransaction(this.data.id);

    forkJoin([transactionGroups$, transaction$]).subscribe({
      next: ([groups, transaction]) => {
        this.groupOptions.set(groups);
        this.groupOptions.update(gs => [...gs, { id: '', name: 'No group' } as GetTransactionGroupDto]);

        this.formGroup!.patchValue({
          name: transaction.name,
          description: transaction.description,
          value: transaction.value.amount,
          currency: transaction.value.currency,
          transactionDate: new Date(transaction.transactionDate),
          transactionType: transaction.transactionType,
          group: transaction.transactionGroup
        });

        this.setLoading(false);
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Loading transaction groups or transaction');
      }
    });
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    let transactionDate = undefined;

    const date: Date = this.getFieldValue<Date>('transactionDate')!;
    if (date && date.getFullYear() !== 1) {
      transactionDate = date;
    }

    const updatedTransaction: UpdateTransactionDto = {
      id: this.data.id,
      name: this.getFieldValue<string>('name')!,
      description: this.getFieldValue<string>('description') || '',
      value: {
        amount: this.getFieldValue<number>('value')!,
        currency: this.getFieldValue<CurrencyEnum>('currency')!
      },
      transactionType: this.getFieldValue<TransactionTypeEnum>('transactionType')!,
      transactionDate: transactionDate,
      transactionGroupId: this.getFieldValue<GetTransactionGroupDto>('group')?.id || undefined
    };

    this.setLoading(true);

    this.transactionApiService.updateTransaction(this.data.id, updatedTransaction).subscribe({
      next: (result) => {
        this.setLoading(false);
        this.showSuccess('Transaction updated successfully!');
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Updating transaction');
      }
    });
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  compareCategoryObjects(object1: any, object2: any) {
    return object1.id == object2.id;
  }
}
