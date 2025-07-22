import { Component, inject, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { Subject, takeUntil } from 'rxjs';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';

@Component({
  selector: 'update-transaction-group-modal',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    CommonModule,
  ],
  templateUrl: './update-transaction-group-modal.component.html',
  styleUrl: './update-transaction-group-modal.component.scss',
  standalone: true,
})
export class UpdateTransactionGroupModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<UpdateTransactionGroupModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);
  public data = inject<GetTransactionGroupDto>(MAT_DIALOG_DATA);

  transactionForm: FormGroup = this.fb.group({
    name: new FormControl(this.data.name, Validators.required),
    description: new FormControl(this.data.description),
    groupIcon: new FormControl(this.data.groupIcon)
  });

  public groupIconOptions: string[] = Object.values(ICONS);
  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );
  private onDestroy$ = new Subject<void>();

  onSubmit(): void {
    if (this.transactionForm.valid) {
      var updatedTransactionGroup = {
        id: this.data.id,
        name: this.transactionForm.get('name')?.value,
        description: this.transactionForm.get('description')?.value,
        groupIcon: this.transactionForm.get('groupIcon')?.value
      }

      this.transactionApiService
        .updateTransactionGroup(this.data.id, updatedTransactionGroup)
        .pipe(takeUntil(this.onDestroy$))
        .subscribe((updatedTransactionGroup) => {
          this.dialogRef.close(updatedTransactionGroup);
      });
    }
  }

  compareCategoryObjects(object1: any, object2: any) {
    return object1 && object2 && object1.id == object2.id;
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }
}
