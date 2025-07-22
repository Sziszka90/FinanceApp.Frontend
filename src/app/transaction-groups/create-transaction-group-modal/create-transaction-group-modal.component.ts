import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'transaction-modal',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './create-transaction-group-modal.component.html',
  styleUrl: './create-transaction-group-modal.component.scss',
  standalone: true,
})
export class CreateTransactionGroupModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTransactionGroupModalComponent>);
  private fb = inject(FormBuilder);
  private transactionApiService = inject(TransactionApiService);

  public transactionForm: FormGroup = this.fb.group({
    name: new FormControl('', Validators.required),
    description: new FormControl(''),
    groupIcon: new FormControl('')
  });

  public groupIconOptions: string[] = Object.values(ICONS);
  public selectedIcon: string = "";

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.transactionForm.valid) {
      var createdTransactionGroup = {
        name: this.transactionForm.get('name')?.value,
        description: this.transactionForm.get('description')?.value,
        groupIcon: this.transactionForm.get('groupIcon')?.value
      };

      this.transactionApiService
      .createTransactionGroup(createdTransactionGroup).subscribe((createdTransactionGroup) => {
        this.dialogRef.close(createdTransactionGroup);
      });
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
