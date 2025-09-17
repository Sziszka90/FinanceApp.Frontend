import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateTransactionGroupModalComponent } from '../create-transaction-group-modal/create-transaction-group-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { Observable } from 'rxjs';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { UpdateTransactionGroupModalComponent } from '../update-transaction-group-modal/update-transaction-group-modal.component';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { AuthenticationService } from 'src/services/authentication.service';
import { BaseComponent } from 'src/app/shared/base-component';

@Component({
  selector: 'transaction-group',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    LoaderComponent
],
  templateUrl: './transaction-group.component.html',
  styleUrl: './transaction-group.component.scss'
})

export class TransactionGroupComponent extends BaseComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private transactionApiService = inject(TransactionApiService);
  private authService = inject(AuthenticationService);

  displayedColumnsFull: string[] = [
    'name',
    'description',
    'icon',
    'actions'
  ];

  public transactionGroups$: Observable<GetTransactionGroupDto[]> | undefined;
  public allTransactionGroups = signal<GetTransactionGroupDto[]>([]);
  public dataSource = signal<MatTableDataSource<GetTransactionGroupDto>>(new MatTableDataSource<GetTransactionGroupDto>([]));

  touchStartX = 0;

  ngOnInit(): void {
    this.loadTransactionGroups();
  }

  loadTransactionGroups(): void {
    this.setLoading(true);
    this.transactionApiService.getAllTransactionGroups().subscribe({
      next: (transactionGroups) => {
        this.setLoading(false);
        this.allTransactionGroups.set(transactionGroups);
        this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(transactionGroups));
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Loading transaction groups');
      }
    });
  }

  async createTransactionGroup() {
    const result = await this.authService.isAuthenticatedAsync();
    if (!result) {
      await this.authService.logoutAsync();
      return;
    }

    const dialogRef = this.matDialog.open(
      CreateTransactionGroupModalComponent,
      {
        autoFocus: true
      }
    );

    this.setLoading(true);

    dialogRef.afterClosed().subscribe({
      next: (createdTransactionGroup) => {
        this.setLoading(false);
        if (createdTransactionGroup) {
          this.allTransactionGroups.update(groups => [...groups, createdTransactionGroup]);
          this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));
        }
        this.showSuccess('Transaction group created successfully!');
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Creating transaction group');
      }
    });
  }

  deleteTransactionGroup(transactionGroup: GetTransactionGroupDto) {
    this.allTransactionGroups.update(groups => groups.filter(
      (group) => group.id !== transactionGroup.id
    ));
    this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));

    this.transactionApiService.deleteTransactionGroup(transactionGroup.id).subscribe({
      next: () => {
        this.showSuccess('Transaction group deleted successfully!');
      },
      error: (error) => {
        this.handleError(error, 'Deleting transaction group.');
        this.loadTransactionGroups();
      }
    });
  }

  async editTransactionGroup(transactionGroup: GetTransactionGroupDto) {
    const result = await this.authService.isAuthenticatedAsync();
    if (!result) {
      await this.authService.logoutAsync();
      return;
    }
    const dialogRef = this.matDialog.open(
      UpdateTransactionGroupModalComponent,
      {
        autoFocus: true,
        height: 'auto',
        data: transactionGroup
      }
    );

    this.setLoading(true);

    dialogRef.afterClosed().subscribe({
      next: (updatedTransactionGroup) => {
        this.setLoading(false);
        if (updatedTransactionGroup) {
          this.allTransactionGroups.update(groups => groups.map((transactionGroup) => {
            if (transactionGroup.id === updatedTransactionGroup.id) {
              return {
                ...transactionGroup,
                name: updatedTransactionGroup.name,
                description: updatedTransactionGroup.description,
                groupIcon: updatedTransactionGroup.groupIcon
              };
            }
            return transactionGroup;
          }));
          this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));
        }
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Editing transaction group');
      }
    });
  }
}
