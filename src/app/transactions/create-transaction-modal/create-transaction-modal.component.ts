import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, min, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { formatDate } from '@angular/common';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { MatIconModule } from '@angular/material/icon';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from 'src/app/shared/base-component';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'create-transaction-modal',
  imports: [
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FormField,
    FormRoot,
    MatSelectModule,
    BsDatepickerModule,
    LoaderComponent
  ],
  templateUrl: './create-transaction-modal.component.html',
  styleUrl: './create-transaction-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class CreateTransactionModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTransactionModalComponent>);
  private transactionApiService = inject(TransactionApiService);

  readonly createTransactionModel = signal({
    name: '',
    description: '',
    value: 0,
    currency: null as CurrencyEnum | null,
    transactionDate: new Date() as Date | null,
    transactionType: null as TransactionTypeEnum | null,
    group: null as GetTransactionGroupDto | null
  });

  readonly createTransactionForm = form(this.createTransactionModel, path => {
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
        const model = this.createTransactionModel();
        const formattedDate = new Date(model.transactionDate ? formatDate(model.transactionDate, 'yyyy-MM-dd', 'en-US') : '');
        this.setLoading(true);
        try {
          const result = await firstValueFrom(this.transactionApiService.createTransaction({
            name: model.name,
            description: model.description,
            value: {
              amount: model.value,
              currency: model.currency!
            },
            transactionDate: formattedDate,
            transactionType: model.transactionType!,
            transactionGroupId: model.group?.id || undefined
          }));
          this.setLoading(false);
          this.dialogRef.close(result);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Creating transaction');
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

  ngOnInit() {
    this.setLoading(true);
    this.transactionApiService.getAllTransactionGroups().subscribe({
      next: data => {
        this.setLoading(false);
        this.groupOptions.set(data);
        this.groupOptions.update(groups => [...groups, { id: '', name: 'No group' } as GetTransactionGroupDto]);
      },
      error: error => {
        this.setLoading(false);
        this.handleError(error, 'Loading transaction groups');
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
