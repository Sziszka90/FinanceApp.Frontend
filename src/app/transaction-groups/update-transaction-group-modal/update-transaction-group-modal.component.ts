import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormField, FormRoot, form, minLength, required } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TransactionApiService } from '../../../services/transactions.api.service';
import { ICONS } from 'src/models/Constants/group-icon-options.const';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { BaseComponent } from 'src/app/shared/base-component';
import { LoaderComponent } from 'src/app/shared/loader/loader.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'update-transaction-group-modal',
  imports: [FormField, FormRoot, MatSelectModule, LoaderComponent],
  templateUrl: './update-transaction-group-modal.component.html',
  styleUrl: './update-transaction-group-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class UpdateTransactionGroupModalComponent extends BaseComponent {
  private dialogRef = inject(MatDialogRef<UpdateTransactionGroupModalComponent>);
  private transactionApiService = inject(TransactionApiService);
  public data = inject<GetTransactionGroupDto>(MAT_DIALOG_DATA);

  readonly updateTransactionGroupModel = signal({
    name: this.data.name,
    description: this.data.description ?? '',
    groupIcon: this.data.groupIcon ?? ''
  });

  readonly updateTransactionGroupForm = form(this.updateTransactionGroupModel, path => {
    required(path.name, { message: 'Transaction group name is required' });
    minLength(path.name, 2, { message: 'Name must be at least 2 characters long' });
    required(path.groupIcon, { message: 'Please select an icon for the group' });
  }, {
    submission: {
      action: async () => {
        const model = this.updateTransactionGroupModel();
        this.setLoading(true);
        try {
          const result = await firstValueFrom(this.transactionApiService.updateTransactionGroup(this.data.id, {
            id: this.data.id,
            name: model.name,
            description: model.description,
            groupIcon: model.groupIcon!
          }));
          this.setLoading(false);
          this.showSuccess('Transaction group updated successfully!');
          this.dialogRef.close(result);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Updating transaction group');
        }
      }
    }
  });

  public groupIconOptions: string[] = Object.values(ICONS);

  onClose(): void {
    this.dialogRef.close(false);
  }
}
