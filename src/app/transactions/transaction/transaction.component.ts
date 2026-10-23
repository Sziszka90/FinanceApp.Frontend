import { Component, effect, inject, OnInit, ViewChild, signal, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Observable, Subject, debounceTime } from 'rxjs';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { MatDialog } from '@angular/material/dialog';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { UpdateTransactionModalComponent } from '../update-transaction-modal/update-transaction-modal.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FormField, form } from '@angular/forms/signals';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { MatSelectModule } from '@angular/material/select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { CreateTransactionModalComponent } from '../create-transaction-modal/create-transaction-modal.component';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { Money } from 'src/models/Money/money.dto';
import { AuthenticationService } from 'src/services/authentication.service';
import { CorrelationService } from 'src/services/correlation.service';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'src/services/notification.service';
import { PdfImportJobsService } from 'src/services/pdf-import-jobs.service';
import { BaseComponent } from 'src/app/shared/base-component';
import { ColumnResizeDirective } from '../../shared/directives/column-resize.directive';

@Component({
  selector: 'transaction',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    FormField,
    BsDatepickerModule,
    LoaderComponent,
    ColumnResizeDirective
  ],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class TransactionComponent extends BaseComponent implements OnInit {
  private transactionApiService = inject(TransactionApiService);
  private matDialog = inject(MatDialog);
  private authService = inject(AuthenticationService);
  private correlationService = inject(CorrelationService);
  private notificationService = inject(NotificationService);
  public pdfImportJobs = inject(PdfImportJobsService);

  public summary$: Observable<Money> | undefined;
  public transactions$: Observable<GetTransactionDto[]> | undefined;
  public allTransactions = signal<GetTransactionDto[]>([]);
  public total = signal<Money>({ amount: 0, currency: CurrencyEnum.EUR });
  public showSummary = signal<boolean>(false);
  public summary = signal<Money | null>(null);
  public uploadingPdf = signal<boolean>(false);
  public loadingMore = signal<boolean>(false);
  public nextCursor = signal<string | null>(null);
  private readonly filterChanges = new Subject<void>();
  private readonly pageSize = 50;
  private pageRequestVersion = 0;
  dataSource = signal<MatTableDataSource<GetTransactionDto>>(new MatTableDataSource<GetTransactionDto>([]));

  typeOptions: { name: string; value: TransactionTypeEnum }[] = [
    { name: 'Expense', value: TransactionTypeEnum.Expense },
    { name: 'Income', value: TransactionTypeEnum.Income }
  ];

  readonly filterModel = signal({
    name: '',
    date: null as Date | null,
    type: null as TransactionTypeEnum | null
  });
  readonly filterForm = form(this.filterModel);
  private filterEffect = effect(() => {
    this.filterModel();
    this.filterChanges.next();
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
    this.configureSortingDataAccessor(this.dataSource());
    this.filterChanges.pipe(debounceTime(300)).subscribe(() => this.loadTransactions());
    this.loadTransactions();

    this.notificationService.notifications$.subscribe(() => {
      console.info('Transactions: reloading after SignalR notification');
      this.loadTransactions();
    });
    this.notificationService.imported$.subscribe(() => this.loadTransactions());
  }

  loadTransactions(): void {
    const requestVersion = ++this.pageRequestVersion;
    this.setLoading(true);
    this.loadingMore.set(false);
    this.nextCursor.set(null);
    this.transactionApiService.getTransactionsPage(this.pageSize, null, this.getPageFilter()).subscribe({
      next: page => {
        if (requestVersion !== this.pageRequestVersion) return;
        this.setLoading(false);
        this.allTransactions.set(page.items);
        this.dataSource().data = page.items;
        this.nextCursor.set(page.nextCursor);
      },
      error: error => {
        if (requestVersion !== this.pageRequestVersion) return;
        this.setLoading(false);
        this.handleError(error, 'Loading transactions');
      }
    });
  }

  loadMoreTransactions(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingMore()) return;

    const requestVersion = this.pageRequestVersion;
    this.loadingMore.set(true);
    this.transactionApiService.getTransactionsPage(this.pageSize, cursor, this.getPageFilter()).subscribe({
      next: page => {
        if (requestVersion !== this.pageRequestVersion) return;
        const transactions = [...this.allTransactions(), ...page.items];
        this.allTransactions.set(transactions);
        this.dataSource().data = transactions;
        this.nextCursor.set(page.nextCursor);
        this.loadingMore.set(false);
      },
      error: error => {
        if (requestVersion !== this.pageRequestVersion) return;
        this.loadingMore.set(false);
        this.handleError(error, 'Loading more transactions');
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.sort && this.dataSource().sort !== this.sort) {
      this.dataSource().sort = this.sort;
    }
  }

  private configureSortingDataAccessor(dataSource: MatTableDataSource<GetTransactionDto>): void {
    dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'amount': return item.value?.amount;
        case 'currency': return item.value.currency;
        case 'transactionDate': return new Date(item.transactionDate).getTime();
        case 'group': return item.transactionGroup?.name ?? '';
        default: return (item as any)[property];
      }
    };
  }

  private getPageFilter() {
    const { name, date, type } = this.filterModel();
    return {
      transactionName: name.trim() || undefined,
      transactionDate: date ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString() : undefined,
      transactionType: type ?? undefined
    };
  }

  deleteTransaction(transactionDto: GetTransactionDto) {
    this.allTransactions.update(transactions => transactions.filter(t => t.id !== transactionDto.id));
    this.dataSource.update(ds => {
      ds.data = this.allTransactions();
      return ds;
    });

    this.transactionApiService.deleteTransaction(transactionDto.id).subscribe({
      next: () => {
        this.showSuccess('Transaction deleted successfully!');
      },
      error: error => {
        this.handleError(error, 'Deleting transaction');
      }
    });
  }

  async editTransaction(transactionDto: GetTransactionDto) {
    const result = await this.authService.isAuthenticatedAsync();
    if (!result) {
      await this.authService.logoutAsync();
      return;
    }

    const dialogRef = this.matDialog.open(UpdateTransactionModalComponent, {
      autoFocus: true,
      width: '760px',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: '90vh',
      data: transactionDto
    });

    dialogRef.afterClosed().subscribe({
      next: (updatedTransaction: GetTransactionDto) => {
        if (updatedTransaction) {
          this.allTransactions?.update(transactions =>
            transactions.map((transaction: GetTransactionDto) => {
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
            })
          );
        }
        this.dataSource.update(ds => {
          ds.data = this.allTransactions();
          return ds;
        });
      },
      error: error => {
        this.handleError(error, 'Updating transaction');
      }
    });
  }

  async createTransaction() {
    const result = await this.authService.isAuthenticatedAsync();
    if (!result) {
      await this.authService.logoutAsync();
      return;
    }

    const dialogRef = this.matDialog.open(CreateTransactionModalComponent, {
      autoFocus: true,
      width: '760px',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe({
      next: (createdTransaction: GetTransactionDto) => {
        if (createdTransaction) {
          this.loadTransactions();
        }
      },
      error: error => {
        this.handleError(error, 'Creating transaction');
      }
    });
  }

  resetFilters() {
    this.filterModel.set({ name: '', date: null, type: null });

  }

  getSummary(): void {
    this.setLoading(true);
    this.transactionApiService.getAllTransactionsSummary().subscribe({
      next: data => {
        this.setLoading(false);
        this.summary.set(data);
        this.showSummary.set(true);

        setTimeout(() => {
          this.showSummary.set(false);
        }, 5000);
      },
      error: error => {
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
    if (file.name.toLowerCase().endsWith('.pdf') && file.size > 0 && file.size <= 10 * 1024 * 1024) {
      const requestId = uuidv4();
      const correlationId = this.correlationService.setCorrelationId(requestId);

      this.pdfImportJobs.add(correlationId, file.name);
      this.uploadingPdf.set(true);

      this.transactionApiService.uploadPdf(file, correlationId).subscribe({
        next: () => {
          this.pdfImportJobs.markQueued(correlationId);
          this.uploadingPdf.set(false);
          this.showSuccess('PDF uploaded and added to the import queue.');
        },
        error: error => {
          this.pdfImportJobs.fail(correlationId, 'Upload failed. Please try again.');
          this.uploadingPdf.set(false);
          this.handleError(error, 'Uploading PDF file');
        }
      });
    } else {
      this.showError('Choose a PDF file smaller than 10 MB.');
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
