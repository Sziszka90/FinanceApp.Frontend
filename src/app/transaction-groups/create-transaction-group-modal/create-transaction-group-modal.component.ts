import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { MatDialogRef } from '@angular/material/dialog';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { BaseComponent } from 'src/app/shared/base-component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'transaction-modal',
  imports: [FormField, FormRoot, MatSelectModule, MatIconModule, LoaderComponent],
  templateUrl: './create-transaction-group-modal.component.html',
  styleUrl: './create-transaction-group-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class CreateTransactionGroupModalComponent extends BaseComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTransactionGroupModalComponent>);
  private transactionApiService = inject(TransactionApiService);

  readonly createTransactionGroupModel = signal({
    name: '',
    description: '',
    groupIcon: ''
  });

  readonly createTransactionGroupForm = form(this.createTransactionGroupModel, path => {
    required(path.name, { message: 'Transaction group name is required' });
    minLength(path.name, 2, { message: 'Name must be at least 2 characters long' });
    required(path.groupIcon, { message: 'Please select an icon for the group' });
  }, {
    submission: {
      action: async () => {
        const model = this.createTransactionGroupModel();
        this.setLoading(true);
        try {
          const result = await firstValueFrom(this.transactionApiService.createTransactionGroup(model));
          this.setLoading(false);
          this.showSuccess('Transaction group created successfully!');
          this.dialogRef.close(result);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Creating transaction group');
        }
      }
    }
  });

  public groupIconOptions: string[] = Object.values(ICONS);

  ngOnInit(): void {
    if (this.groupIconOptions.length > 0) {
      this.createTransactionGroupModel.update(model => ({
        ...model,
        groupIcon: this.groupIconOptions.at(-1) ?? ''
      }));
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
