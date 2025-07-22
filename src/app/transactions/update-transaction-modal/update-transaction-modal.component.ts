import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Subject, take, takeUntil } from 'rxjs';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { enumValidator } from 'src/helpers/helpers';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { UpdateTransactionDto } from 'src/models/TransactionDtos/update-transaction.dto';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';

@Component({
  selector: 'update-transaction-modal',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatSelectModule,
    CommonModule,
    BsDatepickerModule
  ],
  templateUrl: './update-transaction-modal.component.html',
  styleUrl: './update-transaction-modal.component.scss',
  standalone: true,
})
export class UpdateTransactionModalComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<UpdateTransactionModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);
  public data = inject(MAT_DIALOG_DATA);

  transactionForm: FormGroup = this.fb.group({
    name: new FormControl(this.data.name, Validators.required),
    description: new FormControl(this.data.description),
    value: new FormControl(this.data.value.amount, [
      Validators.required,
      Validators.min(0),
    ]),
    currency: new FormControl(this.data.value.currency, Validators.required),
    transactionDate: new FormControl(this.data.transactionDate),
    transactionType: new FormControl(
      null,
      [Validators.required, enumValidator(TransactionTypeEnum)]
    ),
    group: new FormControl(
      this.data.transactionGroup != null
        ? this.data.transactionGroup.Name
        : ''
    ),
  });
  groupOptions = signal<GetTransactionGroupDto[]>([]);
  typeOptions: {name: string, value: TransactionTypeEnum}[] = [{name: "Expense", value: TransactionTypeEnum.Expense}, {name: "Income", value: TransactionTypeEnum.Income}];
  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    this.transactionForm.get('group')?.setValue(this.data.transactionGroup);
    this.transactionForm.get('currency')?.setValue(this.data.value.currency);
    this.transactionForm.get('transactionType')?.setValue(this.data.transactionType);
    this.transactionForm.get('transactionDate')?.setValue(new Date(this.data.transactionDate));

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

      var transactionDate = undefined;

      const date: Date = this.transactionForm.get('transactionDate')?.value;
      if (date && date.getFullYear() !== 1) {
        transactionDate = date;
      }

      var updatedTransaction: UpdateTransactionDto = {
        id: this.data.id,
        name: this.transactionForm.get('name')?.value,
        description: this.transactionForm.get('description')?.value,
        value: {
          amount: this.transactionForm.get('value')?.value,
          currency: this.transactionForm.get('currency')!.value,
        },
        transactionType: this.transactionForm.get('transactionType')!.value,
        transactionDate: transactionDate,
        transactionGroupId: this.transactionForm.get('group')?.value?.id ? this.transactionForm.get('group')?.value.id : null,
      }

      this.transactionApiService
        .updateTransaction(this.data.id, updatedTransaction)
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((updatedTransaction) => this.dialogRef.close(updatedTransaction));
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  compareCategoryObjects(object1: any, object2: any) {
    return object1 && object2 && object1.id == object2.id;
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
