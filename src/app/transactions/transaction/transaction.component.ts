import { Component, inject, OnInit, ViewChild, signal, ElementRef } from '@angular/core';
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
  public total = signal<Money>({ amount: 0, currency: CurrencyEnum.EUR });
  public showSummary = signal<boolean>(false);
  public summary = signal<Money | null>(null);
  dataSource = signal<MatTableDataSource<GetTransactionDto>>(new MatTableDataSource<GetTransactionDto>([]));

  typeOptions: {name: string, value: TransactionTypeEnum}[] = [{ name: 'Expense', value: TransactionTypeEnum.Expense }, { name: 'Income', value: TransactionTypeEnum.Income }];

  filterForm: FormGroup = this.fb.group({
    name: [''],
    date: [''],
    type: []
  });

  displayedColumns: string[] = [
    'name',
    'description',
    'amount',
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
          case 'amount':
            const amount = item.value?.amount;
            console.log('Sorting Amount:', amount, 'for item', item);
            return amount;
          case 'currency': return item.value.currency;
          case 'transactionDate': return new Date(item.transactionDate);
          case 'group': return item.transactionGroup?.name ?? '';
          default: return (item as any)[property];
        }
      };
      return ds;
    });

    this.loadTransactions();

    this.filterForm.valueChanges.subscribe({
      next: () => this.applyFilters()
    });

    this.notificationService.notifications$.subscribe({
      next: (message) => {
        if (message && message === REFRESH_TRANSACTIONS) {
          this.loadTransactions();
        }
      }
    });
  }

  loadTransactions() {
    this.setLoading(true);
    this.transactionApiService.getAllTransactions().subscribe({
      next: (value: GetTransactionDto[]) => {
        this.setLoading(false);
        this.allTransactions.set(value);
        this.dataSource.update(ds => {
          ds.data = value;
          return ds;
        });
        this.setupCustomFilterPredicate();
        this.showSuccess('Transactions loaded successfully!');
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Loading transactions');
      }
    });
  }

  ngAfterViewChecked() {
    if (this.sort && this.dataSource().sort !== this.sort) {
      this.dataSource.update(ds => {
        ds.sort = this.sort;
        return ds;
      });
      if (this.sort.sortChange) {
        this.sort.sortChange.emit();
      }
    }
  }

  setupCustomFilterPredicate() {
    this.dataSource.update(ds => {
      ds.filterPredicate = (data: GetTransactionDto, filter: string) => {
        const filterObj = JSON.parse(filter);
        const { name, date, type } = filterObj;

        return (!name || data.name.toLowerCase().includes(name.toLowerCase())) &&
              (!date || (
                data.transactionDate &&
                formatDate(data.transactionDate, 'yyyy-MM-dd', 'en-US') === date
              )) &&
              (!type || data.transactionType === type);
      };
      return ds;
    });
  }

  applyFilters() {
    const { name, date, type } = this.filterForm.value;
    const formattedDate = date ? formatDate(date, 'yyyy-MM-dd', 'en-US') : '';

    this.dataSource.update(ds => {
      ds.filter = JSON.stringify({ name, date: formattedDate, type });
      return ds;
    });

    if (this.sort.active && this.sort.direction !== '') {
      this.dataSource().data = [...this.dataSource().filteredData];
    }
  }

  deleteTransaction(transactionDto: GetTransactionDto) {
    this.allTransactions.update(transactions => transactions.filter((t) => t.id !== transactionDto.id));
    this.dataSource.update(ds => {
      ds.data = this.allTransactions();
      return ds;
    });

    this.setLoading(true);
    this.transactionApiService.deleteTransaction(transactionDto.id).subscribe({
      next: () => {
        this.setLoading(false);
        this.showSuccess('Transaction deleted successfully!');
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Deleting transaction');
      }
    });
  }

  async editTransaction(transactionDto: GetTransactionDto) {
    const result = await this.authService.isAuthenticatedAsync();
    if( !result) {
      await this.authService.logoutAsync();
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

    dialogRef.afterClosed().subscribe({
      next: (updatedTransaction: GetTransactionDto) => {
        if (updatedTransaction) {
          this.allTransactions?.update(transactions => transactions.map((transaction: GetTransactionDto) => {
            if (transaction.id === updatedTransaction.id) {
              return {
                ...transaction,
                name: updatedTransaction.name,
                description: updatedTransaction.description,
                value: updatedTransaction.value,
                transactionDate: updatedTransaction.transactionDate,
                transactionType: updatedTransaction.transactionType,
                transactionGroup: updatedTransaction.transactionGroup
              };
            }
            return transaction;
          }));
        }
        this.dataSource.update(ds => {
          ds.data = this.allTransactions();
          return ds;
        });
      },
      error: (error) => {
        this.handleError(error, 'Updating transaction');
      }
    });
  }

  async createTransaction() {
    const result = await this.authService.isAuthenticatedAsync();
    if( !result) {
      await this.authService.logoutAsync();
      return;
    }

    const dialogRef = this.matDialog.open(
      CreateTransactionModalComponent,
      {
        autoFocus: true,
        maxHeight: '90vh'
      }
    );

    dialogRef.afterClosed().subscribe({
      next: (createdTransaction: GetTransactionDto) => {
        if (createdTransaction) {
          this.allTransactions.update(transactions => [...transactions, createdTransaction]);
          this.dataSource.update(ds => {
            ds.data = this.allTransactions();
            return ds;
          });
        }
      },
      error: (error) => {
        this.handleError(error, 'Creating transaction');
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
    this.setLoading(true);
    this.transactionApiService.getAllTransactionsSummary().subscribe({
      next: (data) => {
        this.setLoading(false);
        this.summary.set(data);
        this.showSummary.set(true);

        setTimeout(() => {
          this.showSummary.set(false);
        }, 5000);
      },
      error: (error) => {
        this.setLoading(false);
        this.handleError(error, 'Loading summary');
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

      this.setLoading(true);

      this.transactionApiService.uploadCsv(file, correlationId).subscribe({
        next: (transactions) => {
          this.setLoading(false);
          this.allTransactions.set(transactions);
          this.dataSource.update(ds => {
            ds.data = transactions;
            return ds;
          });
          this.showSuccess('CSV file uploaded successfully!');
        },
        error: (error) => {
          this.setLoading(false);
          this.handleError(error, 'Uploading CSV file');
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
