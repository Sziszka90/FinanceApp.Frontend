import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { CommonModule, formatDate } from '@angular/common';
import { Subject, take, takeUntil } from 'rxjs';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { MatIconModule } from '@angular/material/icon';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';

@Component({
  selector: 'create-transaction-modal',
  imports: [
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSelectModule,
    CommonModule,
    BsDatepickerModule
  ],
  templateUrl: './create-transaction-modal.component.html',
  styleUrl: './create-transaction-modal.component.scss',
  standalone: true,
})
export class CreateTransactionModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<CreateTransactionModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);

  private onDestroy$ = new Subject<void>();

  transactionForm: FormGroup = this.fb.group({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    value: new FormControl(0, [Validators.required, Validators.min(0)]),
    currency: new FormControl('', Validators.required),
    transactionDate: new FormControl(new Date()),
    transactionType: new FormControl('', Validators.required),
    group: new FormControl(''),
  });

  groupOptions = signal<GetTransactionGroupDto[]>([]);
  typeOptions: {name: string, value: TransactionTypeEnum}[] = [{name: "Expense", value: TransactionTypeEnum.Expense}, {name: "Income", value: TransactionTypeEnum.Income}];
  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  ngOnInit() {
    this.transactionApiService
      .getAllTransactionGroups()
      .pipe(take(1))
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((data) => {
        this.groupOptions.set(data);
        this.groupOptions.update(groups => [...groups, { id: '', name: 'No group' }]);
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const date: Date = this.transactionForm.get('transactionDate')?.value;
      const formattedDate = new Date(date ? formatDate(date, 'yyyy-MM-dd', 'en-US') : '');

      this.transactionApiService
        .createTransaction({
          name: this.transactionForm.get('name')?.value,
          description: this.transactionForm.get('description')?.value,
          value: {
            amount: this.transactionForm.get('value')?.value,
            currency: this.transactionForm.get('currency')!.value,
          },
          transactionDate: formattedDate,
          transactionType: this.transactionForm.get('transactionType')?.value,
          transactionGroupId: this.transactionForm.get('group')?.value.id,
        })
        .pipe(take(1))
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((createdTransaction) => this.dialogRef.close(createdTransaction));
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
