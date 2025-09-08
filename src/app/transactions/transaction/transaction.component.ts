import { Component, inject, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, Signal, signal, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { MatDialog } from '@angular/material/dialog';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { UpdateTransactionModalComponent } from '../update-transaction-modal/update-transaction-modal.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { MatSelectModule } from '@angular/material/select';
import { formatDate } from '@angular/common';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { CreateTransactionModalComponent } from '../create-transaction-modal/create-transaction-modal.component';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { Money } from 'src/models/Money/money.dto';
import { AuthenticationService } from 'src/services/authentication.service';
import { CorrelationService } from 'src/services/correlation.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'src/services/notification.service';
import { REFRESH_TRANSACTIONS } from 'src/models/Constants/notification.const';
import { BaseComponent } from 'src/app/shared/base-component';

@Component({
  selector: 'transaction',
  imports: [
    MatIconModule,
    MatSortModule,
    MatButtonModule,
    CommonModule,
    MatTableModule,
    MatSelectModule,
    ReactiveFormsModule,
    BsDatepickerModule,
    LoaderComponent
  ],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss',
  standalone: true
})

export class TransactionComponent extends BaseComponent implements OnInit {
  private transactionApiService = inject(TransactionApiService);
  private matDialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);
  private correlationService = inject(CorrelationService);
  private notificationService = inject(NotificationService);

  public summary$: Observable<Money> | undefined;
  public transactions$: Observable<GetTransactionDto[]> | undefined;
  public allTransactions = signal<GetTransactionDto[]>([]);
  public total = signal<Money>({ Amount: 0, Currency: CurrencyEnum.EUR });

  public showSummary = signal<boolean>(false);
  public summary = signal<Money | null>(null);

  public importLoading = signal<boolean>(false);

  dataSource = signal<MatTableDataSource<GetTransactionDto>>(new MatTableDataSource<GetTransactionDto>([]));

  typeOptions: {Name: string, Value: TransactionTypeEnum}[] = [{ Name: 'Expense', Value: TransactionTypeEnum.Expense }, { Name: 'Income', Value: TransactionTypeEnum.Income }];

  filterForm: FormGroup = this.fb.group({
    Name: [''],
    Date: [''],
    Type: []
  });

  displayedColumns: string[] = [
    'name',
    'description',
    'value',
    'currency',
    'transactionDate',
    'transactionType',
    'group',
    'actions'
  ];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('tableContainer') tableContainer!: ElementRef;

  ngOnInit(): void {
    this.dataSource.update(ds => {
      ds.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'value': return item.Value.Amount;
          case 'currency': return item.Value.Currency;
          case 'transactionDate': return new Date(item.TransactionDate);
          case 'group': return item.TransactionGroup?.Name ?? '';
          default: return (item as any)[property];
        }
      };
      return ds;
    });

    this.loadTransactions();

    this.executeWithLoading(
      this.filterForm.valueChanges,
      undefined,
      'Applying filters'
    ).subscribe({
      next: () => this.applyFilters()
    });

    this.executeWithLoading(
      this.notificationService.notifications$,
      undefined,
      'Processing notifications'
    ).subscribe({
      next: (message) => {
        if (message && message === REFRESH_TRANSACTIONS) {
          this.loadTransactions();
        }
      }
    });
  }

  loadTransactions() {
    this.executeWithLoading(
      this.transactionApiService.getAllTransactions(),
      undefined,
      'Loading transactions'
    ).subscribe({
      next: (value: GetTransactionDto[]) => {
        this.allTransactions.set(value);
        this.dataSource.set(new MatTableDataSource<GetTransactionDto>(value));
        this.setupCustomFilterPredicate();
      }
    });
  }

  ngAfterViewChecked() {
    if (this.sort && this.dataSource().sort !== this.sort) {
      this.dataSource.update(ds => {
        ds.sort = this.sort;
        return ds;
      });
    }
  }

  setupCustomFilterPredicate() {
    this.dataSource.update(ds => {
      ds.filterPredicate = (data: GetTransactionDto, filter: string) => {
        const filterObj = JSON.parse(filter);
        const { Name, Date, Type } = filterObj;

        return (!Name || data.Name.toLowerCase().includes(Name.toLowerCase())) &&
              (!Date || (
                data.TransactionDate &&
                new Date(data.TransactionDate).toISOString().slice(0, 10) === Date
              )) &&
              (!Type || data.TransactionType === Type);
      };
      return ds; // important: return the same object
    });
  }

  applyFilters() {
    const { Name, Date, Type } = this.filterForm.value;
    const formattedDate = Date ? formatDate(Date, 'yyyy-MM-dd', 'en-US') : '';

    this.dataSource.update(ds => {
      ds.filter = JSON.stringify({ Name, Date: formattedDate, Type });
      return ds;
    });

    if (this.sort.active && this.sort.direction !== '') {
      this.dataSource().data = [...this.dataSource().filteredData];
    }
  }

  deleteTransaction(transactionDto: GetTransactionDto) {
    this.allTransactions.update(transactions => transactions.filter((t) => t.Id !== transactionDto.Id));
    this.dataSource.update(ds => {
      ds.data = this.allTransactions();
      return ds;
    });

    this.executeWithLoading(
      this.transactionApiService.deleteTransaction(transactionDto.Id),
      'Transaction deleted successfully!',
      'Deleting transaction',
      false
    ).subscribe({
      error: () => {
        this.loadTransactions();
      }
    });
  }

  editTransaction(transactionDto: GetTransactionDto) {
    if (!this.authService.isAuthenticated()) {
      this.authService.logout();
      return;
    }

    const dialogRef = this.matDialog.open(
      UpdateTransactionModalComponent,
      {
        autoFocus: true,
        maxHeight: '90vh',
        data: transactionDto
      }
    );

    this.executeWithLoading(
      dialogRef.afterClosed(),
      undefined,
      'Updating transaction'
    ).subscribe({
      next: (updatedTransaction: GetTransactionDto) => {
        if (updatedTransaction) {
          this.allTransactions?.update(transactions => transactions.map((transaction: GetTransactionDto) => {
            if (transaction.Id === updatedTransaction.Id) {
              return {
                ...transaction,
                Name: updatedTransaction.Name,
                Description: updatedTransaction.Description,
                Value: updatedTransaction.Value,
                TransactionDate: updatedTransaction.TransactionDate,
                TransactionType: updatedTransaction.TransactionType,
                TransactionGroup: updatedTransaction.TransactionGroup
              };
            }
            return transaction;
          }));
        }
        this.dataSource.update(ds => {
          ds.data = this.allTransactions();
          return ds;
        });
      }
    });
  }

  createTransaction() {
    if (!this.authService.isAuthenticated()) {
      this.authService.logout();
      return;
    }

    const dialogRef = this.matDialog.open(
      CreateTransactionModalComponent,
      {
        autoFocus: true,
        maxHeight: '90vh'
      }
    );

    this.executeWithLoading(
      dialogRef.afterClosed(),
      undefined,
      'Creating transaction'
    ).subscribe({
      next: (createdTransaction: GetTransactionDto) => {
        if (createdTransaction) {
          this.allTransactions.update(transactions => [...transactions, createdTransaction]);
          this.dataSource.update(ds => {
            ds.data = this.allTransactions();
            return ds;
          });
        }
      }
    });
  }

  resetFilters() {
    this.filterForm.reset();
    this.dataSource.update(ds => {
      ds.filter = '';
      ds.data = this.allTransactions();
      return ds;
    });
  }

  getSummary(): void {
    this.executeWithLoading(
      this.transactionApiService.getAllTransactionsSummary(),
      undefined,
      'Loading summary'
    ).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.showSummary.set(true);

        // Hide the summary after 5 seconds
        setTimeout(() => {
          this.showSummary.set(false);
        }, 5000);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.handleFile(file);
    }
  }

  handleFile(file: File): void {
    if (file.type === 'text/csv') {
      const requestId = uuidv4();
      const correlationId = this.correlationService.setCorrelationId(requestId);

      this.importLoading.set(true);

      this.executeWithLoading(
        this.transactionApiService.uploadCsv(file, correlationId),
        'CSV file uploaded successfully',
        'Uploading CSV file'
      ).subscribe({
        next: (transactions) => {
          this.allTransactions.set(transactions);
          this.dataSource.update(ds => {
            ds.data = transactions;
            return ds;
          });
        },
        complete: () => {
          this.importLoading.set(false);
        }
      });
    } else {
      this.showError('Invalid file type. Please upload a CSV file.');
    }
  }

  syncScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const topScroll = document.querySelector('.table-scroll-top') as HTMLElement;
    const bottomScroll = this.tableContainer.nativeElement;

    if (target === topScroll) {
      bottomScroll.scrollLeft = target.scrollLeft;
    } else if (target === bottomScroll) {
      topScroll.scrollLeft = target.scrollLeft;
    }
  }
}
