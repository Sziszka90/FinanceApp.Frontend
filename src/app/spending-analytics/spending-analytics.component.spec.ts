import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpendingAnalyticsComponent } from './spending-analytics.component';
import { TransactionApiService } from 'src/services/transactions.api.service';
import { UserApiService } from 'src/services/user.api.service';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
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
});
