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
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { CommonModule, formatDate } from '@angular/common';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { MatIconModule } from '@angular/material/icon';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from 'src/app/shared/base-component';
import { FieldValidationMessages } from 'src/services/form-validation.service';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';

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
    BsDatepickerModule,
    LoaderComponent
  ],
  templateUrl: './create-transaction-modal.component.html',
  styleUrl: './create-transaction-modal.component.scss',
  standalone: true
})
export class CreateTransactionModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTransactionModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);

  public override formGroup: FormGroup = this.fb.group({
    Name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    Description: new FormControl(''),
    Value: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    Currency: new FormControl('', Validators.required),
    TransactionDate: new FormControl(new Date(), Validators.required),
    TransactionType: new FormControl('', Validators.required),
    Group: new FormControl('')
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

  ngOnInit() {
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

    const date: Date = this.getFieldValue<Date>('TransactionDate')!;
    const formattedDate = new Date(date ? formatDate(date, 'yyyy-MM-dd', 'en-US') : '');
    const groupValue = this.getFieldValue<GetTransactionGroupDto>('Group') || null;

    const createTransactionDto = {
      Name: this.getFieldValue<string>('Name')!,
      Description: this.getFieldValue<string>('Description') || '',
      Value: {
        Amount: this.getFieldValue<number>('Value')!,
        Currency: this.getFieldValue<CurrencyEnum>('Currency')!
      },
      TransactionDate: formattedDate,
      TransactionType: this.getFieldValue<TransactionTypeEnum>('TransactionType')!,
      TransactionGroupId: groupValue?.Id || undefined
    };

    this.executeWithLoading(
      this.transactionApiService.createTransaction(createTransactionDto),
      'Transaction created successfully!',
      'Creating transaction'
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
