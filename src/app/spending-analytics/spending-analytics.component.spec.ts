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
import { TopTransactionGroupDto } from 'src/models/TransactionGroupDtos/top-transaction-group.dto';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';

describe('SpendingAnalyticsComponent', () => {
  let component: SpendingAnalyticsComponent;
  let fixture: ComponentFixture<SpendingAnalyticsComponent>;

  beforeEach(async () => {
    const transactionApiService = jasmine.createSpyObj<TransactionApiService>('TransactionApiService', [
      'getTopTransactionGroups'
    ]);
    transactionApiService.getTopTransactionGroups.and.returnValue(of([]));

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

  it('should show expenses and income from the matching signed group totals', () => {
    const groups = [
      {
        id: 'expense-group',
        name: 'Groceries',
        totalAmount: { amount: 100, currency: CurrencyEnum.EUR },
        transactionCount: 2,
        percentage: 50
      },
      {
        id: 'income-group',
        name: 'Salary',
        totalAmount: { amount: -200, currency: CurrencyEnum.EUR },
        transactionCount: 1,
        percentage: 50
      }
    ] as TopTransactionGroupDto[];
    const processTopGroups = (component as unknown as {
      processTopGroups: (topGroups: TopTransactionGroupDto[], transactionType: TransactionTypeEnum) => void;
    }).processTopGroups;

    processTopGroups.call(component, groups, TransactionTypeEnum.Expense);
    expect(component.spendingData().map(group => group.groupName)).toEqual(['Groceries']);

    processTopGroups.call(component, groups, TransactionTypeEnum.Income);
    expect(component.spendingData().map(group => group.groupName)).toEqual(['Salary']);
  });
});
