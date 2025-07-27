import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateTransactionGroupModalComponent } from '../create-transaction-group-modal/create-transaction-group-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GetTransactionGroupDto } from 'src/models/TransactionGroupDtos/get-transaction-group.dto';
import { UpdateTransactionGroupModalComponent } from '../update-transaction-group-modal/update-transaction-group-modal.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { AuthenticationService } from 'src/services/authentication.service';
import { ComponentErrorService } from 'src/services/component-error.service';
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
  styleUrl: './transaction-group.component.scss',
})

export class TransactionGroupComponent extends BaseComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private transactionApiService = inject(TransactionApiService);
  private authService = inject(AuthenticationService);

  displayedColumnsFull: string[] = [
    'name',
    'description',
    'icon',
    'actions',
  ];

  public transactionGroups$: Observable<GetTransactionGroupDto[]> | undefined;
  public allTransactionGroups = signal<GetTransactionGroupDto[]>([]);

  touchStartX = 0;

  ngOnInit(): void {
    // Using executeWithLoading for automatic loading and error handling
    this.executeWithLoading(
      this.transactionApiService.getAllTransactionGroups(),
      'Transaction groups loaded successfully!',
      'Loading transaction groups'
    ).subscribe({
      next: (transactionGroups) => {
        this.allTransactionGroups.set(transactionGroups);
      }
      // No need for error handling - executeWithLoading handles it automatically
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
        autoFocus: true,
      }
    );

    dialogRef.afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe((createdTransactionGroup) => {
      if (createdTransactionGroup) {
        this.allTransactionGroups.update(groups => [...groups, createdTransactionGroup]);
      }
    });
  }

  deleteTransactionGroup(transactionGroup: GetTransactionGroupDto) {
    this.transactionApiService.deleteTransactionGroup(transactionGroup.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.allTransactionGroups.update(groups => groups.filter(
          (group) => group.id !== transactionGroup.id
        ));
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
        data: transactionGroup,
      }
    );

    dialogRef.afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe((updatedTransactionGroup) => {
      if (updatedTransactionGroup) {
        this.allTransactionGroups.update(groups => groups.map((transactionGroup) => {
          if (transactionGroup.id === updatedTransactionGroup.id) {
            return {
              ...transactionGroup,
              name: updatedTransactionGroup.name,
              description: updatedTransactionGroup.description,
              groupIcon: updatedTransactionGroup.groupIcon,
            };
          }
          return transactionGroup;
        }));
      }
    });
  }
}
