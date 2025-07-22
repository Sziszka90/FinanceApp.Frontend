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
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-40px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease', style({ opacity: 0, transform: 'translateX(40px)' })),
      ]),
    ]),
  ]
})

export class TransactionGroupComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  touchStartX = 0;

  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.transactionGroups$ = this.transactionApiService.getAllTransactionGroups();
    this.transactionGroups$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.allTransactionGroups.set(value);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching transaction groups:', error);
        this.loading.set(false);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
