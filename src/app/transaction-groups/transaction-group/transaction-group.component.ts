import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateTransactionGroupModalComponent } from '../create-transaction-group-modal/create-transaction-group-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
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
    CommonModule,
    MatTableModule,
    LoaderComponent],
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

  dataSource = signal<MatTableDataSource<GetTransactionGroupDto>>(new MatTableDataSource<GetTransactionGroupDto>([]));

  touchStartX = 0;

  ngOnInit(): void {
    this.loadTransactionGroups();
  }

  loadTransactionGroups(): void {
    this.executeWithLoading(
      this.transactionApiService.getAllTransactionGroups(),
      undefined,
      'Loading transaction groups',
    ).subscribe({
      next: (transactionGroups) => {
        this.allTransactionGroups.set(transactionGroups);
        this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(transactionGroups));
      }
    });
  }

  createTransactionGroup() {
    if (!this.authService.isAuthenticated()) {
      this.authService.logout();
      return;
    }

    const dialogRef = this.matDialog.open(
      CreateTransactionGroupModalComponent,
      {
        autoFocus: true
      }
    );

    this.executeWithLoading(
      dialogRef.afterClosed(),
    ).subscribe({
      next: (createdTransactionGroup) => {
        if (createdTransactionGroup) {
          this.allTransactionGroups.update(groups => [...groups, createdTransactionGroup]);
          this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));
        }
      }
    });
  }

  deleteTransactionGroup(transactionGroup: GetTransactionGroupDto) {
    this.allTransactionGroups.update(groups => groups.filter(
      (group) => group.Id !== transactionGroup.Id
    ));
    this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));

    this.executeWithLoading(
      this.transactionApiService.deleteTransactionGroup(transactionGroup.Id),
      'Transaction group deleted successfully!',
      'Deleting transaction group',
      false
    ).subscribe({
      error: () => {
        this.loadTransactionGroups();
      }
    });
  }

  editTransactionGroup(transactionGroup: GetTransactionGroupDto) {
    if (!this.authService.isAuthenticated()) {
      this.authService.logout();
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

    this.executeWithLoading(
      dialogRef.afterClosed(),
    ).subscribe({
      next: (updatedTransactionGroup) => {
        if (updatedTransactionGroup) {
          this.allTransactionGroups.update(groups => groups.map((transactionGroup) => {
            if (transactionGroup.Id === updatedTransactionGroup.Id) {
              return {
                ...transactionGroup,
                Name: updatedTransactionGroup.Name,
                Description: updatedTransactionGroup.Description,
                GroupIcon: updatedTransactionGroup.GroupIcon
              };
            }
            return transactionGroup;
          }));
          this.dataSource.set(new MatTableDataSource<GetTransactionGroupDto>(this.allTransactionGroups()));
        }
      }
    });
  }
}
