import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SpendingAnalyticsComponent } from './spending-analytics.component';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { UserApiService } from 'src/services/user.api.service';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { TransactionTypeEnum } from 'src/models/Enums/transaction-type.enum';
import { GetTransactionDto } from 'src/models/TransactionDtos/get-transaction.dto';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';

describe('SpendingAnalyticsComponent', () => {
  let component: SpendingAnalyticsComponent;
  let fixture: ComponentFixture<SpendingAnalyticsComponent>;

  beforeEach(async () => {
    const transactionApiService = jasmine.createSpyObj<TransactionApiService>('TransactionApiService', [
      'getAllTransactions'
    ]);
    transactionApiService.getAllTransactions.and.returnValue(of([]));

    const userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getActiveUser']);
    userApiService.getActiveUser.and.returnValue(
      of({
        id: 'test-user',
        userName: 'testuser',
        email: 'test@example.com',
        baseCurrency: CurrencyEnum.EUR
      } as GetUserDto)
    );

    await TestBed.configureTestingModule({
      imports: [SpendingAnalyticsComponent, BrowserAnimationsModule],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: TransactionApiService, useValue: transactionApiService },
        { provide: UserApiService, useValue: userApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpendingAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.loading()).toBe(false);
    expect(component.spendingData()).toEqual([]);
    expect(component.totalSpending()).toBe(0);
    expect(component.chartType()).toBe('pie');
  });

  it('should toggle chart type', () => {
    expect(component.chartType()).toBe('pie');
    component.toggleChartType();
    expect(component.chartType()).toBe('bar');
    component.toggleChartType();
    expect(component.chartType()).toBe('pie');
  });

  it('should map income and expense buttons to their matching transaction types', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.transaction-type-toggle button'));

    buttons[0].nativeElement.click();
    fixture.detectChanges();
    expect(component.filterModel().transactionType).toBe(TransactionTypeEnum.Income);

    buttons[1].nativeElement.click();
    fixture.detectChanges();
    expect(component.filterModel().transactionType).toBe(TransactionTypeEnum.Expense);
  });

  it('should show the selected transaction type in the summary', () => {
    component.spendingData.set([
      {
        groupName: 'Salary',
        totalAmount: 100,
        transactionCount: 1,
        percentage: 100
      }
    ]);
    component.totalSpending.set(100);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.summary-card h3')).nativeElement.textContent.trim()).toBe(
      'Total Expenses'
    );

    component.filterForm.transactionType().value.set(TransactionTypeEnum.Income);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.summary-card h3')).nativeElement.textContent.trim()).toBe('Total Income');
  });

  it('should show only the selected transaction type for each category', () => {
    const transactions = [
      {
        id: 'expense-transaction',
        name: 'Groceries',
        value: { amount: 100, currency: CurrencyEnum.EUR },
        transactionType: TransactionTypeEnum.Expense,
        transactionDate: new Date('2026-01-15'),
        transactionGroup: { id: 'groceries', name: 'Groceries' }
      },
      {
        id: 'income-transaction',
        name: 'Salary',
        value: { amount: 200, currency: CurrencyEnum.EUR },
        transactionType: 'Income' as unknown as TransactionTypeEnum,
        transactionDate: new Date('2026-01-20'),
        transactionGroup: { id: 'salary', name: 'Salary' }
      }
    ] as GetTransactionDto[];
    const processTransactions = (component as unknown as {
      processTransactions: (
        transactions: GetTransactionDto[],
        startDate: Date,
        endDate: Date,
        transactionType: TransactionTypeEnum
      ) => void;
    }).processTransactions;
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    processTransactions.call(component, transactions, startDate, endDate, TransactionTypeEnum.Expense);
    expect(component.spendingData().map(group => group.groupName)).toEqual(['Groceries']);

    processTransactions.call(component, transactions, startDate, endDate, TransactionTypeEnum.Income);
    expect(component.spendingData().map(group => group.groupName)).toEqual(['Salary']);
  });
});
