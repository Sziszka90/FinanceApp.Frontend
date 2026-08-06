import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, min, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { UpdateTransactionDto } from 'src/models/TransactionDtos/update-transaction.dto';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from 'src/app/shared/base-component';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { firstValueFrom, forkJoin } from 'rxjs';

@Component({
  selector: 'update-transaction-modal',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormField,
    FormRoot,
    MatSelectModule,
    BsDatepickerModule,
    LoaderComponent
  ],
  templateUrl: './update-transaction-modal.component.html',
  styleUrl: './update-transaction-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class UpdateTransactionModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UpdateTransactionModalComponent>);
  private transactionApiService = inject(TransactionApiService);
  public data = inject(MAT_DIALOG_DATA);

  readonly updateTransactionModel = signal({
    name: '',
    description: '',
    value: 0,
    currency: null as CurrencyEnum | null,
    transactionDate: null as Date | null,
    transactionType: null as TransactionTypeEnum | null,
    group: null as GetTransactionGroupDto | null
  });

  readonly updateTransactionForm = form(this.updateTransactionModel, path => {
    required(path.name, { message: 'Transaction name is required' });
    minLength(path.name, 2, { message: 'Name must be at least 2 characters long' });
    required(path.value, { message: 'Transaction amount is required' });
    min(path.value, 0.01, { message: 'Amount must be greater than 0' });
    required(path.currency, { message: 'Please select a currency' });
    required(path.transactionDate, { message: 'Transaction date is required' });
    required(path.transactionType, { message: 'Please select a transaction type' });
  }, {
    submission: {
      action: async () => {
        const model = this.updateTransactionModel();
        const transactionDate = model.transactionDate && model.transactionDate.getFullYear() !== 1
          ? model.transactionDate
          : undefined;
        const updatedTransaction: UpdateTransactionDto = {
          id: this.data.id,
          name: model.name,
          description: model.description,
          value: {
            amount: model.value,
            currency: model.currency!
          },
          transactionType: model.transactionType!,
          transactionDate,
          transactionGroupId: model.group?.id || undefined
        };
        this.setLoading(true);
        try {
          const result = await firstValueFrom(this.transactionApiService.updateTransaction(this.data.id, updatedTransaction));
          this.setLoading(false);
          this.showSuccess('Transaction updated successfully!');
          this.dialogRef.close(result);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Updating transaction');
        }
      }
    }
  });

  groupOptions = signal<GetTransactionGroupDto[]>([]);
  typeOptions: { name: string; value: TransactionTypeEnum }[] = [
    { name: 'Expense', value: TransactionTypeEnum.Expense },
    { name: 'Income', value: TransactionTypeEnum.Income }
  ];
  currencyOptions = (Object.values(CurrencyEnum)
    .filter(value => typeof value === 'number' && value !== CurrencyEnum.XXX) as CurrencyEnum[]);
  readonly CurrencyEnum = CurrencyEnum;

  ngOnInit(): void {
    this.setLoading(true);
    const transactionGroups$ = this.transactionApiService.getAllTransactionGroups();
    const transaction$ = this.transactionApiService.getTransaction(this.data.id);

    forkJoin([transactionGroups$, transaction$]).subscribe({
      next: ([groups, transaction]) => {
        this.groupOptions.set(groups);
        this.groupOptions.update(gs => [...gs, { id: '', name: 'No group' } as GetTransactionGroupDto]);

        this.updateTransactionModel.set({
          name: transaction.name,
          description: transaction.description ?? '',
          value: transaction.value.amount,
          currency: transaction.value.currency,
          transactionDate: new Date(transaction.transactionDate),
          transactionType: transaction.transactionType,
          group: transaction.transactionGroup ?? null
        });

        this.setLoading(false);
      },
      error: error => {
        this.setLoading(false);
        this.handleError(error, 'Loading transaction groups or transaction');
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
